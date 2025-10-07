import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../../shared/utils.ts';
import { authenticateUserByEmail } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { name, latitude, longitude, special_number, user_email } = await req.json();

    // Validate required fields
    if (!user_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_email' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Authenticate the requesting user
    const authResult = await authenticateUserByEmail(user_email);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if special_number is being updated and if it already exists
    if (special_number) {
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('special_number')
        .eq('special_number', special_number)
        .neq('id', authResult.user!.org_id);

      if (checkError) {
        console.error('Error checking special number:', checkError);
        return new Response(
          JSON.stringify({ error: 'Failed to check special number availability' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingOrg && existingOrg.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Special number already exists. Please choose a different 6-digit number.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate special number format (6 digits)
      if (!/^\d{6}$/.test(special_number)) {
        return new Response(
          JSON.stringify({ error: 'Special number must be exactly 6 digits' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (special_number !== undefined) updateData.special_number = special_number;

    console.log('Update organization - User org_id:', authResult.user!.org_id);
    console.log('Update organization - Update data:', updateData);

    // Update the organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', authResult.user!.org_id)
      .select()
      .single();

    console.log('Update organization - Result:', updatedOrg);
    console.log('Update organization - Error:', updateError);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update organization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: updatedOrg.id,
          name: updatedOrg.name,
          latitude: updatedOrg.latitude,
          longitude: updatedOrg.longitude,
          special_number: updatedOrg.special_number,
          updated_at: updatedOrg.updated_at,
        },
        message: 'Organization updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update_organization function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
