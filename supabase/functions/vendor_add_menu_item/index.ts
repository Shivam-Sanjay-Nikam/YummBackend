// Add menu item - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';
import { authenticateUserByEmail } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AddMenuItemRequest {
  user_email: string;
  name: string;
  price: number;
  image_url?: string;
  status?: 'active' | 'inactive';
}

interface AddMenuItemResponse {
  menu_item: {
    id: string;
    org_id: string;
    vendor_id: string;
    name: string;
    price: number;
    image_url?: string;
    status: 'active' | 'inactive';
    created_at: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: AddMenuItemRequest = await req.json();

    // Validate required fields
    if (!body.user_email) {
      return createErrorResponse('User email is required', 400);
    }

    // Authenticate user by email
    const authResult = await authenticateUserByEmail(body.user_email);
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication failed', 401);
    }

    // Check if user is vendor
    if (authResult.user.role !== 'vendor') {
      return createErrorResponse('Only vendors can add menu items', 403);
    }

    // Validate required fields
    if (!body.name || body.price === undefined) {
      return createErrorResponse('Missing required fields: name, price', 400);
    }

    // Validate price
    if (typeof body.price !== 'number' || body.price < 0) {
      return createErrorResponse('Price must be a non-negative number', 400);
    }

    // Validate status if provided
    if (body.status && !['active', 'inactive'].includes(body.status)) {
      return createErrorResponse('Status must be either "active" or "inactive"', 400);
    }

    // Validate image URL format if provided
    if (body.image_url) {
      try {
        new URL(body.image_url);
      } catch {
        return createErrorResponse('Invalid image URL format', 400);
      }
    }

    // Create menu item
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .insert({
        org_id: authResult.user.org_id,
        vendor_id: authResult.user.user_id,
        name: body.name,
        price: body.price,
        image_url: body.image_url,
        status: body.status || 'active'
      })
      .select()
      .single();

    if (menuItemError || !menuItem) {
      return createErrorResponse(`Failed to create menu item: ${menuItemError?.message}`, 400);
    }

    const response: AddMenuItemResponse = {
      menu_item: {
        id: menuItem.id,
        org_id: menuItem.org_id,
        vendor_id: menuItem.vendor_id,
        name: menuItem.name,
        price: menuItem.price,
        image_url: menuItem.image_url,
        status: menuItem.status,
        created_at: menuItem.created_at
      }
    };

    return createSuccessResponse(response, 'Menu item added successfully');

  } catch (error) {
    console.error('Add menu item error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
