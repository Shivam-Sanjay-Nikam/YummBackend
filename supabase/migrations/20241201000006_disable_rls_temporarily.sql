-- Temporarily disable RLS to fix 406 errors
-- Migration: 20241201000006_disable_rls_temporarily.sql

-- Disable RLS on all tables temporarily
-- This allows our custom authentication system to work properly
-- Application-level security is handled in our Edge Functions

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
