import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../shared/utils.ts';
import { authenticateUser } from '../../shared/auth.ts';
import { Database } from '../../shared/types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ChangePasswordRequest {
  target_user_id: string;
  new_password: string;
  user_type: 'organization_staff' | 'employee' | 'vendor';
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
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
    const { target_user_id, new_password, user_type }: ChangePasswordRequest = await req.json();
    console.log('Request data:', { target_user_id, user_type, password_length: new_password?.length });

    // Validate required fields
    if (!target_user_id || !new_password || !user_type) {
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

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Check if user has permission to change this password
    // Only allow if it's the same user or if the requesting user is organization_staff
    if (authResult.user!.user_id !== target_user_id && authResult.user!.role !== 'organization_staff') {
      return new Response(
        JSON.stringify({ error: 'Permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user's auth_user_id
    const tableName = user_type === 'organization_staff' ? 'organization_staff' : 
                     user_type === 'employee' ? 'employees' : 'vendors';
    
    const { data: targetUser, error: userError } = await supabase
      .from(tableName)
      .select('auth_user_id, org_id')
      .eq('id', target_user_id)
      .single();

    if (userError || !targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target user belongs to the same organization
    if (targetUser.org_id !== authResult.user!.org_id) {
      return new Response(
        JSON.stringify({ error: 'Access denied - different organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.auth_user_id,
      { password: new_password }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Failed to update password: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: ChangePasswordResponse = {
      success: true,
      message: 'Password updated successfully'
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Change password error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});