-- Create Supabase Auth users for all existing users in the system
-- Migration: 20241201000016_create_missing_auth_users.sql

-- This migration will create auth users for any existing users that don't have them
-- Note: This uses a simple approach - all users get the default password 'password123'

-- Create auth users for organization_staff without auth_user_id
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
)
SELECT 
    gen_random_uuid(),
    email,
    encode(sha256('password123'::bytea), 'hex'), -- Default password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('role', 'organization_staff', 'org_id', org_id)::jsonb,
    false,
    'authenticated'
FROM organization_staff 
WHERE auth_user_id IS NULL
AND email IS NOT NULL
AND email NOT IN (SELECT email FROM auth.users WHERE email IS NOT NULL);

-- Update organization_staff with auth_user_id
UPDATE organization_staff 
SET auth_user_id = auth.users.id
FROM auth.users
WHERE organization_staff.email = auth.users.email 
AND organization_staff.auth_user_id IS NULL;

-- Create auth users for employees without auth_user_id
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
)
SELECT 
    gen_random_uuid(),
    email,
    encode(sha256('password123'::bytea), 'hex'), -- Default password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('role', 'employee', 'org_id', org_id)::jsonb,
    false,
    'authenticated'
FROM employees 
WHERE auth_user_id IS NULL
AND email IS NOT NULL
AND email NOT IN (SELECT email FROM auth.users WHERE email IS NOT NULL);

-- Update employees with auth_user_id
UPDATE employees 
SET auth_user_id = auth.users.id
FROM auth.users
WHERE employees.email = auth.users.email 
AND employees.auth_user_id IS NULL;

-- Create auth users for vendors without auth_user_id
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
)
SELECT 
    gen_random_uuid(),
    email,
    encode(sha256('password123'::bytea), 'hex'), -- Default password
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('role', 'vendor', 'org_id', org_id)::jsonb,
    false,
    'authenticated'
FROM vendors 
WHERE auth_user_id IS NULL
AND email IS NOT NULL
AND email NOT IN (SELECT email FROM auth.users WHERE email IS NOT NULL);

-- Update vendors with auth_user_id
UPDATE vendors 
SET auth_user_id = auth.users.id
FROM auth.users
WHERE vendors.email = auth.users.email 
AND vendors.auth_user_id IS NULL;

-- Final verification
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

-- Show created auth users
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'org_id' as org_id,
    created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;
