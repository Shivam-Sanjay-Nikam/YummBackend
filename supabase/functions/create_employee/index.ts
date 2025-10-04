// Create employee - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';
import { authenticateUser, createAuthUser } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  special_number?: string;
  balance?: number;
}

interface CreateEmployeeResponse {
  employee: {
    id: string;
    org_id: string;
    name: string;
    email: string;
    phone_number?: string;
    special_number?: string;
    balance: number;
    created_at: string;
  };
  auth: {
    user_id: string;
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
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const authResult = await authenticateUser(authHeader || '');
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Check if user is organization_staff
    if (authResult.user.role !== 'organization_staff') {
      return createErrorResponse('Only organization staff can create employees', 403);
    }

    const body: CreateEmployeeRequest = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return createErrorResponse('Missing required fields: name, email, password', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Validate password strength
    if (body.password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    // Check if email already exists in employees table
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('email')
      .eq('email', body.email)
      .single();

    if (existingEmployee) {
      return createErrorResponse('Email already exists in employees', 400);
    }

    // Check if email exists in other role tables
    const { data: existingStaff } = await supabase
      .from('organization_staff')
      .select('email')
      .eq('email', body.email)
      .single();

    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('email')
      .eq('email', body.email)
      .single();

    if (existingStaff || existingVendor) {
      return createErrorResponse('Email already exists in another role', 400);
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert({
        org_id: authResult.user.org_id,
        name: body.name,
        email: body.email,
        phone_number: body.phone_number,
        special_number: body.special_number,
        balance: body.balance || 0.00
      })
      .select()
      .single();

    if (employeeError || !employee) {
      return createErrorResponse(`Failed to create employee: ${employeeError?.message}`, 400);
    }

    // Create auth user
    const authUserResult = await createAuthUser(
      body.email,
      body.password,
      {
        org_id: authResult.user.org_id,
        name: body.name,
        phone_number: body.phone_number,
        special_number: body.special_number,
        balance: body.balance || 0.00
      },
      'employee'
    );

    if (!authUserResult.success) {
      // Clean up employee record if auth creation failed
      await supabase.from('employees').delete().eq('id', employee.id);
      return createErrorResponse(`Failed to create auth user: ${authUserResult.error}`, 400);
    }

    const response: CreateEmployeeResponse = {
      employee: {
        id: employee.id,
        org_id: employee.org_id,
        name: employee.name,
        email: employee.email,
        phone_number: employee.phone_number,
        special_number: employee.special_number,
        balance: employee.balance,
        created_at: employee.created_at
      },
      auth: {
        user_id: authUserResult.user!.id,
        email: body.email
      }
    };

    return createSuccessResponse(response, 'Employee created successfully');

  } catch (error) {
    console.error('Create employee error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
