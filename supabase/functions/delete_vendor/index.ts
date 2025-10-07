// Delete vendor - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';

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
    
    console.log('Delete vendor request:', { vendor_id: body.vendor_id, user_email: body.user_email });
    
    if (!body.user_email) {
      console.error('Missing user_email in request');
      return createErrorResponse('User email required for authentication', 401);
    }

    if (!body.vendor_id) {
      console.error('Missing vendor_id in request');
      return createErrorResponse('Vendor ID is required', 400);
    }

    // Get user info from database
    const { data: userRecord, error: userError } = await supabase
      .from('organization_staff')
      .select('id, org_id, email')
      .eq('email', body.user_email)
      .single();

    if (userError || !userRecord) {
      console.error('User authentication failed:', userError);
      return createErrorResponse('User not found or not authorized', 401);
    }

    console.log('User authenticated:', { user_id: userRecord.id, org_id: userRecord.org_id });

    // Check if vendor exists and belongs to the same organization
    const { data: existingVendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, email, org_id')
      .eq('id', body.vendor_id)
      .eq('org_id', userRecord.org_id)
      .single();

    if (vendorError || !existingVendor) {
      console.error('Vendor not found or not authorized:', vendorError);
      return createErrorResponse('Vendor not found or not authorized', 404);
    }

    console.log('Vendor found:', { vendor_id: existingVendor.id, vendor_name: existingVendor.name });

    // Check if vendor has any orders (for warning purposes)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('vendor_id', body.vendor_id)
      .limit(1);

    if (ordersError) {
      console.error('Error checking orders:', ordersError);
    }

    // Check if vendor has any menu items (for warning purposes)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('vendor_id', body.vendor_id)
      .limit(1);

    if (menuError) {
      console.error('Error checking menu items:', menuError);
    }

    // Log warnings if vendor has related data
    if (orders && orders.length > 0) {
      console.warn(`Vendor ${body.vendor_id} has ${orders.length} orders - proceeding with deletion`);
    }
    if (menuItems && menuItems.length > 0) {
      console.warn(`Vendor ${body.vendor_id} has ${menuItems.length} menu items - proceeding with deletion`);
    }

    // Delete vendor record
    console.log('Attempting to delete vendor:', body.vendor_id);
    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', body.vendor_id);

    if (deleteError) {
      console.error('Failed to delete vendor:', deleteError);
      return createErrorResponse(`Failed to delete vendor: ${deleteError.message}`, 400);
    }

    console.log('Vendor deleted successfully:', body.vendor_id);

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
