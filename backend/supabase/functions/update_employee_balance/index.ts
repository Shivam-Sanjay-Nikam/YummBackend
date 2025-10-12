// Update employee balance - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { authenticateUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateEmployeeBalanceRequest {
  employee_id: string;
  new_balance: number;
}

interface UpdateEmployeeBalanceResponse {
  employee: {
    id: string;
    org_id: string;
    name: string;
    email: string;
    balance: number;
    updated_at: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate the requesting user using Supabase Auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authorization header is required', 401);
    }

    const authResult = await authenticateUser(authHeader);
    if (!authResult.success) {
      return createErrorResponse('Authentication failed', 401);
    }

    const body: UpdateEmployeeBalanceRequest = await req.json();

    if (!body.employee_id) {
      return createErrorResponse('Employee ID is required', 400);
    }

    if (body.new_balance === undefined || body.new_balance === null) {
      return createErrorResponse('New balance is required', 400);
    }

    // Validate balance is a number
    if (typeof body.new_balance !== 'number' || isNaN(body.new_balance)) {
      return createErrorResponse('Balance must be a valid number', 400);
    }

    // Check if employee exists and belongs to the same organization
    const { data: existingEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', body.employee_id)
      .eq('org_id', authResult.user!.org_id)
      .single();

    if (employeeError || !existingEmployee) {
      return createErrorResponse('Employee not found or not authorized', 404);
    }

    // Update employee balance
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({ 
        balance: body.new_balance,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.employee_id)
      .select()
      .single();

    if (updateError || !updatedEmployee) {
      return createErrorResponse(`Failed to update employee balance: ${updateError?.message}`, 400);
    }

    const response: UpdateEmployeeBalanceResponse = {
      employee: {
        id: updatedEmployee.id,
        org_id: updatedEmployee.org_id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        balance: updatedEmployee.balance,
        updated_at: updatedEmployee.updated_at
      }
    };

    return createSuccessResponse(response, 'Employee balance updated successfully');

  } catch (error) {
    console.error('Update employee balance error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});