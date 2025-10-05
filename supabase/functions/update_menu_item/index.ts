// Update menu item - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';
import { authenticateUserByEmail } from '../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateMenuItemRequest {
  user_email: string;
  menu_item_id: string;
  name?: string;
  price?: number;
  image_url?: string;
  status?: 'active' | 'inactive';
}

interface UpdateMenuItemResponse {
  menu_item: {
    id: string;
    org_id: string;
    vendor_id: string;
    name: string;
    price: number;
    image_url?: string;
    status: 'active' | 'inactive';
    updated_at: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'PUT') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: UpdateMenuItemRequest = await req.json();

    // Validate required fields
    if (!body.user_email || !body.menu_item_id) {
      return createErrorResponse('User email and menu item ID are required', 400);
    }

    // Authenticate user by email
    const authResult = await authenticateUserByEmail(body.user_email);
    
    if (!authResult.success || !authResult.user) {
      return createErrorResponse('Authentication failed', 401);
    }

    // Check if user is vendor
    if (authResult.user.role !== 'vendor') {
      return createErrorResponse('Only vendors can update menu items', 403);
    }

    // Check if menu item exists and belongs to the vendor
    const { data: existingItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', body.menu_item_id)
      .eq('vendor_id', authResult.user.user_id)
      .single();

    if (fetchError || !existingItem) {
      return createErrorResponse('Menu item not found or access denied', 404);
    }

    // Validate price if provided
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
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

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.status !== undefined) updateData.status = body.status;

    // Update menu item
    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', body.menu_item_id)
      .eq('vendor_id', authResult.user.user_id)
      .select()
      .single();

    if (updateError || !updatedItem) {
      return createErrorResponse(`Failed to update menu item: ${updateError?.message}`, 400);
    }

    const response: UpdateMenuItemResponse = {
      menu_item: {
        id: updatedItem.id,
        org_id: updatedItem.org_id,
        vendor_id: updatedItem.vendor_id,
        name: updatedItem.name,
        price: updatedItem.price,
        image_url: updatedItem.image_url,
        status: updatedItem.status,
        updated_at: updatedItem.updated_at
      }
    };

    return createSuccessResponse(response, 'Menu item updated successfully');

  } catch (error) {
    console.error('Update menu item error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
