import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Real-time hook for orders
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

// Real-time hook for employees
export const useRealtimeEmployees = (onEmployeeChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('employees-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
        },
        () => {
          onEmployeeChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onEmployeeChange]);
};

// Real-time hook for vendors
export const useRealtimeVendors = (onVendorChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('vendors-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
        },
        () => {
          onVendorChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onVendorChange]);
};

// Real-time hook for organization staff
export const useRealtimeOrganizationStaff = (onStaffChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('organization-staff-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_staff',
        },
        () => {
          onStaffChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onStaffChange]);
};

// Real-time hook for organizations
export const useRealtimeOrganizations = (onOrganizationChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('organizations-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organizations',
        },
        () => {
          onOrganizationChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrganizationChange]);
};

// Real-time hook for menu items
export const useRealtimeMenuItems = (onMenuItemChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('menu-items-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
        },
        () => {
          onMenuItemChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onMenuItemChange]);
};

// Real-time hook for order items
export const useRealtimeOrderItems = (onOrderItemChange: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel('order-items-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          onOrderItemChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onOrderItemChange]);
};

// Combined hook for all real-time subscriptions
export const useRealtimeAll = (callbacks: {
  onOrderChange?: () => void;
  onEmployeeChange?: () => void;
  onVendorChange?: () => void;
  onStaffChange?: () => void;
  onOrganizationChange?: () => void;
  onMenuItemChange?: () => void;
  onOrderItemChange?: () => void;
}) => {
  useEffect(() => {
    const channels: any[] = [];

    // Subscribe to orders
    if (callbacks.onOrderChange) {
      const ordersChannel = supabase
        .channel('orders-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          callbacks.onOrderChange
        )
        .subscribe();
      channels.push(ordersChannel);
    }

    // Subscribe to employees
    if (callbacks.onEmployeeChange) {
      const employeesChannel = supabase
        .channel('employees-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'employees',
          },
          callbacks.onEmployeeChange
        )
        .subscribe();
      channels.push(employeesChannel);
    }

    // Subscribe to vendors
    if (callbacks.onVendorChange) {
      const vendorsChannel = supabase
        .channel('vendors-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendors',
          },
          callbacks.onVendorChange
        )
        .subscribe();
      channels.push(vendorsChannel);
    }

    // Subscribe to organization staff
    if (callbacks.onStaffChange) {
      const staffChannel = supabase
        .channel('organization-staff-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_staff',
          },
          callbacks.onStaffChange
        )
        .subscribe();
      channels.push(staffChannel);
    }

    // Subscribe to organizations
    if (callbacks.onOrganizationChange) {
      const orgChannel = supabase
        .channel('organizations-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organizations',
          },
          callbacks.onOrganizationChange
        )
        .subscribe();
      channels.push(orgChannel);
    }

    // Subscribe to menu items
    if (callbacks.onMenuItemChange) {
      const menuChannel = supabase
        .channel('menu-items-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'menu_items',
          },
          callbacks.onMenuItemChange
        )
        .subscribe();
      channels.push(menuChannel);
    }

    // Subscribe to order items
    if (callbacks.onOrderItemChange) {
      const orderItemsChannel = supabase
        .channel('order-items-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items',
          },
          callbacks.onOrderItemChange
        )
        .subscribe();
      channels.push(orderItemsChannel);
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [callbacks]);
};
