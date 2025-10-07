// Delete order - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DeleteOrderRequest {
  order_id: string;
  user_email?: string;
}

interface DeleteOrderResponse {
  message: string;
  deleted_order_id: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: DeleteOrderRequest = await req.json();

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
      return createErrorResponse('Only vendors can delete orders', 403);
    }

    // Validate required fields
    if (!body.order_id) {
      return createErrorResponse('Missing required field: order_id', 400);
    }

    // Validate order_id format
    if (!validateUuid(body.order_id)) {
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, org_id, status')
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

    // Allow deletion of orders with any status

    // Delete order items first (due to foreign key constraint)
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', body.order_id);

    if (orderItemsError) {
      return createErrorResponse(`Failed to delete order items: ${orderItemsError.message}`, 400);
    }

    // Delete the order
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', body.order_id);

    if (deleteError) {
      return createErrorResponse(`Failed to delete order: ${deleteError.message}`, 400);
    }

    const response: DeleteOrderResponse = {
      message: 'Order deleted successfully',
      deleted_order_id: body.order_id
    };

    return createSuccessResponse(response, 'Order deleted successfully');

  } catch (error) {
    console.error('Delete order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
