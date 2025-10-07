// Cancel order request - only accessible by employee
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CancelOrderRequest {
  order_id: string;
  reason?: string;
  user_email?: string;
}

interface CancelOrderResponse {
  order: {
    id: string;
    status: string;
    updated_at: string;
  };
  message: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: CancelOrderRequest = await req.json();
    

    // Authenticate user using email
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
    }

    const authResult = await authenticateUserByEmail(body.user_email);
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication failed', 401);
    }

    // Check if user is employee
    if (authResult.user.role !== 'employee') {
      return createErrorResponse('Only employees can request order cancellation', 403);
    }

    // Validate required fields
    if (!body.order_id) {
      return createErrorResponse('Missing required field: order_id', 400);
    }

    // Validate order_id format
    if (!validateUuid(body.order_id)) {
      return createErrorResponse(`Invalid order ID format: ${body.order_id}`, 400);
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, employee_id, org_id, status, created_at')
      .eq('id', body.order_id)
      .single();

    if (orderError || !order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check if order belongs to the employee
    if (order.employee_id !== authResult.user.user_id) {
      return createErrorResponse('Order does not belong to you', 403);
    }

    // Check if order belongs to the same organization
    if (order.org_id !== authResult.user.org_id) {
      return createErrorResponse('Order does not belong to your organization', 403);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['placed', 'preparing', 'prepared'];
    if (!cancellableStatuses.includes(order.status)) {
      if (order.status === 'given') {
        return createErrorResponse('Order cannot be cancelled once it has been given to the employee', 400);
      }
      return createErrorResponse(`Order cannot be cancelled. Current status: ${order.status}`, 400);
    }

    // Update order status to cancel_requested
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancel_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.order_id)
      .select('id, status, updated_at')
      .single();

    if (updateError || !updatedOrder) {
      return createErrorResponse(`Failed to request cancellation: ${updateError?.message}`, 400);
    }

    const response: CancelOrderResponse = {
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updated_at: updatedOrder.updated_at
      },
      message: 'Cancellation request sent to vendor. Waiting for vendor response.'
    };

    return createSuccessResponse(response, 'Cancellation request submitted successfully');

  } catch (error) {
    console.error('Cancel order request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
