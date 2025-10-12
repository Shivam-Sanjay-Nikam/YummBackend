// Supabase Auth utilities for Realtime compatibility
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export interface AuthUser {
  id: string; // Supabase Auth user ID
  email: string;
  role: 'organization_staff' | 'employee' | 'vendor';
  org_id: string;
  user_id: string; // ID from the actual user record in the respective table
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Get user role and org_id from custom tables using Supabase Auth user ID
export async function getUserFromAuthId(authUserId: string): Promise<AuthResult> {
  try {
    if (!authUserId) {
      return {
        success: false,
        error: 'Auth user ID is required'
      };
    }

    // Check organization_staff table first
    const { data: staffRecord, error: staffError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email, name, auth_user_id')
      .eq('auth_user_id', authUserId)
      .single();

    if (staffRecord && !staffError) {
      return {
        success: true,
        user: {
          id: authUserId,
          email: staffRecord.email,
          role: 'organization_staff',
          org_id: staffRecord.org_id,
          user_id: staffRecord.id
        }
      };
    }

    // Check employees table
    const { data: employeeRecord, error: employeeError } = await supabase
      .from('employees')
      .select('id, org_id, email, name, auth_user_id')
      .eq('auth_user_id', authUserId)
      .single();

    if (employeeRecord && !employeeError) {
      return {
        success: true,
        user: {
          id: authUserId,
          email: employeeRecord.email,
          role: 'employee',
          org_id: employeeRecord.org_id,
          user_id: employeeRecord.id
        }
      };
    }

    // Check vendors table
    const { data: vendorRecord, error: vendorError } = await supabase
      .from('vendors')
      .select('id, org_id, email, name, auth_user_id')
      .eq('auth_user_id', authUserId)
      .single();

    if (vendorRecord && !vendorError) {
      return {
        success: true,
        user: {
          id: authUserId,
          email: vendorRecord.email,
          role: 'vendor',
          org_id: vendorRecord.org_id,
          user_id: vendorRecord.id
        }
      };
    }

    return {
      success: false,
      error: 'User not found in any role table'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

// Authenticate user using Supabase Auth token
export async function authenticateUser(authHeader: string): Promise<AuthResult> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Get user role and org_id from our custom tables
    return await getUserFromAuthId(user.id);

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

export function requireRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

export function requireSameOrg(user: AuthUser, targetOrgId: string): boolean {
  return user.org_id === targetOrgId;
}

// Create Supabase Auth user and link to custom table
export async function createAuthUser(
  email: string,
  password: string,
  userData: any,
  role: 'organization_staff' | 'employee' | 'vendor'
): Promise<AuthResult> {
  try {
    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role,
        org_id: userData.org_id
      }
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: `Failed to create auth user: ${authError?.message}`
      };
    }

    // Note: The user record should be created with auth_user_id directly
    // This function is used when creating users via Edge Functions

    return {
      success: true,
      user: {
        id: authData.user.id,
        email,
        role,
        org_id: userData.org_id,
        user_id: userData.id || authData.user.id
      }
    };

  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: 'Failed to create user'
    };
  }
}
