import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getSession, signInWithEmailPassword, signOut as authSignOut } from '../lib/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    set({ loading: true });
    
    try {
      // Use the new auth helper to get session (no direct supabase.auth calls)
      const session = await getSession();

      // If no session, just set loading to false
      if (!session || !session.user) {
        set({ user: null, loading: false });
        return;
      }

      if (session && session.user) {
        // We have a valid session, try to get user from localStorage first
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
              // Verify the stored user matches the session user
              if (parsedUser.id === session.user.id) {
                set({ user: parsedUser, loading: false });
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        // If no valid stored user, we need to get user details
        // Since direct DB queries fail due to RLS, we'll use a different approach
        // For now, we'll sign out and force re-login
        console.log('No valid stored user found, signing out to force re-login');
        await authSignOut();
        localStorage.removeItem('user');
        set({ user: null, loading: false });
        return;
      }

      // No valid session or user details, clear everything
      localStorage.removeItem('user');
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Error initializing auth:', error);
      localStorage.removeItem('user');
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

  logout: async () => {
    try {
      // Use the new auth helper for sign out
      await authSignOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
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
      // Check if we have a valid Supabase session using auth helper
      const session = await getSession();
      
      if (!session) {
        console.log('No valid session found, logging out');
        get().logout();
        return;
      }

      // Validate the session by checking stored user
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
              // Verify the stored user matches the session user
              if (parsedUser.id === session.user.id) {
                set({ user: parsedUser });
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        // If no valid stored user, sign out
        console.log('Session validation failed, logging out');
        get().logout();
      } catch (error) {
        console.error('Error validating session:', error);
        get().logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, log out to force re-authentication
      get().logout();
    }
  },
}));
