// Get sales data - only accessible by organization staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GetSalesDataRequest {
  date_from: string;
  date_to: string;
  vendor_id?: string;
  user_email?: string;
}

interface SalesData {
  vendor_id: string;
  vendor_name: string;
  total_sales: number;
  order_count: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  employee_email: string;
  vendor_name: string;
  amount: number;
  order_date: string;
  status: string;
}

interface GetSalesDataResponse {
  sales_data: SalesData[];
  summary: {
    total_sales: number;
    total_orders: number;
    active_vendors: number;
    date_range: {
      from: string;
      to: string;
    };
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: GetSalesDataRequest = await req.json();
    
    console.log('Sales data request body:', body);

    // Authenticate user using email
    if (!body.user_email) {
      console.log('Missing user_email in request');
      return createErrorResponse('User email required for authentication', 401);
    }

    const authResult = await authenticateUserByEmail(body.user_email);
    
    console.log('Authentication result:', authResult);
    
    if (!authResult.success || !authResult.user) {
      console.log('Authentication failed for user:', body.user_email);
      return createErrorResponse('Authentication failed', 401);
    }

    // Check if user is organization staff
    if (authResult.user.role !== 'organization_staff') {
      console.log('User role is not organization_staff:', authResult.user.role);
      return createErrorResponse('Only organization staff can access sales data', 403);
    }

    // Validate required fields
    if (!body.date_from || !body.date_to || body.date_from.trim() === '' || body.date_to.trim() === '') {
      console.log('Missing required fields:', { date_from: body.date_from, date_to: body.date_to });
      return createErrorResponse('Missing required fields: date_from, date_to', 400);
    }

    // Validate date format and range
    const dateFrom = new Date(body.date_from);
    const dateTo = new Date(body.date_to);
    
    console.log('Parsed dates:', { dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() });
    
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      console.log('Invalid date format:', { date_from: body.date_from, date_to: body.date_to });
      return createErrorResponse('Invalid date format. Use YYYY-MM-DD', 400);
    }

    if (dateFrom > dateTo) {
      console.log('Start date after end date:', { dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() });
      return createErrorResponse('Start date cannot be after end date', 400);
    }

    // Get orders with vendor and employee details for the date range
    let query = supabase
      .from('orders')
      .select(`
        id,
        vendor_id,
        employee_id,
        total_amount,
        order_date,
        status,
        created_at,
        vendors!inner(name),
        employees!inner(email)
      `)
      .eq('org_id', authResult.user.org_id)
      .gte('order_date', body.date_from)
      .lte('order_date', body.date_to)
      .order('order_date', { ascending: false });

    // Filter by vendor if specified
    if (body.vendor_id && body.vendor_id !== 'all') {
      query = query.eq('vendor_id', body.vendor_id);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return createErrorResponse('Failed to fetch sales data', 500);
    }

    // Group by vendor
    const vendorMap = new Map<string, SalesData>();
    
    orders?.forEach(order => {
      const vendorId = order.vendor_id;
      const vendorName = (order.vendors as any).name;
      const employeeEmail = (order.employees as any).email;
      
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendor_id: vendorId,
          vendor_name: vendorName,
          total_sales: 0,
          order_count: 0,
          transactions: []
        });
      }
      
      const vendor = vendorMap.get(vendorId)!;
      vendor.total_sales += order.total_amount;
      vendor.order_count += 1;
      vendor.transactions.push({
        id: order.id,
        employee_email: employeeEmail,
        vendor_name: vendorName,
        amount: order.total_amount,
        order_date: order.order_date,
        status: order.status
      });
    });

    const salesData = Array.from(vendorMap.values());
    
    // Calculate summary
    const totalSales = salesData.reduce((sum, vendor) => sum + vendor.total_sales, 0);
    const totalOrders = salesData.reduce((sum, vendor) => sum + vendor.order_count, 0);
    const activeVendors = salesData.length;

    const response: GetSalesDataResponse = {
      sales_data: salesData,
      summary: {
        total_sales: totalSales,
        total_orders: totalOrders,
        active_vendors: activeVendors,
        date_range: {
          from: body.date_from,
          to: body.date_to
        }
      }
    };

    return createSuccessResponse(response, 'Sales data retrieved successfully');

  } catch (error) {
    console.error('Get sales data error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
