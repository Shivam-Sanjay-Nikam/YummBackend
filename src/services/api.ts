import { supabase } from '../lib/supabaseClient';
import { getSession } from '../lib/auth';
import { useAuthStore } from '../store/authStore';

// All API calls now use Supabase Edge Functions directly

// Session management is now handled by the auth helper

// Simple session validation using the new auth helper
const validateSession = async () => {
  const session = await getSession();
  if (!session) {
    throw new Error('No valid session found. Please log in again.');
  }
  return session;
};

// Helper function to get session headers for API calls
const getSessionHeaders = async () => {
  const session = await validateSession();
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

        if (error) {
          return { error: { message: error.message } };
        }

        if (!result.success) {
          return { error: { message: result.error } };
        }

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
        
        const { data: result, error } = await supabase.functions.invoke('update_menu_item', {
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
        console.error('Update menu item error:', error);
        return { data: null, error: error.message || 'Failed to update menu item' };
      }
    },

    deleteMenuItem: async (data: {
      menu_item_id: string;
    }) => {
      try {
        const headers = await getSessionHeaders();
        
        const { data: result, error } = await supabase.functions.invoke('delete_menu_item', {
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
        
        const { data: result, error } = await supabase.functions.invoke('get_organization', {
          headers
        });

        if (error) {
          return { data: null, error: { message: error.message } };
        }

        // Backend returns { success: boolean, data: { organization: Object } }
        return { data: result.data?.organization || null, error: null };
      } catch (error: any) {
        console.error('Error fetching organization:', error);
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
    }
  }
};
