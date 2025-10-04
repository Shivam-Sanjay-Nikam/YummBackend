import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types';

export const useRealtimeOrders = (onOrderChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          onOrderChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrderChange]);
};
