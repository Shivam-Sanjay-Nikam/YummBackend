import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../shared/utils.ts';
import { authenticateUser, createAuthUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the requesting user using Supabase Auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authResult = await authenticateUser(authHeader);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, password, phone_number } = await req.json();

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists in organization_staff table
    const { data: existingStaff, error: checkError } = await supabase
      .from('organization_staff')
      .select('email')
      .eq('email', email)
      .eq('org_id', authResult.user!.org_id);

    if (checkError) {
      console.error('Error checking existing staff:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing staff' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingStaff && existingStaff.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Email already exists in your organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase Auth user first
    const authUserResult = await createAuthUser(email, password, {
      org_id: authResult.user!.org_id,
      name,
      phone_number: phone_number || null
    }, 'organization_staff');

    if (!authUserResult.success) {
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authUserResult.error}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the organization staff member with auth_user_id
    const { data: staff, error: staffError } = await supabase
      .from('organization_staff')
      .insert({
        org_id: authResult.user!.org_id,
        name,
        email,
        phone_number: phone_number || null,
        auth_user_id: authUserResult.user!.id
      })
      .select()
      .single();

    if (staffError) {
      // Clean up auth user if staff creation failed
      await supabase.auth.admin.deleteUser(authUserResult.user!.id);
      console.error('Error creating staff:', staffError);
      return new Response(
        JSON.stringify({ error: 'Failed to create staff member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          phone_number: staff.phone_number,
          org_id: staff.org_id,
          created_at: staff.created_at,
        },
        message: 'Staff member created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create_organization_staff function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
