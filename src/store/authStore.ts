import { create } from 'zustand';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

// Helper function to determine user role and get user data
const getUserRoleAndData = async (authUserId: string, email: string) => {
  // Check organization_staff first
  const { data: staff, error: staffError } = await supabase
    .from('organization_staff')
    .select('id, org_id, email, name')
    .eq('email', email)
    .single();

  if (staff && !staffError) {
    return {
      role: 'organization_staff' as UserRole,
      org_id: staff.org_id,
      user_id: staff.id,
      name: staff.name,
    };
  }

  // Check employees
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, org_id, email, name, balance')
    .eq('email', email)
    .single();

  if (employee && !employeeError) {
    return {
      role: 'employee' as UserRole,
      org_id: employee.org_id,
      user_id: employee.id,
      name: employee.name,
      balance: employee.balance,
    };
  }

  // Check vendors
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, org_id, email, name')
    .eq('email', email)
    .single();

  if (vendor && !vendorError) {
    return {
      role: 'vendor' as UserRole,
      org_id: vendor.org_id,
      user_id: vendor.id,
      name: vendor.name,
    };
  }

  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  initialize: async () => {
    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && session.user.email) {
      const userData = await getUserRoleAndData(session.user.id, session.user.email);
      
      if (userData) {
        const user: User = {
          id: session.user.id,
          email: session.user.email,
          role: userData.role,
          org_id: userData.org_id,
          user_id: userData.user_id,
          name: userData.name,
          balance: userData.balance,
        };
        set({ user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } else {
      set({ user: null, loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && session.user.email) {
        const userData = await getUserRoleAndData(session.user.id, session.user.email);
        
        if (userData) {
          const user: User = {
            id: session.user.id,
            email: session.user.email,
            role: userData.role,
            org_id: userData.org_id,
            user_id: userData.user_id,
            name: userData.name,
            balance: userData.balance,
          };
          set({ user });
        } else {
          set({ user: null });
        }
      } else {
        set({ user: null });
      }
    });
  },
}));
