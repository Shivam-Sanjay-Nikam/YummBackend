// Register organization and create first staff member
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { createAuthUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RegisterOrganizationRequest {
  // Organization data
  org_name: string;
  latitude?: number;
  longitude?: number;
  special_number: string; // Required field
  
  // Staff data
  staff_name?: string; // Made optional
  staff_email: string;
  staff_password: string;
  staff_phone?: string;
}

interface RegisterOrganizationResponse {
  organization: {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    special_number?: string;
    created_at: string;
  };
  staff: {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    created_at: string;
  };
  auth: {
    access_token: string;
    refresh_token: string;
    user_id: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  // This is a public registration endpoint - no authentication required

  try {
    const body: RegisterOrganizationRequest = await req.json();

    // Validate required fields
    if (!body.org_name || !body.staff_email || !body.staff_password || !body.special_number) {
      return createErrorResponse('Missing required fields: org_name, staff_email, staff_password, special_number', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.staff_email)) {
      return createErrorResponse('Invalid email format', 400);
    }

    // Validate password strength
    if (body.staff_password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    // Validate special number format (must be exactly 6 digits)
    const specialNumberRegex = /^\d{6}$/;
    if (!specialNumberRegex.test(body.special_number)) {
      return createErrorResponse('Special number must be exactly 6 digits', 400);
    }

    // Check if email already exists
    const { data: existingStaff } = await supabase
      .from('organization_staff')
      .select('email')
      .eq('email', body.staff_email)
      .single();

    if (existingStaff) {
      return createErrorResponse('Email already exists', 400);
    }

    // Check if special number already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('special_number')
      .eq('special_number', body.special_number)
      .single();

    if (existingOrg) {
      return createErrorResponse('Special number already exists. Please choose a different 6-digit number.', 400);
    }

    // Start transaction - create organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: body.org_name,
        latitude: body.latitude,
        longitude: body.longitude,
        special_number: body.special_number
      })
      .select()
      .single();

    if (orgError || !organization) {
      return createErrorResponse(`Failed to create organization: ${orgError?.message}`, 400);
    }

    // Create staff member
    const { data: staff, error: staffError } = await supabase
      .from('organization_staff')
      .insert({
        org_id: organization.id,
        name: body.staff_name || body.org_name, // Default to organization name if not provided
        email: body.staff_email,
        phone_number: body.staff_phone
      })
      .select()
      .single();

    if (staffError || !staff) {
      // Clean up organization if staff creation failed
      await supabase.from('organizations').delete().eq('id', organization.id);
      return createErrorResponse(`Failed to create staff member: ${staffError?.message}`, 400);
    }

    // Create auth user
    const authResult = await createAuthUser(
      body.staff_email,
      body.staff_password,
      {
        org_id: organization.id,
        name: body.staff_name || body.org_name, // Default to organization name if not provided
        phone_number: body.staff_phone
      },
      'organization_staff'
    );

    if (!authResult.success) {
      // Clean up database records if auth creation failed
      await supabase.from('organization_staff').delete().eq('id', staff.id);
      await supabase.from('organizations').delete().eq('id', organization.id);
      return createErrorResponse(`Failed to create auth user: ${authResult.error}`, 400);
    }

    // Sign in the user to get tokens
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: body.staff_email,
      password: body.staff_password
    });

    if (signInError || !signInData.session) {
      return createErrorResponse('Organization created but failed to sign in user', 400);
    }

    const response: RegisterOrganizationResponse = {
      organization: {
        id: organization.id,
        name: organization.name,
        latitude: organization.latitude,
        longitude: organization.longitude,
        special_number: organization.special_number,
        created_at: organization.created_at
      },
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone_number: staff.phone_number,
        created_at: staff.created_at
      },
      auth: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        user_id: authResult.user!.id
      }
    };

    return createSuccessResponse(response, 'Organization and staff member created successfully');

  } catch (error) {
    console.error('Register organization error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
