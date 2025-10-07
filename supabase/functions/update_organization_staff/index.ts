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
    const { staff_id, name, email, phone_number, user_email } = await req.json();

    // Validate required fields
    if (!staff_id || !user_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: staff_id, user_email' }),
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

    // Check if the staff member exists and belongs to the same organization
    const { data: existingStaff, error: checkError } = await supabase
      .from('organization_staff')
      .select('*')
      .eq('id', staff_id)
      .eq('org_id', authResult.user!.org_id)
      .single();

    if (checkError || !existingStaff) {
      return new Response(
        JSON.stringify({ error: 'Staff member not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If email is being updated, check if it already exists
    if (email && email !== existingStaff.email) {
      const { data: emailExists, error: emailCheckError } = await supabase
        .from('organization_staff')
        .select('email')
        .eq('email', email)
        .eq('org_id', authResult.user!.org_id)
        .neq('id', staff_id);

      if (emailCheckError) {
        console.error('Error checking email:', emailCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to check email availability' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (emailExists && emailExists.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Email already exists in your organization' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;

    // Update the staff member
    const { data: updatedStaff, error: updateError } = await supabase
      .from('organization_staff')
      .update(updateData)
      .eq('id', staff_id)
      .eq('org_id', authResult.user!.org_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating staff:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update staff member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        staff: {
          id: updatedStaff.id,
          name: updatedStaff.name,
          email: updatedStaff.email,
          phone_number: updatedStaff.phone_number,
          org_id: updatedStaff.org_id,
          updated_at: updatedStaff.updated_at,
        },
        message: 'Staff member updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update_organization_staff function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
