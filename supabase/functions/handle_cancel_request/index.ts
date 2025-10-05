// Handle cancel request - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../shared/utils.ts';
import { authenticateUserByEmail } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface HandleCancelRequest {
  order_id: string;
  action: 'accept' | 'reject';
  reason?: string;
  user_email?: string;
}

interface HandleCancelResponse {
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
    const body: HandleCancelRequest = await req.json();

    // Authenticate user using email
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
    }

    const authResult = await authenticateUserByEmail(body.user_email);
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication failed', 401);
    }

    // Check if user is vendor
    if (authResult.user.role !== 'vendor') {
      return createErrorResponse('Only vendors can handle cancel requests', 403);
    }

    // Validate required fields
    if (!body.order_id || !body.action) {
      return createErrorResponse('Missing required fields: order_id, action', 400);
    }

    // Validate order_id format
    if (!validateUuid(body.order_id)) {
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Validate action
    if (!['accept', 'reject'].includes(body.action)) {
      return createErrorResponse('Action must be either "accept" or "reject"', 400);
    }

    // Get order details with vendor information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        employee_id,
        vendor_id,
        org_id,
        status,
        created_at,
        employees!inner(name, email),
        vendors!inner(name)
      `)
      .eq('id', body.order_id)
      .single();

    if (orderError || !order) {
      return createErrorResponse('Order not found', 404);
    }

    // Check if order belongs to the vendor
    if (order.vendor_id !== authResult.user.user_id) {
      return createErrorResponse('Order does not belong to you', 403);
    }

    // Check if order belongs to the same organization
    if (order.org_id !== authResult.user.org_id) {
      return createErrorResponse('Order does not belong to your organization', 403);
    }

    // Check if order has a cancel request
    if (order.status !== 'cancel_requested') {
      return createErrorResponse(`Order does not have a pending cancellation request. Current status: ${order.status}`, 400);
    }

    let newStatus: string;
    let message: string;

    if (body.action === 'accept') {
      newStatus = 'cancelled';
      message = 'Cancellation request accepted. Order has been cancelled.';
    } else {
      newStatus = 'preparing';
      message = 'Cancellation request rejected. Order is back to preparing status.';
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.order_id)
      .select('id, status, updated_at')
      .single();

    if (updateError || !updatedOrder) {
      return createErrorResponse(`Failed to update order: ${updateError?.message}`, 400);
    }

    // If cancellation was accepted, we might want to refund the employee's balance
    if (body.action === 'accept') {
      // Get order total for potential refund
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('total_cost')
        .eq('order_id', body.order_id);

      if (!itemsError && orderItems) {
        const totalRefund = orderItems.reduce((sum, item) => sum + item.total_cost, 0);
        
        // Update employee balance (add refund)
        const { data: employee } = await supabase
          .from('employees')
          .select('balance')
          .eq('id', order.employee_id)
          .single();

        if (employee) {
          const newBalance = employee.balance + totalRefund;
          await supabase
            .from('employees')
            .update({ balance: newBalance })
            .eq('id', order.employee_id);
        }
      }
    }

    const response: HandleCancelResponse = {
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updated_at: updatedOrder.updated_at
      },
      message
    };

    return createSuccessResponse(response, `Cancellation request ${body.action}ed successfully`);

  } catch (error) {
    console.error('Handle cancel request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
