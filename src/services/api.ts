import axios from 'axios';
import { supabase } from '../lib/supabase';
import { authenticateUser, createUser } from './auth';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sjtttdnqjgwggczhwzad.supabase.co/functions/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom auth interceptor - we'll handle this differently since we're not using Supabase Auth
apiClient.interceptors.request.use(async (config: any) => {
  // Add Supabase function headers
  config.headers['apikey'] = import.meta.env.VITE_SUPABASE_ANON_KEY;
  config.headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  return config;
});

export const api = {
  auth: {
    registerOrganization: async (data: { 
      org_name: string; 
      staff_name?: string; // Made optional
      staff_email: string; 
      staff_password: string;
      staff_phone?: string;
      latitude?: number;
      longitude?: number;
      special_number: string; // Made required
    }) => {
      try {
        // Check if email already exists
        const { data: existingStaff } = await supabase
          .from('organization_staff')
          .select('email')
          .eq('email', data.staff_email);

        if (existingStaff && existingStaff.length > 0) {
          return { error: { message: 'Email already exists' } };
        }

        // Check if special number already exists
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('special_number')
          .eq('special_number', data.special_number);

        if (existingOrg && existingOrg.length > 0) {
          return { error: { message: 'Special number already exists. Please choose a different 6-digit number.' } };
        }

        // Create organization first
        const { data: organization, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: data.org_name,
            latitude: data.latitude,
            longitude: data.longitude,
            special_number: data.special_number
          })
          .select()
          .single();

        if (orgError || !organization) {
          return { error: { message: `Failed to create organization: ${orgError?.message}` } };
        }

        // Create staff member using custom auth
        const authResult = await createUser(
          data.staff_email,
          data.staff_password,
          data.staff_name || 'Admin',
          'organization_staff',
          organization.id,
          {
            phone_number: data.staff_phone
          }
        );

        if (!authResult.success) {
          // Clean up organization if staff creation failed
          await supabase.from('organizations').delete().eq('id', organization.id);
          return { error: { message: authResult.error } };
        }

        return {
          data: {
            organization: {
              id: organization.id,
              name: organization.name,
              special_number: organization.special_number,
              created_at: organization.created_at
            },
            staff: {
              id: authResult.user!.id,
              name: authResult.user!.name,
              email: authResult.user!.email,
              phone_number: authResult.user!.phone_number,
              created_at: new Date().toISOString()
            }
          }
        };

      } catch (error: any) {
        console.error('Registration error:', error);
        return { error: { message: 'Registration failed' } };
      }
    },

    login: async (email: string, password: string) => {
      const result = await authenticateUser(email, password);
      if (result.success) {
        return { data: { user: result.user }, error: null };
      } else {
        return { data: null, error: { message: result.error } };
      }
    },

    logout: async () => {
      // For custom auth, logout is handled by clearing local state
      return { error: null };
    },
  },

  staff: {
    createEmployee: async (data: { 
      name: string; 
      email: string; 
      password: string; 
      balance?: number;
      phone_number?: string;
      special_number?: string;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('create_employee', {
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            balance: data.balance || 0,
            phone_number: data.phone_number,
            special_number: data.special_number,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Employee creation error:', error);
          return { data: null, error: { message: error.message || 'Failed to create employee' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to create employee' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Create employee error:', error);
        return { data: null, error: { message: error.message || 'Failed to create employee' } };
      }
    },

    createVendor: async (data: { 
      name: string; 
      email: string; 
      password: string; 
      phone_number?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('create_vendor', {
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            phone_number: data.phone_number,
            latitude: data.latitude,
            longitude: data.longitude,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Vendor creation error:', error);
          return { data: null, error: { message: error.message || 'Failed to create vendor' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to create vendor' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Create vendor error:', error);
        return { data: null, error: { message: error.message || 'Failed to create vendor' } };
      }
    },

    updateEmployeeBalance: async (data: { 
      employee_id: string; 
      new_balance: number;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('update_employee_balance', {
          body: {
            employee_id: data.employee_id,
            new_balance: data.new_balance,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Employee balance update error:', error);
          return { data: null, error: { message: error.message || 'Failed to update employee balance' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to update employee balance' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Update employee balance error:', error);
        return { data: null, error: { message: error.message || 'Failed to update employee balance' } };
      }
    },

    updateEmployee: async (data: {
      employee_id: string;
      name?: string;
      email?: string;
      phone_number?: string;
      special_number?: string;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('update_employee', {
          body: {
            employee_id: data.employee_id,
            name: data.name,
            email: data.email,
            phone_number: data.phone_number,
            special_number: data.special_number,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Employee update error:', error);
          return { data: null, error: { message: error.message || 'Failed to update employee' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to update employee' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Update employee error:', error);
        return { data: null, error: { message: error.message || 'Failed to update employee' } };
      }
    },

    deleteEmployee: async (data: { employee_id: string }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('delete_employee', {
          body: {
            employee_id: data.employee_id,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Employee deletion error:', error);
          return { data: null, error: { message: error.message || 'Failed to delete employee' } };
        }

        if (!result) {
          return { data: null, error: { message: 'No result returned from server' } };
        }

        if (result.error && !result.success) {
          return { data: null, error: { message: result.error || 'Failed to delete employee' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Delete employee error:', error);
        return { data: null, error: { message: error.message || 'Failed to delete employee' } };
      }
    },

    updateVendor: async (data: {
      vendor_id: string;
      name?: string;
      email?: string;
      phone_number?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('update_vendor', {
          body: {
            vendor_id: data.vendor_id,
            name: data.name,
            email: data.email,
            phone_number: data.phone_number,
            latitude: data.latitude,
            longitude: data.longitude,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Vendor update error:', error);
          return { data: null, error: { message: error.message || 'Failed to update vendor' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to update vendor' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Update vendor error:', error);
        return { data: null, error: { message: error.message || 'Failed to update vendor' } };
      }
    },

    deleteVendor: async (data: { vendor_id: string }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          console.error('User not authenticated for vendor deletion');
          return { data: null, error: { message: 'User not authenticated' } };
        }

        console.log('Attempting to delete vendor:', { 
          vendor_id: data.vendor_id, 
          user_email: user.email,
          user_id: user.id 
        });

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('delete_vendor', {
          body: {
            vendor_id: data.vendor_id,
            user_email: user.email
          }
        });

        console.log('Delete vendor response:', { result, error });

        if (error) {
          console.error('Vendor deletion error:', error);
          return { data: null, error: { message: error.message || 'Failed to delete vendor' } };
        }

        if (!result) {
          console.error('Vendor deletion failed: No result returned');
          return { data: null, error: { message: 'No result returned from server' } };
        }

        if (result.error && !result.success) {
          console.error('Vendor deletion failed:', result);
          return { data: null, error: { message: result.error || 'Failed to delete vendor' } };
        }

        console.log('Vendor deleted successfully:', result);
        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Delete vendor error:', error);
        return { data: null, error: { message: error.message || 'Failed to delete vendor' } };
      }
    },

    // Organization Staff Management
    createOrganizationStaff: async (data: { 
      name: string; 
      email: string; 
      password: string; 
      phone_number?: string;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('create_organization_staff', {
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            phone_number: data.phone_number,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Organization staff creation error:', error);
          return { data: null, error: { message: error.message || 'Failed to create staff member' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to create staff member' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Create organization staff error:', error);
        return { data: null, error: { message: error.message || 'Failed to create staff member' } };
      }
    },

    updateOrganizationStaff: async (data: {
      staff_id: string;
      name?: string;
      email?: string;
      phone_number?: string;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('update_organization_staff', {
          body: {
            staff_id: data.staff_id,
            name: data.name,
            email: data.email,
            phone_number: data.phone_number,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Organization staff update error:', error);
          return { data: null, error: { message: error.message || 'Failed to update staff member' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to update staff member' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Update organization staff error:', error);
        return { data: null, error: { message: error.message || 'Failed to update staff member' } };
      }
    },

    deleteOrganizationStaff: async (data: { staff_id: string }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('delete_organization_staff', {
          body: {
            staff_id: data.staff_id,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Organization staff deletion error:', error);
          return { data: null, error: { message: error.message || 'Failed to delete staff member' } };
        }

        if (!result) {
          return { data: null, error: { message: 'No result returned from server' } };
        }

        if (result.error && !result.success) {
          return { data: null, error: { message: result.error || 'Failed to delete staff member' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Delete organization staff error:', error);
        return { data: null, error: { message: error.message || 'Failed to delete staff member' } };
      }
    },

    // Organization Management
    updateOrganization: async (data: {
      name?: string;
      latitude?: number | null;
      longitude?: number | null;
      special_number?: string;
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('update_organization', {
          body: {
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            special_number: data.special_number,
            user_email: user.email
          }
        });

        if (error) {
          console.error('Organization update error:', error);
          return { data: null, error: { message: error.message || 'Failed to update organization' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to update organization' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Update organization error:', error);
        return { data: null, error: { message: error.message || 'Failed to update organization' } };
      }
    },

    changePassword: async (data: {
      target_user_id: string;
      new_password: string;
      user_type: 'organization_staff' | 'employee' | 'vendor';
    }) => {
      try {
        // Get current user for authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          return { data: null, error: { message: 'User not authenticated' } };
        }

        // Call the edge function with user email for authentication
        const { data: result, error } = await supabase.functions.invoke('change_password', {
          body: {
            user_email: user.email,
            target_user_id: data.target_user_id,
            new_password: data.new_password,
            user_type: data.user_type
          }
        });

        if (error) {
          console.error('Password change error:', error);
          return { data: null, error: { message: error.message || 'Failed to change password' } };
        }

        if (!result || result.error) {
          return { data: null, error: { message: result?.error || 'Failed to change password' } };
        }

        return {
          data: result,
          error: null
        };
      } catch (error: any) {
        console.error('Change password error:', error);
        return { data: null, error: { message: error.message || 'Failed to change password' } };
      }
    },
  },

  employee: {
    placeOrder: async (data: { 
      vendor_id: string; 
      items: Array<{ menu_item_id: string; quantity: number }> 
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      
      return apiClient.post('/place_order', {
        ...data,
        user_email: user.email
      });
    },

    cancelOrderRequest: async (data: { 
      order_id: string; 
      reason?: string;
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      
      return apiClient.post('/cancel_order_request', {
        ...data,
        user_email: user.email
      });
    },
  },

  vendor: {
    addMenuItem: async (data: { 
      name: string; 
      price: number; 
      image_url?: string; 
      status?: 'active' | 'inactive';
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        return { data: null, error: 'Not authenticated' };
      }
      
      return apiClient.post('/vendor_add_menu_item', {
        user_email: user.email,
        ...data
      });
    },

    handleCancelRequest: async (data: { 
      order_id: string; 
      action: 'accept' | 'reject'; 
      reason?: string;
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      
      return apiClient.post('/handle_cancel_request', {
        ...data,
        user_email: user.email
      });
    },

    updateOrderStatus: async (data: { 
      order_id: string; 
      status: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled';
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      
      return apiClient.post('/update_order_status', {
        ...data,
        user_email: user.email
      });
    },

    deleteOrder: async (data: { 
      order_id: string;
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }
      
      return apiClient.post('/delete_order', {
        ...data,
        user_email: user.email
      });
    },

    updateMenuItem: async (data: {
      menu_item_id: string;
      name?: string;
      price?: number;
      image_url?: string;
      status?: 'active' | 'inactive';
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        return { data: null, error: 'Not authenticated' };
      }
      
      return apiClient.put('/update_menu_item', {
        user_email: user.email,
        ...data
      });
    },

    deleteMenuItem: async (data: {
      menu_item_id: string;
    }) => {
      const { user } = useAuthStore.getState();
      if (!user?.email) {
        return { data: null, error: 'Not authenticated' };
      }
      
      return apiClient.delete('/delete_menu_item', {
        data: {
          user_email: user.email,
          ...data
        }
      });
    },
  },

  // Generic data fetching methods
  data: {
    getVendors: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', userEmail)
        .single();

      // If not found in organization_staff, try employees table
      if (!userRecord) {
        const { data: employeeRecord } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', userEmail)
          .single();
        userRecord = employeeRecord;
      }

      // If not found in employees, try vendors table
      if (!userRecord) {
        const { data: vendorRecord } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', userEmail)
          .single();
        userRecord = vendorRecord;
      }

      if (!userRecord) return { data: null, error: 'User not found in any role table' };

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('org_id', userRecord.org_id);
      return { data, error };
    },

    getMenuItems: async (vendorId: string) => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'active');
      return { data, error };
    },

    getOrders: async (userRole: string, userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      let query = supabase.from('orders').select(`
        *,
        order_items(*, menu_items(*)),
        employees(name, email),
        vendors(name)
      `);

      if (userRole === 'employee') {
        // Get employee's user_id from employees table
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('email', userEmail)
          .single();
        if (employee) {
          query = query.eq('employee_id', employee.id);
        }
      } else if (userRole === 'vendor') {
        // Get vendor's user_id from vendors table
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('email', userEmail)
          .single();
        if (vendor) {
          query = query.eq('vendor_id', vendor.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    },

    getEmployees: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', userEmail)
        .maybeSingle();

      // If not found in organization_staff, try employees table
      if (!userRecord && !userError) {
        const { data: employeeRecord, error: employeeError } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = employeeRecord;
        userError = employeeError;
      }

      // If not found in employees, try vendors table
      if (!userRecord && !userError) {
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = vendorRecord;
        userError = vendorError;
      }

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('org_id', userRecord.org_id);
      return { data, error };
    },

    getVendorsForStaff: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', userEmail)
        .maybeSingle();

      // If not found in organization_staff, try employees table
      if (!userRecord && !userError) {
        const { data: employeeRecord, error: employeeError } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = employeeRecord;
        userError = employeeError;
      }

      // If not found in employees, try vendors table
      if (!userRecord && !userError) {
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = vendorRecord;
        userError = vendorError;
      }

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('org_id', userRecord.org_id);

      return { data, error };
    },

    getOrganizationStaff: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', userEmail)
        .maybeSingle();

      // If not found in organization_staff, try employees table
      if (!userRecord && !userError) {
        const { data: employeeRecord, error: employeeError } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = employeeRecord;
        userError = employeeError;
      }

      // If not found in employees, try vendors table
      if (!userRecord && !userError) {
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = vendorRecord;
        userError = vendorError;
      }

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('organization_staff')
        .select('*')
        .eq('org_id', userRecord.org_id);

      return { data, error };
    },

    getOrganization: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', userEmail)
        .maybeSingle();

      // If not found in organization_staff, try employees table
      if (!userRecord && !userError) {
        const { data: employeeRecord, error: employeeError } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = employeeRecord;
        userError = employeeError;
      }

      // If not found in employees, try vendors table
      if (!userRecord && !userError) {
        const { data: vendorRecord, error: vendorError } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', userEmail)
          .maybeSingle();
        userRecord = vendorRecord;
        userError = vendorError;
      }

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userRecord.org_id)
        .single();

      return { data, error };
    },
  },
};

export default apiClient;
