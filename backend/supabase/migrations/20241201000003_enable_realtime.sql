-- Enable realtime for all tables
-- Migration: 20241201000003_enable_realtime.sql

-- Enable realtime for organizations table
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;

-- Enable realtime for organization_staff table
ALTER PUBLICATION supabase_realtime ADD TABLE organization_staff;

-- Enable realtime for employees table
ALTER PUBLICATION supabase_realtime ADD TABLE employees;

-- Enable realtime for vendors table
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;

-- Enable realtime for menu_items table
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for order_items table
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
