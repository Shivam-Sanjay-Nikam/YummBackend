import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sjtttdnqjgwggczhwzad.supabase.co/functions/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const api = {
  auth: {
    registerOrganization: async (data: { 
      org_name: string; 
      staff_name: string; 
      staff_email: string; 
      staff_password: string;
      staff_phone?: string;
      latitude?: number;
      longitude?: number;
      special_number?: string;
    }) => {
      console.log('Registering organization with data:', data);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Anon key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // For registration, no authentication is required (public endpoint)
      const response = await fetch(`${API_BASE_URL}/register_organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Registration response status:', response.status);
      const result = await response.json();
      console.log('Registration response:', result);
      return result;
    },

    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },

    logout: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
  },

  staff: {
    createEmployee: (data: { 
      name: string; 
      email: string; 
      password: string; 
      balance?: number;
      phone_number?: string;
      special_number?: string;
    }) =>
      apiClient.post('/create_employee', data),

    createVendor: (data: { 
      name: string; 
      email: string; 
      password: string; 
      phone_number?: string;
      latitude?: number;
      longitude?: number;
    }) =>
      apiClient.post('/create_vendor', data),

    updateEmployeeBalance: (data: { 
      employee_id: string; 
      new_balance: number;
    }) =>
      apiClient.put('/update_employee_balance', data),
  },

  employee: {
    placeOrder: (data: { 
      vendor_id: string; 
      items: Array<{ menu_item_id: string; quantity: number }> 
    }) =>
      apiClient.post('/place_order', data),

    cancelOrderRequest: (data: { 
      order_id: string; 
      reason?: string;
    }) =>
      apiClient.post('/cancel_order_request', data),
  },

  vendor: {
    addMenuItem: (data: { 
      name: string; 
      price: number; 
      image_url?: string; 
      status?: 'active' | 'inactive';
    }) =>
      apiClient.post('/vendor_add_menu_item', data),

    handleCancelRequest: (data: { 
      order_id: string; 
      action: 'accept' | 'reject'; 
      reason?: string;
    }) =>
      apiClient.post('/handle_cancel_request', data),
  },

  // Generic data fetching methods
  data: {
    getVendors: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      // Try to get user's org_id from organization_staff first
      let { data: userRecord } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', user.email)
        .single();

      // If not found in organization_staff, try employees table
      if (!userRecord) {
        const { data: employeeRecord } = await supabase
          .from('employees')
          .select('org_id')
          .eq('email', user.email)
          .single();
        userRecord = employeeRecord;
      }

      // If still not found, try vendors table
      if (!userRecord) {
        const { data: vendorRecord } = await supabase
          .from('vendors')
          .select('org_id')
          .eq('email', user.email)
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

    getOrders: async (userRole: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

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
          .eq('email', user.email)
          .single();
        if (employee) {
          query = query.eq('employee_id', employee.id);
        }
      } else if (userRole === 'vendor') {
        // Get vendor's user_id from vendors table
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('email', user.email)
          .single();
        if (vendor) {
          query = query.eq('vendor_id', vendor.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      return { data, error };
    },

    getEmployees: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      console.log('Getting employees for user:', user.email);

      // Get user's org_id from the auth store
      const { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', user.email)
        .single();

      console.log('User record:', userRecord, 'Error:', userError);

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('org_id', userRecord.org_id);

      console.log('Employees query result:', data, 'Error:', error);
      return { data, error };
    },

    getVendorsForStaff: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'Not authenticated' };

      console.log('Getting vendors for user:', user.email);

      // Get user's org_id from the auth store
      const { data: userRecord, error: userError } = await supabase
        .from('organization_staff')
        .select('org_id')
        .eq('email', user.email)
        .single();

      console.log('User record:', userRecord, 'Error:', userError);

      if (!userRecord) return { data: null, error: 'User not found' };

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('org_id', userRecord.org_id);

      console.log('Vendors query result:', data, 'Error:', error);
      return { data, error };
    },
  },
};

export default apiClient;
