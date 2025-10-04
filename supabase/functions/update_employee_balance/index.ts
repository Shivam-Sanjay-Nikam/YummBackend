// Update employee balance - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../shared/utils.ts';
import { authenticateUser } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateBalanceRequest {
  employee_id: string;
  new_balance: number;
}

interface UpdateBalanceResponse {
  employee: {
    id: string;
    name: string;
    email: string;
    old_balance: number;
    new_balance: number;
    updated_at: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'PUT') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const authResult = await authenticateUser(authHeader || '');
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Check if user is organization_staff
    if (authResult.user.role !== 'organization_staff') {
      return createErrorResponse('Only organization staff can update employee balance', 403);
    }

    const body: UpdateBalanceRequest = await req.json();

    // Validate required fields
    if (!body.employee_id || body.new_balance === undefined) {
      return createErrorResponse('Missing required fields: employee_id, new_balance', 400);
    }

    // Validate employee_id format
    if (!validateUuid(body.employee_id)) {
      return createErrorResponse('Invalid employee ID format', 400);
    }

    // Validate balance
    if (typeof body.new_balance !== 'number' || body.new_balance < 0) {
      return createErrorResponse('Balance must be a non-negative number', 400);
    }

    // Get current employee data
    const { data: currentEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, email, balance, org_id')
      .eq('id', body.employee_id)
      .single();

    if (fetchError || !currentEmployee) {
      return createErrorResponse('Employee not found', 404);
    }

    // Check if employee belongs to the same organization
    if (currentEmployee.org_id !== authResult.user.org_id) {
      return createErrorResponse('Employee does not belong to your organization', 403);
    }

    // Update employee balance
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({ balance: body.new_balance })
      .eq('id', body.employee_id)
      .select('id, name, email, balance, updated_at')
      .single();

    if (updateError || !updatedEmployee) {
      return createErrorResponse(`Failed to update balance: ${updateError?.message}`, 400);
    }

    const response: UpdateBalanceResponse = {
      employee: {
        id: updatedEmployee.id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        old_balance: currentEmployee.balance,
        new_balance: updatedEmployee.balance,
        updated_at: updatedEmployee.updated_at
      }
    };

    return createSuccessResponse(response, 'Employee balance updated successfully');

  } catch (error) {
    console.error('Update employee balance error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
