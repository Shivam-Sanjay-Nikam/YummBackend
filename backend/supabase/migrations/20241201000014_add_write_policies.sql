-- Add missing RLS policies for write operations (INSERT, UPDATE, DELETE)
-- Migration: 20241201000014_add_write_policies.sql

-- Organizations table policies
CREATE POLICY "Users can insert organizations"
ON organizations FOR INSERT TO authenticated
WITH CHECK (true); -- Allow all authenticated users to create organizations

CREATE POLICY "Users can update their own organization"
ON organizations FOR UPDATE TO authenticated
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
    WHERE vendors.org_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own organization"
ON organizations FOR DELETE TO authenticated
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

-- Organization staff table policies
CREATE POLICY "Users can insert organization staff"
ON organization_staff FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update organization staff in their organization"
ON organization_staff FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete organization staff in their organization"
ON organization_staff FOR DELETE TO authenticated
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

-- Employees table policies
CREATE POLICY "Users can insert employees"
ON employees FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update employees in their organization"
ON employees FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete employees in their organization"
ON employees FOR DELETE TO authenticated
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

-- Vendors table policies
CREATE POLICY "Users can insert vendors"
ON vendors FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update vendors in their organization"
ON vendors FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete vendors in their organization"
ON vendors FOR DELETE TO authenticated
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

-- Menu items table policies
CREATE POLICY "Users can insert menu items"
ON menu_items FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update menu items in their organization"
ON menu_items FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete menu items in their organization"
ON menu_items FOR DELETE TO authenticated
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

-- Orders table policies
CREATE POLICY "Users can insert orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update orders in their organization"
ON orders FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete orders in their organization"
ON orders FOR DELETE TO authenticated
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

-- Order items table policies
CREATE POLICY "Users can insert order items"
ON order_items FOR INSERT TO authenticated
WITH CHECK (
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

CREATE POLICY "Users can update order items in their organization"
ON order_items FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete order items in their organization"
ON order_items FOR DELETE TO authenticated
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
