// Import CSV - bulk import employees or vendors
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';
import { authenticateUser, createAuthUser } from '../../shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImportCsvRequest {
  csvData: string;
  type: 'employees' | 'vendors' | 'organization_staff';
}

interface ImportCsvResponse {
  success: boolean;
  count: number;
  errors: string[];
  imported: any[];
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

    const body: ImportCsvRequest = await req.json();

    if (!body.csvData || !body.type) {
      return createErrorResponse('CSV data and type are required', 400);
    }

    // Parse CSV data
    const lines = body.csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return createErrorResponse('CSV must have at least a header row and one data row', 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = body.type === 'employees' 
      ? ['name', 'email', 'password']
      : body.type === 'vendors'
      ? ['name', 'email', 'password']
      : ['name', 'email', 'password'];

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return createErrorResponse(`Missing required columns: ${missingHeaders.join(', ')}`, 400);
    }

    // Parse data rows
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = { row: index + 2 };
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });

    const imported: any[] = [];
    const errors: string[] = [];

    // Process each row
    for (const row of data) {
      try {
        if (body.type === 'employees') {
          // Validate required fields
          if (!row.name || !row.email || !row.password) {
            errors.push(`Row ${row.row}: Missing required fields (name, email, password)`);
            continue;
          }

          // Check if email already exists
          const { data: existingEmployee } = await supabase
            .from('employees')
            .select('id')
            .eq('email', row.email)
            .eq('org_id', authResult.user!.org_id)
            .single();

          if (existingEmployee) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Create Supabase Auth user first
          const authUserResult = await createAuthUser(row.email, row.password, {
            org_id: authResult.user!.org_id,
            name: row.name,
            phone_number: row.phone_number || null,
            special_number: row.special_number || null,
            balance: row.balance ? parseFloat(row.balance) : 0.00
          }, 'employee');

          if (!authUserResult.success) {
            errors.push(`Row ${row.row}: Failed to create auth user: ${authUserResult.error}`);
            continue;
          }

          // Create employee with auth_user_id
          const { data: newEmployee, error: createError } = await supabase
            .from('employees')
            .insert({
              org_id: authResult.user!.org_id,
              name: row.name,
              email: row.email,
              phone_number: row.phone_number || null,
              special_number: row.special_number || null,
              balance: row.balance ? parseFloat(row.balance) : 0.00,
              auth_user_id: authUserResult.user!.id
            })
            .select()
            .single();

          if (createError) {
            // Clean up auth user if employee creation failed
            await supabase.auth.admin.deleteUser(authUserResult.user!.id);
            errors.push(`Row ${row.row}: ${createError.message}`);
            continue;
          }

          imported.push(newEmployee);

        } else if (body.type === 'vendors') {
          // Validate required fields
          if (!row.name || !row.email || !row.password) {
            errors.push(`Row ${row.row}: Missing required fields (name, email, password)`);
            continue;
          }

          // Check if email already exists
          const { data: existingVendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('email', row.email)
            .eq('org_id', authResult.user!.org_id)
            .single();

          if (existingVendor) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Create Supabase Auth user first
          const authUserResult = await createAuthUser(row.email, row.password, {
            org_id: authResult.user!.org_id,
            name: row.name,
            phone_number: row.phone_number || null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null
          }, 'vendor');

          if (!authUserResult.success) {
            errors.push(`Row ${row.row}: Failed to create auth user: ${authUserResult.error}`);
            continue;
          }

          // Create vendor with auth_user_id
          const { data: newVendor, error: createError } = await supabase
            .from('vendors')
            .insert({
              org_id: authResult.user!.org_id,
              name: row.name,
              email: row.email,
              phone_number: row.phone_number || null,
              latitude: row.latitude ? parseFloat(row.latitude) : null,
              longitude: row.longitude ? parseFloat(row.longitude) : null,
              auth_user_id: authUserResult.user!.id
            })
            .select()
            .single();

          if (createError) {
            // Clean up auth user if vendor creation failed
            await supabase.auth.admin.deleteUser(authUserResult.user!.id);
            errors.push(`Row ${row.row}: ${createError.message}`);
            continue;
          }

          imported.push(newVendor);

        } else if (body.type === 'organization_staff') {
          // Validate required fields
          if (!row.name || !row.email || !row.password) {
            errors.push(`Row ${row.row}: Missing required fields (name, email, password)`);
            continue;
          }

          // Check if email already exists
          const { data: existingStaff } = await supabase
            .from('organization_staff')
            .select('id')
            .eq('email', row.email)
            .eq('org_id', authResult.user!.org_id)
            .single();

          if (existingStaff) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Create Supabase Auth user first
          const authUserResult = await createAuthUser(row.email, row.password, {
            org_id: authResult.user!.org_id,
            name: row.name,
            phone_number: row.phone_number || null
          }, 'organization_staff');

          if (!authUserResult.success) {
            errors.push(`Row ${row.row}: Failed to create auth user: ${authUserResult.error}`);
            continue;
          }

          // Create organization staff with auth_user_id
          const { data: newStaff, error: createError } = await supabase
            .from('organization_staff')
            .insert({
              org_id: authResult.user!.org_id,
              name: row.name,
              email: row.email,
              phone_number: row.phone_number || null,
              auth_user_id: authUserResult.user!.id
            })
            .select()
            .single();

          if (createError) {
            // Clean up auth user if staff creation failed
            await supabase.auth.admin.deleteUser(authUserResult.user!.id);
            errors.push(`Row ${row.row}: ${createError.message}`);
            continue;
          }

          imported.push(newStaff);
        }
      } catch (error) {
        errors.push(`Row ${row.row}: ${error.message}`);
      }
    }

    const response: ImportCsvResponse = {
      success: imported.length > 0,
      count: imported.length,
      errors,
      imported
    };

    return createSuccessResponse(response, `Successfully imported ${imported.length} ${body.type}`);

  } catch (error) {
    console.error('Import CSV error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
