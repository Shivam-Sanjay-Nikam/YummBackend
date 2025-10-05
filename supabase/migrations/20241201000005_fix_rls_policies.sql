-- Fix RLS policies to ensure proper access control
-- Migration: 20241201000005_fix_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own organization data" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization staff" ON organization_staff;
DROP POLICY IF EXISTS "Users can view their own employees" ON employees;
DROP POLICY IF EXISTS "Users can view their own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can view their own menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- Create policies for organizations table
CREATE POLICY "Users can view their own organization data" ON organizations
    FOR ALL USING (
        id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for organization_staff table
CREATE POLICY "Users can view their own organization staff" ON organization_staff
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for employees table
CREATE POLICY "Users can view their own employees" ON employees
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for vendors table
CREATE POLICY "Users can view their own vendors" ON vendors
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for menu_items table
CREATE POLICY "Users can view their own menu items" ON menu_items
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for orders table
CREATE POLICY "Users can view their own orders" ON orders
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
            UNION
            SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Create policies for order_items table
CREATE POLICY "Users can view their own order items" ON order_items
    FOR ALL USING (
        order_id IN (
            SELECT id FROM orders WHERE org_id IN (
                SELECT org_id FROM organization_staff WHERE email = auth.jwt() ->> 'email'
                UNION
                SELECT org_id FROM employees WHERE email = auth.jwt() ->> 'email'
                UNION
                SELECT org_id FROM vendors WHERE email = auth.jwt() ->> 'email'
            )
        )
    );
