// Delete employee - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DeleteEmployeeRequest {
  employee_id: string;
  user_email?: string;
}

interface DeleteEmployeeResponse {
  message: string;
  deleted_employee: {
    id: string;
    name: string;
    email: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Get user info from request body for custom auth
    const body: DeleteEmployeeRequest = await req.json();
    
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
    }

    if (!body.employee_id) {
      return createErrorResponse('Employee ID is required', 400);
    }

    // Get user info from database
    const { data: userRecord, error: userError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email')
      .eq('email', body.user_email)
      .single();

    if (userError || !userRecord) {
      return createErrorResponse('User not found or not authorized', 401);
    }

    // Check if employee exists and belongs to the same organization
    const { data: existingEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, email, org_id')
      .eq('id', body.employee_id)
      .eq('org_id', userRecord.org_id)
      .single();

    if (employeeError || !existingEmployee) {
      return createErrorResponse('Employee not found or not authorized', 404);
    }

    // Check if employee has any orders (optional - you might want to prevent deletion if they have orders)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('employee_id', body.employee_id)
      .limit(1);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      // Continue with deletion even if we can't check orders
    }

    if (orders && orders.length > 0) {
      return createErrorResponse('Cannot delete employee with existing orders. Please handle their orders first.', 400);
    }

    // Delete employee record
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', body.employee_id);

    if (deleteError) {
      return createErrorResponse(`Failed to delete employee: ${deleteError.message}`, 400);
    }

    const response: DeleteEmployeeResponse = {
      message: 'Employee deleted successfully',
      deleted_employee: {
        id: existingEmployee.id,
        name: existingEmployee.name,
        email: existingEmployee.email
      }
    };

    return createSuccessResponse(response, 'Employee deleted successfully');

  } catch (error) {
    console.error('Delete employee error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
