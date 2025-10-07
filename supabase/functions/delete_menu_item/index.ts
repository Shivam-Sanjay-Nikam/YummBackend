// Delete menu item - only accessible by vendor
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DeleteMenuItemRequest {
  user_email: string;
  menu_item_id: string;
}

interface DeleteMenuItemResponse {
  message: string;
  deleted_item_id: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'DELETE') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    const body: DeleteMenuItemRequest = await req.json();

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
      return createErrorResponse('Only vendors can delete menu items', 403);
    }

    // Check if menu item exists and belongs to the vendor
    const { data: existingItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('id', body.menu_item_id)
      .eq('vendor_id', authResult.user.user_id)
      .single();

    if (fetchError || !existingItem) {
      return createErrorResponse('Menu item not found or access denied', 404);
    }

    // Check if menu item is being used in any active orders
    const { data: activeOrders, error: ordersError } = await supabase
      .from('order_items')
      .select('id')
      .eq('menu_item_id', body.menu_item_id)
      .limit(1);

    if (ordersError) {
      console.error('Error checking active orders:', ordersError);
      // Continue with deletion even if we can't check orders
    } else if (activeOrders && activeOrders.length > 0) {
      return createErrorResponse('Cannot delete menu item that is part of existing orders', 400);
    }

    // Delete menu item
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', body.menu_item_id)
      .eq('vendor_id', authResult.user.user_id);

    if (deleteError) {
      return createErrorResponse(`Failed to delete menu item: ${deleteError.message}`, 400);
    }

    const response: DeleteMenuItemResponse = {
      message: `Menu item "${existingItem.name}" deleted successfully`,
      deleted_item_id: body.menu_item_id
    };

    return createSuccessResponse(response, 'Menu item deleted successfully');

  } catch (error) {
    console.error('Delete menu item error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
