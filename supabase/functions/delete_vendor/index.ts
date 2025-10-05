// Delete vendor - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DeleteVendorRequest {
  vendor_id: string;
  user_email?: string;
}

interface DeleteVendorResponse {
  message: string;
  deleted_vendor: {
    id: string;
    name: string;
    email: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Get user info from request body for custom auth
    const body: DeleteVendorRequest = await req.json();
    
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
    }

    if (!body.vendor_id) {
      return createErrorResponse('Vendor ID is required', 400);
    }

    // Get user info from database
    const { data: userRecord, error: userError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email')
      .eq('email', body.user_email)
      .single();

    if (userError || !userRecord) {
      return createErrorResponse('User not found or not authorized', 401);
    }

    // Check if vendor exists and belongs to the same organization
    const { data: existingVendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, email, org_id')
      .eq('id', body.vendor_id)
      .eq('org_id', userRecord.org_id)
      .single();

    if (vendorError || !existingVendor) {
      return createErrorResponse('Vendor not found or not authorized', 404);
    }

    // Check if vendor has any orders (optional - you might want to prevent deletion if they have orders)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('vendor_id', body.vendor_id)
      .limit(1);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
      // Continue with deletion even if we can't check orders
    }

    if (orders && orders.length > 0) {
      return createErrorResponse('Cannot delete vendor with existing orders. Please handle their orders first.', 400);
    }

    // Check if vendor has any menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('vendor_id', body.vendor_id)
      .limit(1);

    if (menuError) {
      console.error('Error checking menu items:', menuError);
      // Continue with deletion even if we can't check menu items
    }

    if (menuItems && menuItems.length > 0) {
      return createErrorResponse('Cannot delete vendor with existing menu items. Please delete their menu items first.', 400);
    }

    // Delete vendor record
    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', body.vendor_id);

    if (deleteError) {
      return createErrorResponse(`Failed to delete vendor: ${deleteError.message}`, 400);
    }

    const response: DeleteVendorResponse = {
      message: 'Vendor deleted successfully',
      deleted_vendor: {
        id: existingVendor.id,
        name: existingVendor.name,
        email: existingVendor.email
      }
    };

    return createSuccessResponse(response, 'Vendor deleted successfully');

  } catch (error) {
    console.error('Delete vendor error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
