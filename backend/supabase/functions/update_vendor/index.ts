// Update vendor - only accessible by organization_staff
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { authenticateUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateVendorRequest {
  vendor_id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
}

interface UpdateVendorResponse {
  vendor: {
    id: string;
    org_id: string;
    name: string;
    email: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
    updated_at: string;
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Authenticate the requesting user using Supabase Auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authorization header is required', 401);
    }

    const authResult = await authenticateUser(authHeader);
    if (!authResult.success) {
      return createErrorResponse('Authentication failed', 401);
    }

    const body: UpdateVendorRequest = await req.json();

    if (!body.vendor_id) {
      return createErrorResponse('Vendor ID is required', 400);
    }

    // Check if vendor exists and belongs to the same organization
    const { data: existingVendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', body.vendor_id)
      .eq('org_id', authResult.user!.org_id)
      .single();

    if (vendorError || !existingVendor) {
      return createErrorResponse('Vendor not found or not authorized', 404);
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;

    // If email is being updated, check for conflicts
    if (body.email && body.email !== existingVendor.email) {
      // Check if email already exists in vendors table
      const { data: emailConflict } = await supabase
        .from('vendors')
        .select('id')
        .eq('email', body.email)
        .neq('id', body.vendor_id)
        .single();

      if (emailConflict) {
        return createErrorResponse('Email already exists in vendors', 400);
      }

      // Check if email exists in other role tables
      const { data: staffConflict } = await supabase
        .from('organization_staff')
        .select('id')
        .eq('email', body.email)
        .single();

      const { data: employeeConflict } = await supabase
        .from('employees')
        .select('id')
        .eq('email', body.email)
        .single();

      if (staffConflict || employeeConflict) {
        return createErrorResponse('Email already exists in another role', 400);
      }
    }

    // Update vendor record
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', body.vendor_id)
      .select()
      .single();

    if (updateError || !updatedVendor) {
      return createErrorResponse(`Failed to update vendor: ${updateError?.message}`, 400);
    }

    const response: UpdateVendorResponse = {
      vendor: {
        id: updatedVendor.id,
        org_id: updatedVendor.org_id,
        name: updatedVendor.name,
        email: updatedVendor.email,
        phone_number: updatedVendor.phone_number,
        latitude: updatedVendor.latitude,
        longitude: updatedVendor.longitude,
        updated_at: updatedVendor.updated_at
      }
    };

    return createSuccessResponse(response, 'Vendor updated successfully');

  } catch (error) {
    console.error('Update vendor error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
