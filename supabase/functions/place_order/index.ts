// Place order - only accessible by employee
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors, validateUuid } from '../../shared/utils.ts';
import { authenticateUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OrderItem {
  menu_item_id: string;
  quantity: number;
}

interface PlaceOrderRequest {
  vendor_id: string;
  items: OrderItem[];
}

interface PlaceOrderResponse {
  order: {
    id: string;
    org_id: string;
    employee_id: string;
    vendor_id: string;
    timestamp: string;
    order_date: string;
    status: string;
    total_amount: number;
    created_at: string;
  };
  order_items: Array<{
    id: string;
    menu_item_id: string;
    quantity: number;
    total_cost: number;
    menu_item_name: string;
    menu_item_price: number;
  }>;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    const authResult = await authenticateUser(authHeader || '');
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication required', 401);
    }

    // Check if user is employee
    if (authResult.user.role !== 'employee') {
      return createErrorResponse('Only employees can place orders', 403);
    }

    const body: PlaceOrderRequest = await req.json();

    // Validate required fields
    if (!body.vendor_id || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return createErrorResponse('Missing required fields: vendor_id, items (non-empty array)', 400);
    }

    // Validate vendor_id format
    if (!validateUuid(body.vendor_id)) {
      return createErrorResponse('Invalid vendor ID format', 400);
    }

    // Validate items
    for (const item of body.items) {
      if (!item.menu_item_id || !item.quantity) {
        return createErrorResponse('Each item must have menu_item_id and quantity', 400);
      }
      if (!validateUuid(item.menu_item_id)) {
        return createErrorResponse('Invalid menu item ID format', 400);
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return createErrorResponse('Quantity must be a positive number', 400);
      }
    }

    // Verify vendor exists and belongs to the same organization
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, org_id, name')
      .eq('id', body.vendor_id)
      .single();

    if (vendorError || !vendor) {
      return createErrorResponse('Vendor not found', 404);
    }

    if (vendor.org_id !== authResult.user.org_id) {
      return createErrorResponse('Vendor does not belong to your organization', 403);
    }

    // Get menu items and validate they belong to the vendor
    const menuItemIds = body.items.map(item => item.menu_item_id);
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, name, price, status, vendor_id')
      .in('id', menuItemIds);

    if (menuItemsError || !menuItems) {
      return createErrorResponse('Failed to fetch menu items', 400);
    }

    // Validate all menu items exist and belong to the vendor
    if (menuItems.length !== menuItemIds.length) {
      return createErrorResponse('Some menu items not found', 404);
    }

    for (const menuItem of menuItems) {
      if (menuItem.vendor_id !== body.vendor_id) {
        return createErrorResponse('Menu item does not belong to the specified vendor', 400);
      }
      if (menuItem.status !== 'active') {
        return createErrorResponse(`Menu item "${menuItem.name}" is not active`, 400);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = body.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id)!;
      const totalCost = menuItem.price * item.quantity;
      totalAmount += totalCost;
      
      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        total_cost: totalCost
      };
    });

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        org_id: authResult.user.org_id,
        employee_id: authResult.user.user_id,
        vendor_id: body.vendor_id,
        timestamp: new Date().toISOString(),
        order_date: new Date().toISOString().split('T')[0],
        status: 'placed',
        total_amount: totalAmount
      })
      .select()
      .single();

    if (orderError || !order) {
      return createErrorResponse(`Failed to create order: ${orderError?.message}`, 400);
    }

    // Create order items
    const orderItemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { data: createdOrderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)
      .select(`
        id,
        menu_item_id,
        quantity,
        total_cost,
        menu_items!inner(name, price)
      `);

    if (orderItemsError || !createdOrderItems) {
      // Clean up order if order items creation failed
      await supabase.from('orders').delete().eq('id', order.id);
      return createErrorResponse(`Failed to create order items: ${orderItemsError?.message}`, 400);
    }

    const response: PlaceOrderResponse = {
      order: {
        id: order.id,
        org_id: order.org_id,
        employee_id: order.employee_id,
        vendor_id: order.vendor_id,
        timestamp: order.timestamp,
        order_date: order.order_date,
        status: order.status,
        total_amount: totalAmount,
        created_at: order.created_at
      },
      order_items: createdOrderItems.map(item => ({
        id: item.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        total_cost: item.total_cost,
        menu_item_name: (item.menu_items as any).name,
        menu_item_price: (item.menu_items as any).price
      }))
    };

    return createSuccessResponse(response, 'Order placed successfully');

  } catch (error) {
    console.error('Place order error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
