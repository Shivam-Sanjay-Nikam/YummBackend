import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../shared/utils.ts';
import { getUserFromAuthId, createAuthUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

interface LoginRequest {
  email: string;
  password: string;
  action: 'signin' | 'signup';
  userData?: {
    name: string;
    org_id: string;
    role: 'organization_staff' | 'employee' | 'vendor';
  };
}

interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    org_id: string;
    user_id: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  error?: string;
}

serve(async (req) => {
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
    const { email, password, action, userData }: LoginRequest = await req.json();

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: LoginResponse;

    if (action === 'signin') {
      // Sign in existing user using Supabase Auth
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (sessionError || !sessionData.session || !sessionData.user) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: sessionError?.message || 'Invalid email or password' 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user details from our custom tables
      const userResult = await getUserFromAuthId(sessionData.user.id);
      
      if (!userResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User not found in system' 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = {
        success: true,
        user: userResult.user,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_in: sessionData.session.expires_in,
          token_type: sessionData.session.token_type
        }
      };

    } else if (action === 'signup') {
      // Sign up new user
      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User data is required for signup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user in our custom table and Supabase Auth
      const authResult = await createAuthUser(email, password, userData, userData.role);
      
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: authResult.error 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the session token
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (sessionError || !sessionData.session) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create session after signup' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = {
        success: true,
        user: authResult.user,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_in: sessionData.session.expires_in,
          token_type: sessionData.session.token_type
        }
      };

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "signin" or "signup"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
