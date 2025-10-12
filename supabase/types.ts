// Shared types for CRUD operations
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          latitude?: number;
          longitude?: number;
          special_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          latitude?: number;
          longitude?: number;
          special_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          special_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_staff: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          name?: string;
          password?: string;
          phone_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          name?: string;
          password?: string;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          name?: string;
          password?: string;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          org_id: string;
          phone_number?: string;
          email?: string;
          password?: string;
          name?: string;
          special_number?: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          phone_number?: string;
          email?: string;
          password?: string;
          name?: string;
          special_number?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          phone_number?: string;
          email?: string;
          password?: string;
          name?: string;
          special_number?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          org_id: string;
          name?: string;
          email?: string;
          password?: string;
          phone_number?: string;
          latitude?: number;
          longitude?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name?: string;
          email?: string;
          password?: string;
          phone_number?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          email?: string;
          password?: string;
          phone_number?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          org_id: string;
          vendor_id: string;
          name?: string;
          image_url?: string;
          price?: number;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          vendor_id: string;
          name?: string;
          image_url?: string;
          price?: number;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          vendor_id?: string;
          name?: string;
          image_url?: string;
          price?: number;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          vendor_id: string;
          timestamp: string;
          order_date: string;
          status: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          vendor_id: string;
          timestamp?: string;
          order_date?: string;
          status?: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          employee_id?: string;
          vendor_id?: string;
          timestamp?: string;
          order_date?: string;
          status?: 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          total_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity?: number;
          total_cost: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          quantity?: number;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type TableName = keyof Database['public']['Tables'];
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  [key: string]: any;
}
