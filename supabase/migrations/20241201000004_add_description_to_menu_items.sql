-- Add description field to menu_items table
-- Migration: 20241201000004_add_description_to_menu_items.sql

ALTER TABLE menu_items 
ADD COLUMN description TEXT;
