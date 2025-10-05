import { supabase } from '../lib/supabase';

export interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: 'organization_staff' | 'employee' | 'vendor';
  org_id: string;
  user_id: string;
  balance?: number;
  phone_number?: string;
}

export interface AuthResult {
  success: boolean;
  user?: CustomUser;
  error?: string;
}

// Simple password hashing (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  // This is a simple hash for demo purposes
  // In production, use a proper hashing library like bcrypt
  return btoa(password + 'salt');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    // Check organization_staff first
    const { data: staffData, error: staffError } = await supabase
      .from('organization_staff')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (staffData && !staffError) {
      const staff = staffData;
      // Verify password (assuming passwords are stored hashed in the database)
      if (verifyPassword(password, staff.password || '')) {
        return {
          success: true,
          user: {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: 'organization_staff',
            org_id: staff.org_id,
            user_id: staff.id,
            phone_number: staff.phone_number
          }
        };
      } else {
        return {
          success: false,
          error: 'Invalid password'
        };
      }
    }

    // Check employees
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (employeeData && !employeeError) {
      const employee = employeeData;
      if (verifyPassword(password, employee.password || '')) {
        return {
          success: true,
          user: {
            id: employee.id,
            email: employee.email,
            name: employee.name,
            role: 'employee',
            org_id: employee.org_id,
            user_id: employee.id,
            balance: employee.balance,
            phone_number: employee.phone_number
          }
        };
      } else {
        return {
          success: false,
          error: 'Invalid password'
        };
      }
    }

    // Check vendors
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (vendorData && !vendorError) {
      const vendor = vendorData;
      if (verifyPassword(password, vendor.password || '')) {
        return {
          success: true,
          user: {
            id: vendor.id,
            email: vendor.email,
            name: vendor.name,
            role: 'vendor',
            org_id: vendor.org_id,
            user_id: vendor.id,
            phone_number: vendor.phone_number
          }
        };
      } else {
        return {
          success: false,
          error: 'Invalid password'
        };
      }
    }

    return {
      success: false,
      error: 'User not found'
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'organization_staff' | 'employee' | 'vendor',
  orgId: string,
  additionalData: any = {}
): Promise<AuthResult> {
  try {
    const hashedPassword = hashPassword(password);
    const userData = {
      email,
      password: hashedPassword,
      name,
      org_id: orgId,
      ...additionalData
    };

    let result;
    if (role === 'organization_staff') {
      result = await supabase
        .from('organization_staff')
        .insert(userData)
        .select()
        .single();
    } else if (role === 'employee') {
      result = await supabase
        .from('employees')
        .insert(userData)
        .select()
        .single();
    } else if (role === 'vendor') {
      result = await supabase
        .from('vendors')
        .insert(userData)
        .select()
        .single();
    }

    if (result.error || !result.data) {
      return {
        success: false,
        error: result.error?.message || 'Failed to create user'
      };
    }

    return {
      success: true,
      user: {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        role,
        org_id: result.data.org_id,
        user_id: result.data.id,
        balance: result.data.balance,
        phone_number: result.data.phone_number
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
