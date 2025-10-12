#!/usr/bin/env node

/**
 * Database Reset Script for Test Suite
 * Ensures clean database state before running tests
 */

const SUPABASE_URL = 'https://zylgjcnwazyaudhdnakc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';

async function resetDatabase() {
  console.log('🧹 Resetting database for clean test state...');
  
  const resetSQL = `
    -- Delete all data in correct order (respecting foreign key constraints)
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM menu_items;
    DELETE FROM employees;
    DELETE FROM vendors;
    DELETE FROM organization_staff;
    DELETE FROM organizations;
    DELETE FROM auth.users;
    
    -- Reset sequences
    DO $$
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'organizations_id_seq') THEN
            ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'organization_staff_id_seq') THEN
            ALTER SEQUENCE organization_staff_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'employees_id_seq') THEN
            ALTER SEQUENCE employees_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'vendors_id_seq') THEN
            ALTER SEQUENCE vendors_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'menu_items_id_seq') THEN
            ALTER SEQUENCE menu_items_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'orders_id_seq') THEN
            ALTER SEQUENCE orders_id_seq RESTART WITH 1;
        END IF;
        
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_items_id_seq') THEN
            ALTER SEQUENCE order_items_id_seq RESTART WITH 1;
        END IF;
    END $$;
    
    SELECT 'Database reset completed successfully!' as result;
  `;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql: resetSQL })
    });
    
    if (response.ok) {
      console.log('✅ Database reset completed successfully!');
      return true;
    } else {
      console.log('⚠️  Database reset may have failed. Please run the reset script manually in Supabase SQL Editor.');
      console.log('📝 Copy and paste the following SQL into your Supabase SQL Editor:');
      console.log('\n' + resetSQL + '\n');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not reset database automatically. Please run the reset script manually.');
    console.log('📝 Copy and paste the following SQL into your Supabase SQL Editor:');
    console.log('\n' + resetSQL + '\n');
    return false;
  }
}

async function main() {
  console.log('🚀 Yuum Backend Test Setup');
  console.log('===========================');
  
  const resetSuccess = await resetDatabase();
  
  if (resetSuccess) {
    console.log('\n✅ Setup completed! Ready to run tests.');
    console.log('🚀 Run: npm test');
  } else {
    console.log('\n⚠️  Manual setup required.');
    console.log('1. Run the SQL script in Supabase SQL Editor');
    console.log('2. Then run: npm test');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { resetDatabase };
