// Authentication and authorization utilities
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Database } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export interface AuthUser {
  id: string;
  email?: string;
  role: 'organization_staff' | 'employee' | 'vendor';
  org_id: string;
  user_id: string; // ID from the actual user record in the respective table
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function authenticateUserByEmail(userEmail: string): Promise<AuthResult> {
  try {
    if (!userEmail) {
      return {
        success: false,
        error: 'User email is required'
      };
    }

    // Check which table the user exists in and get their role
    let userRecord: any = null;
    let role: 'organization_staff' | 'employee' | 'vendor' = 'organization_staff';

    // Check organization_staff table first
    const { data: staffRecord, error: staffError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email, name')
      .eq('email', userEmail)
      .single();

    if (staffRecord && !staffError) {
      userRecord = staffRecord;
      role = 'organization_staff';
    } else {
      // Check employees table
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('employees')
        .select('id, org_id, email, name')
        .eq('email', userEmail)
        .single();

      if (employeeRecord && !employeeError) {
        userRecord = employeeRecord;
        role = 'employee';
      } else {
        // Check vendors table
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('id, org_id, email, name')
          .eq('email', userEmail)
          .single();

        if (vendorRecord && !vendorError) {
          userRecord = vendorRecord;
          role = 'vendor';
        }
      }
    }

    if (!userRecord) {
      return {
        success: false,
        error: 'User not found in any role table'
      };
    }

    return {
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: role,
        org_id: userRecord.org_id,
        user_id: userRecord.id
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

export async function authenticateUser(authHeader: string): Promise<AuthResult> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Check which table the user exists in and get their role
    const userEmail = user.email;
    if (!userEmail) {
      return {
        success: false,
        error: 'User email not found'
      };
    }

    // Check organization_staff first
    const { data: staff, error: staffError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email')
      .eq('email', userEmail)
      .single();

    if (staff && !staffError) {
      return {
        success: true,
        user: {
          id: user.id,
          email: userEmail,
          role: 'organization_staff',
          org_id: staff.org_id,
          user_id: staff.id
        }
      };
    }

    // Check employees
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, org_id, email')
      .eq('email', userEmail)
      .single();

    if (employee && !employeeError) {
      return {
        success: true,
        user: {
          id: user.id,
          email: userEmail,
          role: 'employee',
          org_id: employee.org_id,
          user_id: employee.id
        }
      };
    }

    // Check vendors
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, org_id, email')
      .eq('email', userEmail)
      .single();

    if (vendor && !vendorError) {
      return {
        success: true,
        user: {
          id: user.id,
          email: userEmail,
          role: 'vendor',
          org_id: vendor.org_id,
          user_id: vendor.id
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

export function requireRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role);
}

export function requireSameOrg(user: AuthUser, targetOrgId: string): boolean {
  return user.org_id === targetOrgId;
}

export async function createAuthUser(
  email: string,
  password: string,
  userData: any,
  role: 'organization_staff' | 'employee' | 'vendor'
): Promise<AuthResult> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: `Failed to create auth user: ${authError?.message}`
      };
    }

    // Get the user record that was already created in the main function
    const tableName = role === 'organization_staff' ? 'organization_staff' : 
                     role === 'employee' ? 'employees' : 'vendors';
    
    const { data: userRecord, error: userError } = await supabase
      .from(tableName)
      .select('id, org_id')
      .eq('email', email)
      .eq('org_id', userData.org_id)
      .single();

    if (userError || !userRecord) {
      // Clean up auth user if user record not found
      await supabase.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: `User record not found: ${userError?.message}`
      };
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email,
        role,
        org_id: userRecord.org_id,
        user_id: userRecord.id
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
