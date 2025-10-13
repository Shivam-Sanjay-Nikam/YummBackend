import { supabase } from '../lib/supabaseClient';
import { getSession } from '../lib/auth';
import { useAuthStore } from '../store/authStore';

// All API calls now use Supabase Edge Functions directly

// Session management is now handled by the auth helper

// Simple session validation using the new auth helper
const validateSession = async () => {
  console.log('=== validateSession Debug ===');
  const session = await getSession();
  console.log('Raw session from getSession():', session);
  console.log('Session exists:', !!session);
  console.log('Session access_token exists:', !!session?.access_token);
  console.log('Session expires_at:', session?.expires_at);
  console.log('Current timestamp:', Math.floor(Date.now() / 1000));
  console.log('Token expired:', session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : 'unknown');
  
  if (!session) {
    console.log('No session found - throwing error');
    throw new Error('No valid session found. Please log in again.');
  }
  console.log('Session validation passed');
  return session;
};

// Helper function to get session headers for API calls
const getSessionHeaders = async () => {
  const session = await validateSession();
  console.log('Session details:', { 
    hasAccessToken: !!session.access_token, 
    tokenLength: session.access_token?.length,
    expiresAt: session.expires_at 
  });
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
  };
};

// Session cache is no longer needed with the new auth helper

// Session cache will be initialized when needed

export const api = {
  auth: {
    // Use Edge Function for organization registration
    registerOrganization: async (data: { 
      org_name: string; 
      staff_name?: string;
      staff_email: string; 
      staff_password: string;
      staff_phone?: string;
      latitude?: number;
      longitude?: number;
      special_number: string;
    }) => {
      try {
        console.log('=== Register Organization Debug ===');
        console.log('Registration data being sent:', {
          org_name: data.org_name,
          staff_name: data.staff_name,
          staff_email: data.staff_email,
          staff_password: '[HIDDEN]',
          staff_phone: data.staff_phone,
          latitude: data.latitude,
          longitude: data.longitude,
          special_number: data.special_number
        });
        
        const { data: result, error } = await supabase.functions.invoke('register_organization', {
          body: {
            org_name: data.org_name,
            staff_name: data.staff_name || 'Admin',
            staff_email: data.staff_email,
            staff_password: data.staff_password,
            staff_phone: data.staff_phone,
            latitude: data.latitude,
            longitude: data.longitude,
            special_number: data.special_number
          }
        });

        console.log('=== Registration Response ===');
        console.log('Raw result:', result);
        console.log('Raw error:', error);

        if (error) {
          console.log('=== Registration Error ===');
          console.log('Error message:', error.message);
          console.log('Error details:', error);
          return { error: { message: error.message } };
        }

        if (!result.success) {
          console.log('=== Registration Failed ===');
          console.log('Result error:', result.error);
          return { error: { message: result.error } };
        }

        console.log('=== Registration Success ===');
        console.log('Organization created:', result.organization);
        console.log('Staff created:', result.staff);
        console.log('Auth created:', result.auth);

        return {
          data: {
            organization: result.organization,
            staff: result.staff,
            auth: result.auth
          }
        };

      } catch (error: any) {
        console.error('Registration error:', error);
        return { error: { message: 'Registration failed' } };
      }
    },

    // Use backend auth_login Edge Function for proper authentication
    login: async (email: string, password: string) => {
      try {
        // Call the backend auth_login function (this handles Supabase Auth internally)
        const { data: result, error } = await supabase.functions.invoke('auth_login', {
          body: {
            email,
            password,
            action: 'signin'
          }
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        if (!result.success) {
          return { data: null, error: { message: result.error } };
        }

        // The backend auth_login function returns the session tokens
        // We need to set the session in the frontend Supabase client
        // BUT we do it in a way that doesn't trigger refresh token issues
        if (result.session) {
          // Use the auth helper to set session without triggering refresh storms
          const { setSessionSafely } = await import('../lib/auth');
          await setSessionSafely(result.session);
        }

        return { 
          data: { 
            user: result.user,
            session: result.session
          }, 
          error: null 
        };

      } catch (error: any) {
        console.error('Login error:', error);
        return { data: null, error: { message: 'Login failed' } };
      }
    },

    logout: async () => {
      try {
        // Use the auth helper for sign out
        const { signOut } = await import('../lib/auth');
        await signOut();
        return { error: null };
      } catch (error: any) {
        console.error('Logout error:', error);
        return { error: { message: 'Logout failed' } };
      }
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
        // Get session headers for authentication
        const headers = await getSessionHeaders();
        
        const requestBody = {
          name: data.name,
          email: data.email,
          password: data.password,
          balance: data.balance || 0,
          phone_number: data.phone_number,
          special_number: data.special_number
        };

        
        // Call the edge function with proper authentication headers
        const { data: result, error } = await supabase.functions.invoke('create_employee', {
          body: requestBody,
          headers
        });

        if (error) {
          console.error('Employee creation error:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          });
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
        // Get session headers for authentication
        const headers = await getSessionHeaders();

        // Call the edge function with proper authentication headers
        const { data: result, error } = await supabase.functions.invoke('create_vendor', {
          body: {
            name: data.name,
            email: data.email,
            password: data.password,
            phone_number: data.phone_number,
            latitude: data.latitude,
            longitude: data.longitude
          },
          headers
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
        // Get session headers for authentication
        const headers = await getSessionHeaders();

        // Call the edge function with proper authentication headers
        const { data: result, error } = await supabase.functions.invoke('update_employee_balance', {
          body: {
            employee_id: data.employee_id,
            new_balance: data.new_balance
          },
          headers
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
        // Get session headers for authentication
        const headers = await getSessionHeaders();

        // Call the edge function with proper authentication headers
        const { data: result, error } = await supabase.functions.invoke('delete_employee', {
          body: {
            employee_id: data.employee_id
          },
          headers
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
        // Get session headers for authentication
        const headers = await getSessionHeaders();

        console.log('Attempting to delete vendor:', { 
          vendor_id: data.vendor_id
        });

        // Call the edge function with proper authentication headers
        const { data: result, error } = await supabase.functions.invoke('delete_vendor', {
          body: {
            vendor_id: data.vendor_id
          },
          headers
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
            staff_id: data.staff_id
          },
          headers: await getSessionHeaders()
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
            target_user_id: data.target_user_id,
            new_password: data.new_password,
            user_type: data.user_type
          },
          headers: await getSessionHeaders()
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
      try {
        // Get session headers for authentication
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('place_order', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!result.success) {
          throw new Error(result.error);
        }

        return result;
      } catch (error: any) {
        console.error('Place order error:', error);
        throw new Error(error.message || 'Failed to place order');
      }
    },

    cancelOrderRequest: async (data: { 
      order_id: string; 
      reason?: string;
    }) => {
      try {
        // Get session headers for authentication
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('cancel_order_request', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          return { data: null, error: error.message };
        }

        if (!result.success) {
          return { data: null, error: result.error };
        }

        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Cancel order request error:', error);
        
        // Extract error message from different possible locations
        let errorMessage = 'Failed to send cancellation request';
        
        if (error.response?.data) {
          errorMessage = error.response.data.error || 
                        error.response.data.message || 
                        error.response.data.details || 
                        `Server error: ${error.response.status}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return { 
          data: null, 
          error: errorMessage
        };
      }
    },
  },

  vendor: {
    addMenuItem: async (data: { 
      name: string; 
      description?: string;
      price: number; 
      image_url?: string; 
      status?: 'active' | 'inactive';
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('vendor_add_menu_item', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          return { data: null, error: error.message };
        }

        // Backend returns { success: boolean, data: { menu_item: Object } }
        return { data: result.data?.menu_item || null, error: null };
      } catch (error: any) {
        console.error('Add menu item error:', error);
        return { data: null, error: error.message || 'Failed to add menu item' };
      }
    },

    handleCancelRequest: async (data: { 
      order_id: string; 
      action: 'accept' | 'reject'; 
      reason?: string;
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('handle_cancel_request', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Handle cancel request error:', error);
        return { data: null, error: error.message || 'Failed to handle cancel request' };
      }
    },

    updateOrderStatus: async (data: { 
      order_id: string; 
      status: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('update_order_status', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Update order status error:', error);
        return { data: null, error: error.message || 'Failed to update order status' };
      }
    },

    deleteOrder: async (data: { 
      order_id: string;
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('delete_order', {
          body: {
            ...data
          },
          headers
        });

        if (error) {
          return { data: null, error: error.message };
        }

        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Delete order error:', error);
        return { data: null, error: error.message || 'Failed to delete order' };
      }
    },

    updateMenuItem: async (data: {
      menu_item_id: string;
      name?: string;
      description?: string;
      price?: number;
      image_url?: string;
      status?: 'active' | 'inactive';
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        // According to backend README, update_menu_item expects PUT method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update_menu_item`, {
          method: 'PUT',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: result.error || 'Failed to update menu item' };
        }
      } catch (error: any) {
        console.error('Update menu item error:', error);
        return { data: null, error: error.message || 'Failed to update menu item' };
      }
    },

    deleteMenuItem: async (data: {
      menu_item_id: string;
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        // According to backend README, delete_menu_item expects DELETE method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_menu_item`, {
          method: 'DELETE',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: result.error || 'Failed to delete menu item' };
        }
      } catch (error: any) {
        console.error('Delete menu item error:', error);
        return { data: null, error: error.message || 'Failed to delete menu item' };
      }
    },
  },

  // Generic data fetching methods - ALL USE BACKEND FUNCTIONS
  data: {
    getVendors: async (userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };
      
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('get_vendors', {
          body: { page: 1, limit: 100 },
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { vendors: Array, pagination: Object } }
        return { data: result.data?.vendors || [], error: null };
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
        return { data: null, error: { message: 'Failed to fetch vendors' } };
      }
    },

    getMenuItems: async (vendorId: string) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('get_menu_items', {
          body: { vendor_id: vendorId, page: 1, limit: 100 },
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { menu_items: Array, pagination: Object } }
        return { data: result.data?.menu_items || [], error: null };
      } catch (error: any) {
        console.error('Error fetching menu items:', error);
        return { data: null, error: { message: 'Failed to fetch menu items' } };
      }
    },

    getOrders: async (_userRole: string, userEmail: string) => {
      if (!userEmail) return { data: null, error: 'Not authenticated' };

      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('get_orders', {
          body: { page: 1, limit: 100 },
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { orders: Array, pagination: Object } }
        return { data: result.data?.orders || [], error: null };
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        return { data: null, error: { message: 'Failed to fetch orders' } };
      }
    },

    // Legacy method - now uses backend function
    getVendorsForStaff: async (userEmail: string) => {
      return api.data.getVendors(userEmail);
    },

    // Legacy method - now uses backend function  
    getEmployees: async (_userEmail: string) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('get_employees', {
          body: { page: 1, limit: 100 },
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { employees: Array, pagination: Object } }
        return { data: result.data?.employees || [], error: null };
      } catch (error: any) {
        console.error('Error fetching employees:', error);
        return { data: null, error: { message: 'Failed to fetch employees' } };
      }
    },

    // Legacy method - now uses backend function
    getOrganizationStaff: async (_userEmail: string) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('get_organization_staff_members', {
          body: { page: 1, limit: 100 },
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { staff_members: Array, pagination: Object } }
        return { data: result.data?.staff_members || [], error: null };
      } catch (error: any) {
        console.error('Error fetching organization staff:', error);
        return { data: null, error: { message: 'Failed to fetch organization staff' } };
      }
    },

    // Legacy method - now uses backend function
    getOrganization: async (_userEmail: string) => {
      try {
        const headers = await getSessionHeaders();
        
        console.log('=== getOrganization Debug ===');
        console.log('Headers being sent:', headers);
        console.log('Authorization token length:', headers.Authorization?.length);
        console.log('API key length:', headers.apikey?.length);
        
        // Let's also check what user info we have
        const session = await getSession();
        console.log('Current user from session:', session?.user);
        console.log('User email:', session?.user?.email);
        console.log('User ID:', session?.user?.id);
        
        // Let's try to check what role this user has by calling a different function
        console.log('=== Checking User Role ===');
        try {
          // Try to get user role by calling a function that works for any authenticated user
          const { data: userRole, error: roleError } = await supabase.functions.invoke('get_employee', {
            body: { user_email: session?.user?.email },
            headers
          });
          console.log('Employee check result:', { userRole, roleError });
        } catch (e) {
          console.log('Employee check failed:', e);
        }
        
        // According to backend README, get_organization expects GET method
        console.log('=== Calling get_organization with GET method ===');
        console.log('Headers being sent:', headers);
        console.log('Authorization header:', headers.Authorization);
        console.log('Authorization header length:', headers.Authorization?.length);
        
        let result, error;
        
        try {
          // Use direct fetch with GET method as specified in backend README
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_organization`, {
            method: 'GET',
            headers: {
              'Authorization': headers.Authorization,
              'apikey': headers.apikey,
              'Content-Type': 'application/json'
            }
          });
          
          const responseData = await response.json();
          console.log('GET response:', responseData);
          
          if (response.ok) {
            result = responseData;
            error = null;
          } else {
            error = { message: responseData.error || 'GET request failed' };
          }
        } catch (e) {
          console.log('GET request failed:', e);
          error = e;
        }

        console.log('=== getOrganization Response ===');
        console.log('Raw result:', result);
        console.log('Raw error:', error);
        console.log('Result type:', typeof result);
        console.log('Error type:', typeof error);
        
        // Try to get more details about the error
        if (error) {
          console.log('=== Error Details ===');
          console.log('Error message:', (error as any).message);
          console.log('Error details:', error);
          console.log('Error context:', (error as any).context);
          console.log('Error name:', (error as any).name);
          
          // Try to get the response body to see the actual error message
          if ((error as any).context && (error as any).context.body) {
            try {
              const errorBody = await (error as any).context.body.text();
              console.log('Error response body:', errorBody);
            } catch (e) {
              console.log('Could not read error body:', e);
            }
          }
          
          console.log('Full error object:', JSON.stringify(error, null, 2));
          return { data: null, error: { message: (error as any).message } };
        }

        console.log('=== Success Response ===');
        console.log('Result.data:', result.data);
        console.log('Result.data?.organization:', result.data?.organization);
        
        // Backend returns { success: boolean, data: { organization: Object } }
        return { data: result.data?.organization || null, error: null };
      } catch (error: any) {
        console.log('=== Catch Block Error ===');
        console.log('Caught error:', error);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        return { data: null, error: { message: 'Failed to fetch organization' } };
      }
    },

    // Keep the existing getSalesData method as it already uses backend
    getSalesData: async (_userEmail: string, fromDate: string, toDate: string, vendorFilter?: string) => {
      try {
        const requestBody = {
          date_from: fromDate,
          date_to: toDate,
          vendor_id: vendorFilter
        };

        console.log('Sending sales data request:', requestBody);
        
        const { data, error } = await supabase.functions.invoke('get_sales_data', {
          body: requestBody,
          headers: await getSessionHeaders()
        });

        if (error) {
          console.error('Sales data error:', error);
          return { data: null, error: { message: error.message } };
        }

        return { data, error: null };
      } catch (error: any) {
        console.error('Error fetching sales data:', error);
        return { data: null, error: { message: 'Failed to fetch sales data' } };
      }
    },

    getEmployeeAnalytics: async (dateFrom: string, dateTo: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('get_employee_analytics', {
          body: {
            date_from: dateFrom,
            date_to: dateTo
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error fetching employee analytics:', error);
        return { data: null, error: { message: 'Failed to fetch employee analytics' } };
      }
    },

    getVendorAnalytics: async (dateFrom: string, dateTo: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('get_vendor_analytics', {
          body: {
            date_from: dateFrom,
            date_to: dateTo
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error fetching vendor analytics:', error);
        return { data: null, error: { message: 'Failed to fetch vendor analytics' } };
      }
    },

    getStaffAnalytics: async (dateFrom: string, dateTo: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('get_staff_analytics', {
          body: {
            date_from: dateFrom,
            date_to: dateTo
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error fetching staff analytics:', error);
        return { data: null, error: { message: 'Failed to fetch staff analytics' } };
      }
    },

    // Feedback and Complaint System
    submitFeedback: async (orderId: string | null, feedbackContent: string, rating: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('submit_feedback', {
          body: {
            order_id: orderId,
            feedback_content: feedbackContent,
            rating: rating
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error submitting feedback:', error);
        return { data: null, error: { message: 'Failed to submit feedback' } };
      }
    },

    getFeedback: async (orderId?: string, userId?: string, limit: number = 10, offset: number = 0) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('get_feedback', {
          body: {
            order_id: orderId,
            user_id: userId,
            limit: limit,
            offset: offset
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error fetching feedback:', error);
        return { data: null, error: { message: 'Failed to fetch feedback' } };
      }
    },

    updateFeedback: async (feedbackId: string, feedbackContent: string, rating: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('update_feedback', {
          body: {
            feedback_id: feedbackId,
            feedback_content: feedbackContent,
            rating: rating
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error updating feedback:', error);
        return { data: null, error: { message: 'Failed to update feedback' } };
      }
    },

    deleteFeedback: async (feedbackId: string) => {
      try {
        const headers = await getSessionHeaders();
        // According to backend README, delete_feedback expects DELETE method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_feedback`, {
          method: 'DELETE',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            feedback_id: feedbackId
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: { message: result.error || 'Failed to delete feedback' } };
        }
      } catch (error: any) {
        console.error('Error deleting feedback:', error);
        return { data: null, error: { message: 'Failed to delete feedback' } };
      }
    },

    submitComplaint: async (complaintContent: string, priority: string = 'medium') => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('submit_complaint', {
          body: {
            complaint_content: complaintContent,
            priority: priority
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error submitting complaint:', error);
        return { data: null, error: { message: 'Failed to submit complaint' } };
      }
    },

    getComplaints: async (userId?: string, status?: string, priority?: string, limit: number = 10, offset: number = 0) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('get_complaints', {
          body: {
            user_id: userId,
            status: status,
            priority: priority,
            limit: limit,
            offset: offset
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error fetching complaints:', error);
        return { data: null, error: { message: 'Failed to fetch complaints' } };
      }
    },

    updateComplaint: async (complaintId: string, status?: string, priority?: string, resolutionNotes?: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('update_complaint', {
          body: {
            complaint_id: complaintId,
            status: status,
            priority: priority,
            resolution_notes: resolutionNotes
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error updating complaint:', error);
        return { data: null, error: { message: 'Failed to update complaint' } };
      }
    },

    deleteComplaint: async (complaintId: string) => {
      try {
        const headers = await getSessionHeaders();
        // According to backend README, delete_complaint expects DELETE method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_complaint`, {
          method: 'DELETE',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            complaint_id: complaintId
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: { message: result.error || 'Failed to delete complaint' } };
        }
      } catch (error: any) {
        console.error('Error deleting complaint:', error);
        return { data: null, error: { message: 'Failed to delete complaint' } };
      }
    },

    // Bulk Operations
    importCsv: async (type: 'employees' | 'vendors' | 'organization_staff', csvData: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('import_csv', {
          body: {
            type: type,
            csvData: csvData
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error importing CSV:', error);
        return { data: null, error: { message: 'Failed to import CSV' } };
      }
    },

    importMenuItemsCsv: async (csvData: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('import_menu_items_csv', {
          body: {
            csvData: csvData
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error importing menu items CSV:', error);
        return { data: null, error: { message: 'Failed to import menu items CSV' } };
      }
    },

    // Additional Order Management Functions
    addOrderItem: async (orderId: string, menuItemId: string, quantity: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('add_order_item', {
          body: {
            order_id: orderId,
            menu_item_id: menuItemId,
            quantity: quantity
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error adding order item:', error);
        return { data: null, error: { message: 'Failed to add order item' } };
      }
    },

    updateOrderItem: async (orderItemId: string, quantity: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('update_order_item', {
          body: {
            order_item_id: orderItemId,
            quantity: quantity
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error updating order item:', error);
        return { data: null, error: { message: 'Failed to update order item' } };
      }
    },

    deleteOrderItem: async (orderItemId: string) => {
      try {
        const headers = await getSessionHeaders();
        // According to backend README, delete_order_item expects DELETE method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_order_item`, {
          method: 'DELETE',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_item_id: orderItemId
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: { message: result.error || 'Failed to delete order item' } };
        }
      } catch (error: any) {
        console.error('Error deleting order item:', error);
        return { data: null, error: { message: 'Failed to delete order item' } };
      }
    },

    cancelOrderRequest: async (orderId: string, reason: string) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('cancel_order_request', {
          body: {
            order_id: orderId,
            reason: reason
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error requesting order cancellation:', error);
        return { data: null, error: { message: 'Failed to request order cancellation' } };
      }
    },

    handleCancelRequest: async (orderId: string, action: 'accept' | 'reject') => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('handle_cancel_request', {
          body: {
            order_id: orderId,
            action: action
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error handling cancel request:', error);
        return { data: null, error: { message: 'Failed to handle cancel request' } };
      }
    },

    // Additional User Management Functions
    changePassword: async (targetUserId: string, newPassword: string, userType: 'employee' | 'vendor' | 'organization_staff') => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('change_password', {
          body: {
            target_user_id: targetUserId,
            new_password: newPassword,
            user_type: userType
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error changing password:', error);
        return { data: null, error: { message: 'Failed to change password' } };
      }
    },

    updateEmployeeBalance: async (employeeId: string, newBalance: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('update_employee_balance', {
          body: {
            employee_id: employeeId,
            new_balance: newBalance
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error updating employee balance:', error);
        return { data: null, error: { message: 'Failed to update employee balance' } };
      }
    },

    // Organization Management Functions
    updateOrganization: async (name?: string, latitude?: number, longitude?: number) => {
      try {
        const headers = await getSessionHeaders();
        const { data: result, error } = await supabase.functions.invoke('update_organization', {
          body: {
            name: name,
            latitude: latitude,
            longitude: longitude
          },
          headers
        });

        if (error) return { data: null, error: { message: error.message } };
        return { data: result.data, error: null };
      } catch (error: any) {
        console.error('Error updating organization:', error);
        return { data: null, error: { message: 'Failed to update organization' } };
      }
    },

    deleteOrganization: async () => {
      try {
        const headers = await getSessionHeaders();
        // According to backend README, delete_organization expects DELETE method
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete_organization`, {
          method: 'DELETE',
          headers: {
            'Authorization': headers.Authorization,
            'apikey': headers.apikey,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok) {
          return { data: result.data, error: null };
        } else {
          return { data: null, error: { message: result.error || 'Failed to delete organization' } };
        }
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        return { data: null, error: { message: 'Failed to delete organization' } };
      }
    }
  }
};
