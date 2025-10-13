/**
 * Comprehensive Integration Test for YummBackend
 * 
 * This test covers the complete application flow:
 * 1. Organization signs up
 * 2. Staff logs in
 * 3. Staff adds employee and vendor
 * 4. Vendor creates menu items
 * 5. Employee places order
 * 
 * Run with: node tests/integration-test.js
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Initialize Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data
const testData = {
  organization: {
    org_name: `Test Org ${Date.now()}`,
    staff_name: 'Test Admin',
    staff_email: `admin${Date.now()}@test.com`,
    staff_password: 'TestPassword123!',
    staff_phone: '+1234567890',
    latitude: 40.7128,
    longitude: -74.0060,
    special_number: `TEST${Date.now()}`
  },
  employee: {
    name: 'Test Employee',
    email: `employee${Date.now()}@test.com`,
    password: 'EmployeePass123!',
    phone_number: '+1234567891',
    special_number: `EMP${Date.now()}`,
    balance: 100.00
  },
  vendor: {
    name: 'Test Vendor',
    email: `vendor${Date.now()}@test.com`,
    password: 'VendorPass123!',
    phone_number: '+1234567892',
    latitude: 40.7589,
    longitude: -73.9851
  },
  menuItems: [
    {
      name: 'Test Burger',
      description: 'A delicious test burger',
      price: 12.99,
      status: 'active'
    },
    {
      name: 'Test Pizza',
      description: 'A tasty test pizza',
      price: 15.99,
      status: 'active'
    }
  ]
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`FAIL: ${message}`, 'error');
  }
}

async function callEdgeFunction(functionName, body, headers = {}) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...headers
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return { data, status: response.status, error: null };
  } catch (error) {
    return { data: null, status: 0, error: error.message };
  }
}

async function cleanupTestData() {
  log('🧹 Cleaning up test data...');
  
  try {
    // Get all test organizations
    const { data: orgs } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .like('name', 'Test Org%');

    if (orgs && orgs.length > 0) {
      // Delete test organizations (cascade will delete related data)
      for (const org of orgs) {
        await supabaseAdmin
          .from('organizations')
          .delete()
          .eq('id', org.id);
      }
      log(`Cleaned up ${orgs.length} test organizations`);
    }

    // Clean up any orphaned auth users
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (authUsers && authUsers.users) {
      for (const user of authUsers.users) {
        if (user.email && (user.email.includes('test.com') || user.email.includes('@test'))) {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        }
      }
    }
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'error');
  }
}

// Test functions
async function testOrganizationSignup() {
  log('🏢 Testing organization signup...');
  
  const { data, status, error } = await callEdgeFunction('register_organization', testData.organization);
  
  assert(!error, 'Organization signup should not have network errors');
  assert(status === 200, 'Organization signup should return 200 status');
  assert(data && data.success, 'Organization signup should return success');
  assert(data.organization && data.organization.id, 'Organization signup should return organization data');
  assert(data.staff && data.staff.id, 'Organization signup should return staff data');
  assert(data.auth && data.auth.access_token, 'Organization signup should return auth tokens');
  
  // Store test data for later use
  testData.organization.id = data.organization.id;
  testData.staff = data.staff;
  testData.auth = data.auth;
  
  return data;
}

async function testStaffLogin() {
  log('👤 Testing staff login...');
  
  const { data, status, error } = await callEdgeFunction('auth_login', {
    email: testData.organization.staff_email,
    password: testData.organization.staff_password,
    action: 'signin'
  });
  
  assert(!error, 'Staff login should not have network errors');
  assert(status === 200, 'Staff login should return 200 status');
  assert(data && data.success, 'Staff login should return success');
  assert(data.user && data.user.id, 'Staff login should return user data');
  assert(data.user.role === 'organization_staff', 'Staff login should return correct role');
  assert(data.session && data.session.access_token, 'Staff login should return session tokens');
  
  // Store staff session for later use
  testData.staffSession = data.session;
  testData.staffUser = data.user;
  
  return data;
}

async function testCreateEmployee() {
  log('👨‍💼 Testing employee creation...');
  
  const { data, status, error } = await callEdgeFunction('create_employee', testData.employee, {
    'Authorization': `Bearer ${testData.staffSession.access_token}`
  });
  
  assert(!error, 'Employee creation should not have network errors');
  assert(status === 200, 'Employee creation should return 200 status');
  assert(data && data.success, 'Employee creation should return success');
  assert(data.employee && data.employee.id, 'Employee creation should return employee data');
  assert(data.auth && data.auth.user_id, 'Employee creation should return auth data');
  
  // Store employee data
  testData.employee.id = data.employee.id;
  testData.employeeAuth = data.auth;
  
  return data;
}

async function testCreateVendor() {
  log('🏪 Testing vendor creation...');
  
  const { data, status, error } = await callEdgeFunction('create_vendor', testData.vendor, {
    'Authorization': `Bearer ${testData.staffSession.access_token}`
  });
  
  assert(!error, 'Vendor creation should not have network errors');
  assert(status === 200, 'Vendor creation should return 200 status');
  assert(data && data.success, 'Vendor creation should return success');
  assert(data.vendor && data.vendor.id, 'Vendor creation should return vendor data');
  assert(data.auth && data.auth.user_id, 'Vendor creation should return auth data');
  
  // Store vendor data
  testData.vendor.id = data.vendor.id;
  testData.vendorAuth = data.auth;
  
  return data;
}

async function testVendorLogin() {
  log('🏪 Testing vendor login...');
  
  const { data, status, error } = await callEdgeFunction('auth_login', {
    email: testData.vendor.email,
    password: testData.vendor.password,
    action: 'signin'
  });
  
  assert(!error, 'Vendor login should not have network errors');
  assert(status === 200, 'Vendor login should return 200 status');
  assert(data && data.success, 'Vendor login should return success');
  assert(data.user && data.user.role === 'vendor', 'Vendor login should return correct role');
  assert(data.session && data.session.access_token, 'Vendor login should return session tokens');
  
  // Store vendor session
  testData.vendorSession = data.session;
  testData.vendorUser = data.user;
  
  return data;
}

async function testCreateMenuItems() {
  log('🍔 Testing menu item creation...');
  
  testData.createdMenuItems = [];
  
  for (const menuItem of testData.menuItems) {
    const { data, status, error } = await callEdgeFunction('vendor_add_menu_item', menuItem, {
      'Authorization': `Bearer ${testData.vendorSession.access_token}`
    });
    
    assert(!error, `Menu item creation (${menuItem.name}) should not have network errors`);
    assert(status === 200, `Menu item creation (${menuItem.name}) should return 200 status`);
    assert(data && data.success, `Menu item creation (${menuItem.name}) should return success`);
    assert(data.menu_item && data.menu_item.id, `Menu item creation (${menuItem.name}) should return menu item data`);
    
    testData.createdMenuItems.push(data.menu_item);
  }
  
  return testData.createdMenuItems;
}

async function testEmployeeLogin() {
  log('👨‍💼 Testing employee login...');
  
  const { data, status, error } = await callEdgeFunction('auth_login', {
    email: testData.employee.email,
    password: testData.employee.password,
    action: 'signin'
  });
  
  assert(!error, 'Employee login should not have network errors');
  assert(status === 200, 'Employee login should return 200 status');
  assert(data && data.success, 'Employee login should return success');
  assert(data.user && data.user.role === 'employee', 'Employee login should return correct role');
  assert(data.session && data.session.access_token, 'Employee login should return session tokens');
  
  // Store employee session
  testData.employeeSession = data.session;
  testData.employeeUser = data.user;
  
  return data;
}

async function testGetVendors() {
  log('🏪 Testing vendor listing...');
  
  const { data, status, error } = await callEdgeFunction('get_vendors', {
    page: 1,
    limit: 100
  }, {
    'Authorization': `Bearer ${testData.employeeSession.access_token}`
  });
  
  assert(!error, 'Get vendors should not have network errors');
  assert(status === 200, 'Get vendors should return 200 status');
  assert(data && data.vendors, 'Get vendors should return vendors array');
  assert(Array.isArray(data.vendors), 'Get vendors should return array');
  assert(data.vendors.length > 0, 'Get vendors should return at least one vendor');
  
  // Find our test vendor
  const testVendor = data.vendors.find(v => v.id === testData.vendor.id);
  assert(testVendor, 'Test vendor should be in the vendors list');
  
  return data;
}

async function testGetMenuItems() {
  log('🍔 Testing menu items listing...');
  
  const { data, status, error } = await callEdgeFunction('get_menu_items', {
    vendor_id: testData.vendor.id,
    page: 1,
    limit: 100
  }, {
    'Authorization': `Bearer ${testData.employeeSession.access_token}`
  });
  
  assert(!error, 'Get menu items should not have network errors');
  assert(status === 200, 'Get menu items should return 200 status');
  assert(data && data.menu_items, 'Get menu items should return menu_items array');
  assert(Array.isArray(data.menu_items), 'Get menu items should return array');
  assert(data.menu_items.length >= 2, 'Get menu items should return at least 2 items');
  
  // Verify our test menu items are there
  const testMenuItems = data.menu_items.filter(item => 
    testData.createdMenuItems.some(created => created.id === item.id)
  );
  assert(testMenuItems.length === 2, 'Both test menu items should be in the list');
  
  return data;
}

async function testPlaceOrder() {
  log('🛒 Testing order placement...');
  
  const orderItems = testData.createdMenuItems.map(item => ({
    menu_item_id: item.id,
    quantity: 1
  }));
  
  const { data, status, error } = await callEdgeFunction('place_order', {
    vendor_id: testData.vendor.id,
    items: orderItems
  }, {
    'Authorization': `Bearer ${testData.employeeSession.access_token}`
  });
  
  assert(!error, 'Place order should not have network errors');
  assert(status === 200, 'Place order should return 200 status');
  assert(data && data.success, 'Place order should return success');
  assert(data.order && data.order.id, 'Place order should return order data');
  assert(data.order_items && Array.isArray(data.order_items), 'Place order should return order items array');
  assert(data.order_items.length === 2, 'Place order should return 2 order items');
  
  // Store order data
  testData.order = data.order;
  testData.orderItems = data.order_items;
  
  return data;
}

async function testGetOrders() {
  log('📋 Testing order listing...');
  
  const { data, status, error } = await callEdgeFunction('get_orders', {
    page: 1,
    limit: 100
  }, {
    'Authorization': `Bearer ${testData.employeeSession.access_token}`
  });
  
  assert(!error, 'Get orders should not have network errors');
  assert(status === 200, 'Get orders should return 200 status');
  assert(data && data.orders, 'Get orders should return orders array');
  assert(Array.isArray(data.orders), 'Get orders should return array');
  assert(data.orders.length > 0, 'Get orders should return at least one order');
  
  // Find our test order
  const testOrder = data.orders.find(o => o.id === testData.order.id);
  assert(testOrder, 'Test order should be in the orders list');
  assert(testOrder.status === 'placed', 'Test order should have placed status');
  
  return data;
}

async function testUpdateOrderStatus() {
  log('🔄 Testing order status update...');
  
  const { data, status, error } = await callEdgeFunction('update_order_status', {
    order_id: testData.order.id,
    status: 'preparing'
  }, {
    'Authorization': `Bearer ${testData.vendorSession.access_token}`
  });
  
  assert(!error, 'Update order status should not have network errors');
  assert(status === 200, 'Update order status should return 200 status');
  assert(data && data.success, 'Update order status should return success');
  assert(data.order && data.order.id, 'Update order status should return order data');
  assert(data.order.status === 'preparing', 'Order status should be updated to preparing');
  
  return data;
}

async function testCancelOrderRequest() {
  log('❌ Testing order cancellation request...');
  
  const { data, status, error } = await callEdgeFunction('cancel_order_request', {
    order_id: testData.order.id,
    reason: 'Test cancellation'
  }, {
    'Authorization': `Bearer ${testData.employeeSession.access_token}`
  });
  
  assert(!error, 'Cancel order request should not have network errors');
  assert(status === 200, 'Cancel order request should return 200 status');
  assert(data && data.success, 'Cancel order request should return success');
  assert(data.order && data.order.id, 'Cancel order request should return order data');
  assert(data.order.status === 'cancel_requested', 'Order status should be updated to cancel_requested');
  
  return data;
}

async function testHandleCancelRequest() {
  log('✅ Testing cancel request handling...');
  
  const { data, status, error } = await callEdgeFunction('handle_cancel_request', {
    order_id: testData.order.id,
    action: 'accept',
    reason: 'Test acceptance'
  }, {
    'Authorization': `Bearer ${testData.vendorSession.access_token}`
  });
  
  assert(!error, 'Handle cancel request should not have network errors');
  assert(status === 200, 'Handle cancel request should return 200 status');
  assert(data && data.success, 'Handle cancel request should return success');
  assert(data.order && data.order.id, 'Handle cancel request should return order data');
  assert(data.order.status === 'cancelled', 'Order status should be updated to cancelled');
  
  return data;
}

// Main test runner
async function runIntegrationTest() {
  log('🚀 Starting comprehensive integration test...');
  log('=' .repeat(60));
  
  try {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Run the complete flow
    await testOrganizationSignup();
    await testStaffLogin();
    await testCreateEmployee();
    await testCreateVendor();
    await testVendorLogin();
    await testCreateMenuItems();
    await testEmployeeLogin();
    await testGetVendors();
    await testGetMenuItems();
    await testPlaceOrder();
    await testGetOrders();
    await testUpdateOrderStatus();
    await testCancelOrderRequest();
    await testHandleCancelRequest();
    
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    // Clean up test data
    await cleanupTestData();
  }
  
  // Print results
  log('=' .repeat(60));
  log('📊 TEST RESULTS:');
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.errors.length > 0) {
    log('❌ ERRORS:');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  if (testResults.failed === 0) {
    log('🎉 ALL TESTS PASSED! Integration is working perfectly!', 'success');
    process.exit(0);
  } else {
    log('💥 SOME TESTS FAILED! Please check the errors above.', 'error');
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runIntegrationTest,
  testData,
  cleanupTestData
};
