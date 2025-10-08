import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    set({ loading: true });
    
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        // Validate that the user object has required fields
        if (user && user.id && user.email && user.role) {
          set({ user, loading: false });
        } else {
          // Invalid user data, clear it
          localStorage.removeItem('user');
          set({ user: null, loading: false });
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        set({ user: null, loading: false });
      }
    } else {
      set({ user: null, loading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true });
    
    try {
      // Import the API here to avoid circular dependencies
      const { api } = await import('../services/api');
      const { data, error } = await api.auth.login(email, password);
      
      if (error) {
        set({ loading: false });
        return { success: false, error: error.message };
      }
      
      if (data?.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          org_id: data.user.org_id,
          user_id: data.user.user_id,
          name: data.user.name,
          balance: data.user.balance,
        };
        
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, loading: false });
        return { success: true };
      }
      
      set({ loading: false });
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  logout: () => {
    // Clear all user-related data
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Clear cart data too
    set({ user: null });
    // Redirect to landing page after logout
    window.location.href = '/';
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user?.email) return;

    try {
      // Import the API here to avoid circular dependencies
      const { api } = await import('../services/api');
      
      // Get fresh user data from database
      if (user.role === 'employee') {
        const { data: employees, error } = await api.data.getEmployees(user.email);
        if (!error && employees && employees.length > 0) {
          const updatedUser = { ...user, balance: employees[0].balance };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else if (user.role === 'organization_staff') {
        const { data: staff, error } = await api.data.getOrganizationStaff(user.email);
        if (!error && staff && staff.length > 0) {
          const updatedUser = { ...user, name: staff[0].name };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else if (user.role === 'vendor') {
        const { data: vendors, error } = await api.data.getVendors(user.email);
        if (!error && vendors && vendors.length > 0) {
          const updatedUser = { ...user, name: vendors[0].name };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, keep the current user (don't log out)
    }
  },

  updateUserBalance: (newBalance: number) => {
    const { user } = get();
    if (user && user.role === 'employee') {
      const updatedUser = { ...user, balance: newBalance };
      set({ user: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },
}));
