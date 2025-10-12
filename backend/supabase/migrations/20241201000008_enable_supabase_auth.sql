-- Simplified Supabase Auth Migration
-- Migration: 20241201000008_enable_supabase_auth.sql

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Add auth_user_id columns to link with Supabase Auth
ALTER TABLE organization_staff ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_staff_auth_user_id ON organization_staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_auth_user_id ON vendors(auth_user_id);

-- 3. Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies that work with Supabase Auth
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view employees in their organization" ON employees;
DROP POLICY IF EXISTS "Users can view menu items in their organization" ON menu_items;
DROP POLICY IF EXISTS "Users can view order items in their organization" ON order_items;
DROP POLICY IF EXISTS "Users can view orders in their organization" ON orders;
DROP POLICY IF EXISTS "Users can view staff in their organization" ON organization_staff;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view vendors in their organization" ON vendors;

-- Create new policies that work with Supabase Auth
CREATE POLICY "Users can view employees in their organization"
ON employees FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT organization_staff.org_id
    FROM organization_staff
    WHERE organization_staff.auth_user_id = auth.uid()
    UNION
    SELECT employees_1.org_id
    FROM employees employees_1
    WHERE employees_1.auth_user_id = auth.uid()
    UNION
    SELECT vendors.org_id
    FROM vendors
    WHERE vendors.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view menu items in their organization"
ON menu_items FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT organization_staff.org_id
    FROM organization_staff
    WHERE organization_staff.auth_user_id = auth.uid()
    UNION
    SELECT employees.org_id
    FROM employees
    WHERE employees.auth_user_id = auth.uid()
    UNION
    SELECT vendors.org_id
    FROM vendors
    WHERE vendors.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view order items in their organization"
ON order_items FOR SELECT TO authenticated
USING (
  order_id IN (
    SELECT orders.id
    FROM orders
    WHERE orders.org_id IN (
      SELECT organization_staff.org_id
      FROM organization_staff
      WHERE organization_staff.auth_user_id = auth.uid()
      UNION
      SELECT employees.org_id
      FROM employees
      WHERE employees.auth_user_id = auth.uid()
      UNION
      SELECT vendors.org_id
      FROM vendors
      WHERE vendors.auth_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view orders in their organization"
ON orders FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT organization_staff.org_id
    FROM organization_staff
    WHERE organization_staff.auth_user_id = auth.uid()
    UNION
    SELECT employees.org_id
    FROM employees
    WHERE employees.auth_user_id = auth.uid()
    UNION
    SELECT vendors.org_id
    FROM vendors
    WHERE vendors.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view staff in their organization"
ON organization_staff FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT organization_staff_1.org_id
    FROM organization_staff organization_staff_1
    WHERE organization_staff_1.auth_user_id = auth.uid()
    UNION
    SELECT employees.org_id
    FROM employees
    WHERE employees.auth_user_id = auth.uid()
    UNION
    SELECT vendors.org_id
    FROM vendors
    WHERE vendors.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own organization"
ON organizations FOR SELECT TO authenticated
USING (
  id IN (
    SELECT organization_staff.org_id
    FROM organization_staff
    WHERE organization_staff.auth_user_id = auth.uid()
    UNION
    SELECT employees.org_id
    FROM employees
    WHERE employees.auth_user_id = auth.uid()
    UNION
    SELECT vendors.org_id
    FROM vendors
    WHERE vendors.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view vendors in their organization"
ON vendors FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT organization_staff.org_id
    FROM organization_staff
    WHERE organization_staff.auth_user_id = auth.uid()
    UNION
    SELECT employees.org_id
    FROM employees
    WHERE employees.auth_user_id = auth.uid()
    UNION
    SELECT vendors_1.org_id
    FROM vendors vendors_1
    WHERE vendors_1.auth_user_id = auth.uid()
  )
);

-- 5. Verify the setup
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;