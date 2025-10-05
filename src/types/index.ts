export type UserRole = 'organization_staff' | 'employee' | 'vendor';

export type OrderStatus = 'placed' | 'preparing' | 'prepared' | 'given' | 'cancelled' | 'cancel_requested';

export type MenuItemStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  org_id: string;
  user_id: string; // ID from the actual user record in the respective table
  name?: string;
  balance?: number;
}

export interface Organization {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  special_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  org_id: string;
  name: string;
  email: string;
  phone_number?: string;
  special_number?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  email: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  org_id: string;
  vendor_id: string;
  name: string;
  image_url?: string;
  price: number;
  status: MenuItemStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  menu_items?: {
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  org_id: string;
  employee_id: string;
  vendor_id: string;
  timestamp: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  employees?: {
    name: string;
    email: string;
  };
  vendors?: {
    name: string;
  };
}

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  total_employees: number;
  total_vendors: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Registration types
export interface RegisterOrganizationRequest {
  org_name: string;
  latitude?: number;
  longitude?: number;
  special_number?: string;
  staff_name: string;
  staff_email: string;
  staff_password: string;
  staff_phone?: string;
}

export interface RegisterOrganizationResponse {
  organization: Organization;
  staff: {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    created_at: string;
  };
  auth: {
    access_token: string;
    refresh_token: string;
    user_id: string;
  };
}

// Employee creation types
export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  special_number?: string;
  balance?: number;
}

export interface CreateEmployeeResponse {
  employee: Employee;
  auth: {
    user_id: string;
    email: string;
  };
}

// Vendor creation types
export interface CreateVendorRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateVendorResponse {
  vendor: Vendor;
  auth: {
    user_id: string;
    email: string;
  };
}

// Menu item types
export interface AddMenuItemRequest {
  name: string;
  price: number;
  image_url?: string;
  status?: 'active' | 'inactive';
}

export interface AddMenuItemResponse {
  menu_item: MenuItem;
}

// Order types
export interface PlaceOrderRequest {
  vendor_id: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
  }>;
}

export interface PlaceOrderResponse {
  order: Order;
  order_items: Array<{
    id: string;
    menu_item_id: string;
    quantity: number;
    total_cost: number;
    menu_item_name: string;
    menu_item_price: number;
  }>;
}

// Cancel request types
export interface CancelOrderRequest {
  order_id: string;
  reason?: string;
}

export interface CancelOrderResponse {
  order: {
    id: string;
    status: string;
    updated_at: string;
  };
  message: string;
}

export interface HandleCancelRequest {
  order_id: string;
  action: 'accept' | 'reject';
  reason?: string;
}

export interface HandleCancelResponse {
  order: {
    id: string;
    status: string;
    updated_at: string;
  };
  message: string;
}

// Balance update types
export interface UpdateBalanceRequest {
  employee_id: string;
  new_balance: number;
}

export interface UpdateBalanceResponse {
  employee: {
    id: string;
    name: string;
    email: string;
    old_balance: number;
    new_balance: number;
    updated_at: string;
  };
}
