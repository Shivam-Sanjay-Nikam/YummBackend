// Import CSV - bulk import employees or vendors
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSuccessResponse, createErrorResponse, handleCors } from '../../shared/utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImportCsvRequest {
  csvData: string;
  type: 'employees' | 'vendors' | 'organization_staff' | 'menu_items';
  user_email?: string;
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
    const body: ImportCsvRequest = await req.json();
    
    if (!body.user_email) {
      return createErrorResponse('User email required for authentication', 401);
    }

    if (!body.csvData || !body.type) {
      return createErrorResponse('CSV data and type are required', 400);
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
      : body.type === 'menu_items'
      ? ['name', 'price']
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
            .eq('org_id', userRecord.org_id)
            .single();

          if (existingEmployee) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Create employee
          const { data: newEmployee, error: createError } = await supabase
            .from('employees')
            .insert({
              org_id: userRecord.org_id,
              name: row.name,
              email: row.email,
              password: row.password,
              phone_number: row.phone_number || null,
              special_number: row.special_number || null,
              balance: row.balance ? parseFloat(row.balance) : 0.00
            })
            .select()
            .single();

          if (createError) {
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
            .eq('org_id', userRecord.org_id)
            .single();

          if (existingVendor) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Create vendor
          const { data: newVendor, error: createError } = await supabase
            .from('vendors')
            .insert({
              org_id: userRecord.org_id,
              name: row.name,
              email: row.email,
              password: row.password,
              phone_number: row.phone_number || null,
              latitude: row.latitude ? parseFloat(row.latitude) : null,
              longitude: row.longitude ? parseFloat(row.longitude) : null
            })
            .select()
            .single();

          if (createError) {
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
            .eq('org_id', userRecord.org_id)
            .single();

          if (existingStaff) {
            errors.push(`Row ${row.row}: Email ${row.email} already exists`);
            continue;
          }

          // Hash the password
          const hashedPassword = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(row.password)
          );
          const passwordHash = Array.from(new Uint8Array(hashedPassword))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          // Create organization staff
          const { data: newStaff, error: createError } = await supabase
            .from('organization_staff')
            .insert({
              org_id: userRecord.org_id,
              name: row.name,
              email: row.email,
              password: passwordHash,
              phone_number: row.phone_number || null
            })
            .select()
            .single();

          if (createError) {
            errors.push(`Row ${row.row}: ${createError.message}`);
            continue;
          }

          imported.push(newStaff);

        } else if (body.type === 'menu_items') {
          // Validate required fields
          if (!row.name || !row.price) {
            errors.push(`Row ${row.row}: Missing required fields (name, price)`);
            continue;
          }

          // Validate price is numeric
          const price = parseFloat(row.price);
          if (isNaN(price) || price < 0) {
            errors.push(`Row ${row.row}: Price must be a valid positive number`);
            continue;
          }

          // Get vendor info from user
          const { data: vendorRecord, error: vendorError } = await supabase
            .from('vendors')
            .select('id, org_id')
            .eq('email', body.user_email)
            .single();

          if (vendorError || !vendorRecord) {
            errors.push(`Row ${row.row}: Vendor not found`);
            continue;
          }

          // Create menu item
          const { data: newMenuItem, error: createError } = await supabase
            .from('menu_items')
            .insert({
              org_id: vendorRecord.org_id,
              vendor_id: vendorRecord.id,
              name: row.name,
              description: row.description || null,
              price: price,
              status: row.status === 'active' ? 'active' : 'inactive' // Default to inactive
            })
            .select()
            .single();

          if (createError) {
            errors.push(`Row ${row.row}: ${createError.message}`);
            continue;
          }

          imported.push(newMenuItem);
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
