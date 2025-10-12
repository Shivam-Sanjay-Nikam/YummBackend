-- Clean up database for Supabase Auth only system
-- Migration: 20241201000015_cleanup_old_auth.sql

-- 1. Ensure password columns are completely removed
ALTER TABLE organization_staff DROP COLUMN IF EXISTS password;
ALTER TABLE employees DROP COLUMN IF EXISTS password;
ALTER TABLE vendors DROP COLUMN IF EXISTS password;

-- 2. Ensure auth_user_id columns exist and are properly configured
ALTER TABLE organization_staff ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Make auth_user_id NOT NULL (this will fail if there are users without auth_user_id)
-- We'll handle this gracefully by checking first
DO $$
BEGIN
    -- Check if there are any users without auth_user_id
    IF EXISTS (
        SELECT 1 FROM organization_staff WHERE auth_user_id IS NULL
        UNION ALL
        SELECT 1 FROM employees WHERE auth_user_id IS NULL
        UNION ALL
        SELECT 1 FROM vendors WHERE auth_user_id IS NULL
    ) THEN
        RAISE NOTICE 'Warning: Some users still lack auth_user_id. These need to be created via Supabase Auth first.';
    ELSE
        -- All users have auth_user_id, safe to make NOT NULL
        ALTER TABLE organization_staff ALTER COLUMN auth_user_id SET NOT NULL;
        ALTER TABLE employees ALTER COLUMN auth_user_id SET NOT NULL;
        ALTER TABLE vendors ALTER COLUMN auth_user_id SET NOT NULL;
        RAISE NOTICE 'Successfully made auth_user_id NOT NULL for all tables.';
    END IF;
END $$;

-- 4. Add unique constraints on auth_user_id (if not already exist)
ALTER TABLE organization_staff DROP CONSTRAINT IF EXISTS unique_org_staff_auth_user_id;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS unique_employee_auth_user_id;
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS unique_vendor_auth_user_id;

ALTER TABLE organization_staff ADD CONSTRAINT unique_org_staff_auth_user_id UNIQUE (auth_user_id);
ALTER TABLE employees ADD CONSTRAINT unique_employee_auth_user_id UNIQUE (auth_user_id);
ALTER TABLE vendors ADD CONSTRAINT unique_vendor_auth_user_id UNIQUE (auth_user_id);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_staff_auth_user_id ON organization_staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_auth_user_id ON vendors(auth_user_id);

-- 6. Clean up any old authentication-related functions or procedures
-- (These would be custom functions if they existed)

-- 7. Verify the final schema
SELECT 
    'organization_staff' as table_name,
    COUNT(*) as total_records,
    COUNT(auth_user_id) as records_with_auth_user_id,
    COUNT(*) - COUNT(auth_user_id) as records_without_auth_user_id
FROM organization_staff
UNION ALL
SELECT 
    'employees' as table_name,
    COUNT(*) as total_records,
    COUNT(auth_user_id) as records_with_auth_user_id,
    COUNT(*) - COUNT(auth_user_id) as records_without_auth_user_id
FROM employees
UNION ALL
SELECT 
    'vendors' as table_name,
    COUNT(*) as total_records,
    COUNT(auth_user_id) as records_with_auth_user_id,
    COUNT(*) - COUNT(auth_user_id) as records_without_auth_user_id
FROM vendors;

-- 8. Show final column structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('organization_staff', 'employees', 'vendors')
AND column_name IN ('email', 'auth_user_id')
ORDER BY table_name, column_name;
