// Create vendor - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';
import { authenticateUser, createAuthUser } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateVendorRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

interface CreateVendorResponse {
  vendor: {
    id: string;
    org_id: string;
    name: string;
    email: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
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
    // Get user info from request body for custom auth
    const body: CreateVendorRequest & { user_email?: string } = await req.json();
    
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
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

    // Check if user is organization_staff (already verified by query above)
    const authUser = {
      id: userRecord.id,
      email: userRecord.email,
      role: 'organization_staff' as const,
      org_id: userRecord.org_id,
      user_id: userRecord.id
    };

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

    // Check if email already exists in vendors table
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('email')
      .eq('email', body.email)
      .single();

    if (existingVendor) {
      return createErrorResponse('Email already exists in vendors', 400);
    }

    // Check if email exists in other role tables
    const { data: existingStaff } = await supabase
      .from('organization_staff')
      .select('email')
      .eq('email', body.email)
      .single();

    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('email')
      .eq('email', body.email)
      .single();

    if (existingStaff || existingEmployee) {
      return createErrorResponse('Email already exists in another role', 400);
    }

    // Create vendor record
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        org_id: authUser.org_id,
        name: body.name,
        email: body.email,
        phone_number: body.phone_number,
        latitude: body.latitude,
        longitude: body.longitude
      })
      .select()
      .single();

    if (vendorError || !vendor) {
      return createErrorResponse(`Failed to create vendor: ${vendorError?.message}`, 400);
    }

    // Create auth user
    const authUserResult = await createAuthUser(
      body.email,
      body.password,
      {
        org_id: authUser.org_id,
        name: body.name,
        phone_number: body.phone_number,
        latitude: body.latitude,
        longitude: body.longitude
      },
      'vendor'
    );

    if (!authUserResult.success) {
      // Clean up vendor record if auth creation failed
      await supabase.from('vendors').delete().eq('id', vendor.id);
      return createErrorResponse(`Failed to create auth user: ${authUserResult.error}`, 400);
    }

    const response: CreateVendorResponse = {
      vendor: {
        id: vendor.id,
        org_id: vendor.org_id,
        name: vendor.name,
        email: vendor.email,
        phone_number: vendor.phone_number,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        created_at: vendor.created_at
      },
      auth: {
        user_id: authUserResult.user!.id,
        email: body.email
      }
    };

    return createSuccessResponse(response, 'Vendor created successfully');

  } catch (error) {
    console.error('Create vendor error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
