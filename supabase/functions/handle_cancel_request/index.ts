// Handle cancel request - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

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

    // Get order details with vendor information and total amount
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        employee_id,
        vendor_id,
        org_id,
        status,
        total_amount,
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

    let response: HandleCancelResponse;

    if (body.action === 'accept') {
      // When cancellation is accepted, delete the order and restore balance if needed
      try {
        // Check if balance was already deducted (order was previously 'given')
        let balanceRestored = false;
        
        // Get current employee balance
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('balance')
          .eq('id', order.employee_id)
          .single();

        if (!employeeError && employee) {
          // Restore balance (add back the order amount)
          const currentBalance = parseFloat(employee.balance.toString());
          const orderAmount = parseFloat(order.total_amount.toString());
          const newBalance = currentBalance + orderAmount;

          const { error: balanceUpdateError } = await supabase
            .from('employees')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.employee_id);

          if (!balanceUpdateError) {
            balanceRestored = true;
            console.log(`Employee balance restored: ${currentBalance} + ${orderAmount} = ${newBalance}`);
          } else {
            console.error('Failed to restore employee balance:', balanceUpdateError);
          }
        }

        // Delete the order (this will cascade delete order_items due to foreign key constraints)
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', body.order_id);

        if (deleteError) {
          return createErrorResponse(`Failed to delete order: ${deleteError.message}`, 400);
        }

        response = {
          order: {
            id: order.id,
            status: 'deleted',
            updated_at: new Date().toISOString()
          },
          message: `Cancellation request accepted. Order has been deleted.${balanceRestored ? ' Employee balance has been restored.' : ''}`
        };

      } catch (error) {
        console.error('Error handling cancellation acceptance:', error);
        return createErrorResponse('Failed to process cancellation acceptance', 500);
      }

    } else {
      // When cancellation is rejected, update status back to preparing
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'preparing',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.order_id)
        .select('id, status, updated_at')
        .single();

      if (updateError || !updatedOrder) {
        return createErrorResponse(`Failed to update order: ${updateError?.message}`, 400);
      }

      response = {
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          updated_at: updatedOrder.updated_at
        },
        message: 'Cancellation request rejected. Order is back to preparing status.'
      };
    }

    return createSuccessResponse(response, `Cancellation request ${body.action}ed successfully`);

  } catch (error) {
    console.error('Handle cancel request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
