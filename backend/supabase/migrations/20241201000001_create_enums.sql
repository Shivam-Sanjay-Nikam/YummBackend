-- Create enums for the application
-- Migration: 20241201000001_create_enums.sql

-- Create order_status enum
CREATE TYPE order_status AS ENUM (
    'placed',
    'preparing', 
    'prepared',
    'given',
    'cancelled',
    'cancel_requested'
);

-- Create menu_item_status enum
CREATE TYPE menu_item_status AS ENUM (
    'active',
    'inactive'
);
