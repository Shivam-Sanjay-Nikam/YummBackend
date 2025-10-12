-- Remove password columns and migrate to Supabase Auth only
-- Migration: 20241201000010_remove_password_columns.sql

-- Remove password columns from all user tables since we're using Supabase Auth
ALTER TABLE organization_staff DROP COLUMN IF EXISTS password;
ALTER TABLE employees DROP COLUMN IF EXISTS password;
ALTER TABLE vendors DROP COLUMN IF EXISTS password;

-- Make auth_user_id NOT NULL and add constraints
ALTER TABLE organization_staff ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE employees ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN auth_user_id SET NOT NULL;

-- Add unique constraints on auth_user_id
ALTER TABLE organization_staff ADD CONSTRAINT unique_org_staff_auth_user_id UNIQUE (auth_user_id);
ALTER TABLE employees ADD CONSTRAINT unique_employee_auth_user_id UNIQUE (auth_user_id);
ALTER TABLE vendors ADD CONSTRAINT unique_vendor_auth_user_id UNIQUE (auth_user_id);

-- Verify the changes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('organization_staff', 'employees', 'vendors')
AND column_name IN ('password', 'auth_user_id')
ORDER BY table_name, column_name;