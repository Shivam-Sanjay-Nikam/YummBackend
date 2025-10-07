import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, password, phone_number, user_email } = await req.json();

    // Validate required fields
    if (!name || !email || !password || !user_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, password, user_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate the requesting user
    const authResult = await authenticateUserByEmail(user_email);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Hash the password
    const hashedPassword = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password)
    );
    const passwordHash = Array.from(new Uint8Array(hashedPassword))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create the organization staff member
    const { data: staff, error: staffError } = await supabase
      .from('organization_staff')
      .insert({
        org_id: authResult.user!.org_id,
        name,
        email,
        password: passwordHash,
        phone_number: phone_number || null,
      })
      .select()
      .single();

    if (staffError) {
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
