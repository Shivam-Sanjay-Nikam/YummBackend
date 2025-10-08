import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export const useRealtimeBalance = () => {
  const { user, refreshUser } = useAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'employee') return;

    // Listen for changes to the employees table for this user
    const channel = supabase
      .channel('employee_balance_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employees',
          filter: `id=eq.${user.user_id}`,
        },
        (payload) => {
          console.log('Balance updated:', payload);
          // Refresh user data to get the new balance
          refreshUser();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshUser]);
};
