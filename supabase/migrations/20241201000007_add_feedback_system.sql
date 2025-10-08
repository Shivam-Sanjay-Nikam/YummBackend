-- Add feedback system for orders
-- Migration: 20241201000007_add_feedback_system.sql

-- Create feedback table
CREATE TABLE order_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    share_user_details BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, employee_id) -- One feedback per order per employee
);

-- Create index for better query performance
CREATE INDEX idx_order_feedback_order_id ON order_feedback(order_id);
CREATE INDEX idx_order_feedback_employee_id ON order_feedback(employee_id);
CREATE INDEX idx_order_feedback_created_at ON order_feedback(created_at);

-- Add RLS policies for feedback
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can create and view their own feedback
CREATE POLICY "Employees can manage their own feedback" ON order_feedback
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE org_id IN (
                SELECT org_id FROM employees 
                WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- Policy: Vendors can view feedback for their orders
CREATE POLICY "Vendors can view feedback for their orders" ON order_feedback
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN vendors v ON o.vendor_id = v.id
            WHERE v.email = auth.jwt() ->> 'email'
        )
    );

-- Policy: Staff can view all feedback in their organization
CREATE POLICY "Staff can view all feedback in their organization" ON order_feedback
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM orders o
            JOIN organization_staff os ON o.org_id = os.org_id
            WHERE os.email = auth.jwt() ->> 'email'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_feedback_updated_at
    BEFORE UPDATE ON order_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_order_feedback_updated_at();
