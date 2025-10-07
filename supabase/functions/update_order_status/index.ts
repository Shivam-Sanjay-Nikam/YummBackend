// Update order status - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateOrderStatusRequest {
  order_id: string;
  status: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';
  user_email?: string;
}

interface UpdateOrderStatusResponse {
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
    const body: UpdateOrderStatusRequest = await req.json();

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
      return createErrorResponse('Only vendors can update order status', 403);
    }

    // Validate required fields
    if (!body.order_id || !body.status) {
      return createErrorResponse('Missing required fields: order_id, status', 400);
    }

    // Validate order_id format
    if (!validateUuid(body.order_id)) {
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Validate status
    const validStatuses = ['placed', 'preparing', 'prepared', 'given', 'cancelled', 'cancel_requested'];
    if (!validStatuses.includes(body.status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Get order details including employee_id and total_amount for balance update
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, vendor_id, org_id, employee_id, total_amount, status, created_at')
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

    // Allow any status transition - vendor can set any status they want

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.order_id)
      .select('id, status, updated_at')
      .single();

    if (updateError || !updatedOrder) {
      return createErrorResponse(`Failed to update order status: ${updateError?.message}`, 400);
    }

    // Handle balance updates based on status changes
    if (body.status === 'given' && order.status !== 'given') {
      // Status changed TO 'given' - deduct balance
      try {
        // Get current employee balance
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('balance')
          .eq('id', order.employee_id)
          .single();

        if (employeeError || !employee) {
          console.error('Failed to get employee balance:', employeeError);
          // Don't fail the order update, just log the error
        } else {
          // Calculate new balance (deduct order amount)
          const currentBalance = parseFloat(employee.balance.toString());
          const orderAmount = parseFloat(order.total_amount.toString());
          const newBalance = currentBalance - orderAmount;

          // Check if employee has sufficient balance
          if (newBalance < 0) {
            console.warn(`Employee balance would go negative: ${currentBalance} - ${orderAmount} = ${newBalance}. Proceeding with negative balance.`);
          }

          // Update employee balance
          const { error: balanceUpdateError } = await supabase
            .from('employees')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.employee_id);

          if (balanceUpdateError) {
            console.error('Failed to update employee balance:', balanceUpdateError);
            // Don't fail the order update, just log the error
          } else {
            console.log(`Employee balance deducted: ${currentBalance} - ${orderAmount} = ${newBalance}`);
          }
        }
      } catch (balanceError) {
        console.error('Error updating employee balance:', balanceError);
        // Don't fail the order update, just log the error
      }
    } else if (order.status === 'given' && body.status !== 'given') {
      // Status changed FROM 'given' to something else - restore balance
      try {
        // Get current employee balance
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('balance')
          .eq('id', order.employee_id)
          .single();

        if (employeeError || !employee) {
          console.error('Failed to get employee balance:', employeeError);
          // Don't fail the order update, just log the error
        } else {
          // Calculate new balance (restore order amount)
          const currentBalance = parseFloat(employee.balance.toString());
          const orderAmount = parseFloat(order.total_amount.toString());
          const newBalance = currentBalance + orderAmount;

          // Update employee balance
          const { error: balanceUpdateError } = await supabase
            .from('employees')
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.employee_id);

          if (balanceUpdateError) {
            console.error('Failed to restore employee balance:', balanceUpdateError);
            // Don't fail the order update, just log the error
          } else {
            console.log(`Employee balance restored: ${currentBalance} + ${orderAmount} = ${newBalance}`);
          }
        }
      } catch (balanceError) {
        console.error('Error restoring employee balance:', balanceError);
        // Don't fail the order update, just log the error
      }
    }

    let message = `Order status updated to ${body.status}`;
    if (body.status === 'given' && order.status !== 'given') {
      message += '. Employee balance has been deducted.';
    } else if (order.status === 'given' && body.status !== 'given') {
      message += '. Employee balance has been restored.';
    }

    const response: UpdateOrderStatusResponse = {
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updated_at: updatedOrder.updated_at
      },
      message: message
    };

    return createSuccessResponse(response, 'Order status updated successfully');

  } catch (error) {
    console.error('Update order status error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
