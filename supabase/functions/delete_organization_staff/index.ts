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
    const { staff_id, user_email } = await req.json();

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

    // Prevent deletion of the current user
    if (existingStaff.email === user_email) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the staff member
    const { error: deleteError } = await supabase
      .from('organization_staff')
      .delete()
      .eq('id', staff_id)
      .eq('org_id', authResult.user!.org_id);

    if (deleteError) {
      console.error('Error deleting staff:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete staff member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Staff member deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete_organization_staff function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
