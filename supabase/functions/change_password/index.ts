import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/utils.ts';
import { authenticateUserByEmail } from '../shared/auth.ts';
import { Database } from '../shared/types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ChangePasswordRequest {
  user_email: string;
  target_user_id: string;
  new_password: string;
  user_type: 'organization_staff' | 'employee' | 'vendor';
}

serve(async (req) => {
  console.log('Change password function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('Parsing request body...');
    const { user_email, target_user_id, new_password, user_type }: ChangePasswordRequest = await req.json();
    console.log('Request data:', { user_email, target_user_id, user_type, password_length: new_password?.length });

    // Validate required fields
    if (!user_email || !target_user_id || !new_password || !user_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
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

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Check if user has permission to change this password
    // Only allow if it's the same user or if the requesting user is organization_staff
    if (authResult.user!.user_id !== target_user_id && authResult.user!.role !== 'organization_staff') {
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple password hashing (same as frontend)
    function hashPassword(password: string): string {
      return btoa(password + 'salt');
    }

    // Get the target user and update password in database
    let targetEmail = '';
    let updateResult;
    
    if (user_type === 'organization_staff') {
      const { data: staff, error: staffError } = await supabase
        .from('organization_staff')
        .select('email, org_id')
        .eq('id', target_user_id)
        .single();
      
      if (staffError || !staff) {
        return new Response(
          JSON.stringify({ error: 'Staff member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if target user belongs to the same organization
      if (staff.org_id !== authResult.user!.org_id) {
        return new Response(
          JSON.stringify({ error: 'Access denied - different organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetEmail = staff.email;
      
      // Update password in organization_staff table
      const hashedPassword = hashPassword(new_password);
      const { data: updateData, error: updateError } = await supabase
        .from('organization_staff')
        .update({ password: hashedPassword })
        .eq('id', target_user_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      updateResult = updateData;
      
    } else if (user_type === 'employee') {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('email, org_id')
        .eq('id', target_user_id)
        .single();
      
      if (employeeError || !employee) {
        return new Response(
          JSON.stringify({ error: 'Employee not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if target user belongs to the same organization
      if (employee.org_id !== authResult.user!.org_id) {
        return new Response(
          JSON.stringify({ error: 'Access denied - different organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetEmail = employee.email;
      
      // Update password in employees table
      const hashedPassword = hashPassword(new_password);
      const { data: updateData, error: updateError } = await supabase
        .from('employees')
        .update({ password: hashedPassword })
        .eq('id', target_user_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      updateResult = updateData;
      
    } else if (user_type === 'vendor') {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('email, org_id')
        .eq('id', target_user_id)
        .single();
      
      if (vendorError || !vendor) {
        return new Response(
          JSON.stringify({ error: 'Vendor not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if target user belongs to the same organization
      if (vendor.org_id !== authResult.user!.org_id) {
        return new Response(
          JSON.stringify({ error: 'Access denied - different organization' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      targetEmail = vendor.email;
      
      // Update password in vendors table
      const hashedPassword = hashPassword(new_password);
      const { data: updateData, error: updateError } = await supabase
        .from('vendors')
        .update({ password: hashedPassword })
        .eq('id', target_user_id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      updateResult = updateData;
    }

    console.log('Password updated successfully for:', targetEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully',
        user_email: targetEmail
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Change password error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
