// Update employee - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateEmployeeRequest {
  employee_id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  special_number?: string;
  user_email?: string;
}

interface UpdateEmployeeResponse {
  employee: {
    id: string;
    org_id: string;
    name: string;
    email: string;
    phone_number?: string;
    special_number?: string;
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
    // Get user info from request body for custom auth
    const body: UpdateEmployeeRequest = await req.json();
    
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
      .select('*')
      .eq('id', body.employee_id)
      .eq('org_id', userRecord.org_id)
      .single();

    if (employeeError || !existingEmployee) {
      return createErrorResponse('Employee not found or not authorized', 404);
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number;
    if (body.special_number !== undefined) updateData.special_number = body.special_number;

    // If email is being updated, check for conflicts
    if (body.email && body.email !== existingEmployee.email) {
      // Check if email already exists in employees table
      const { data: emailConflict } = await supabase
        .from('employees')
        .select('id')
        .eq('email', body.email)
        .neq('id', body.employee_id)
        .single();

      if (emailConflict) {
        return createErrorResponse('Email already exists in employees', 400);
      }

      // Check if email exists in other role tables
      const { data: staffConflict } = await supabase
        .from('organization_staff')
        .select('id')
        .eq('email', body.email)
        .single();

      const { data: vendorConflict } = await supabase
        .from('vendors')
        .select('id')
        .eq('email', body.email)
        .single();

      if (staffConflict || vendorConflict) {
        return createErrorResponse('Email already exists in another role', 400);
      }
    }

    // Update employee record
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', body.employee_id)
      .select()
      .single();

    if (updateError || !updatedEmployee) {
      return createErrorResponse(`Failed to update employee: ${updateError?.message}`, 400);
    }

    const response: UpdateEmployeeResponse = {
      employee: {
        id: updatedEmployee.id,
        org_id: updatedEmployee.org_id,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone_number: updatedEmployee.phone_number,
        special_number: updatedEmployee.special_number,
        balance: updatedEmployee.balance,
        updated_at: updatedEmployee.updated_at
      }
    };

    return createSuccessResponse(response, 'Employee updated successfully');

  } catch (error) {
    console.error('Update employee error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
