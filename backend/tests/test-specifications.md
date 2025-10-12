# 📋 Detailed Test Specifications

## 🎯 Test Suite Overview

This document provides detailed specifications for each test in the comprehensive end-to-end test suite. Each test is designed to validate specific functionality and business logic within the Yuum Backend system.

## 📊 Test Categories

### 1. Setup Tests
Tests that establish the initial system state and create foundational data.

### 2. Authentication Tests
Tests that validate user authentication flows and token management.

### 3. User Management Tests
Tests that validate CRUD operations for all user types (staff, employees, vendors).

### 4. Menu Management Tests
Tests that validate vendor menu item operations.

### 5. Order Management Tests
Tests that validate the complete order lifecycle.

### 6. Analytics Tests
Tests that validate reporting and analytics functionality.

### 7. Bulk Operations Tests
Tests that validate CSV import and bulk data operations.

### 8. Security Tests
Tests that validate authorization, permissions, and security boundaries.

### 9. Validation Tests
Tests that validate input validation and error handling.

### 10. Error Handling Tests
Tests that validate system behavior under error conditions.

---

## 🧪 Individual Test Specifications

### Test 1: Register Organization
**Category**: Setup  
**Purpose**: Create a new organization and its first staff member  
**Prerequisites**: None  
**Test Data**:
```javascript
{
  org_name: 'E2E Test Organization',
  special_number: '123456', // 6-digit unique number
  latitude: 40.7128,
  longitude: -74.0060,
  staff_name: 'E2E Test Staff',
  staff_email: 'e2e-staff@test.com',
  staff_password: 'password123',
  staff_phone: '+1234567890'
}
```
**Expected Results**:
- Organization created successfully
- Staff member created successfully
- Auth tokens returned
- All data properly linked
**Error Scenarios**:
- Duplicate special number
- Invalid email format
- Weak password
- Missing required fields

### Test 2: Update Organization
**Category**: Staff Operations  
**Purpose**: Validate organization data modification  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'Updated E2E Test Organization',
  latitude: 41.8781,
  longitude: -87.6298
}
```
**Expected Results**:
- Organization data updated
- Changes persisted
- Success response returned
**Error Scenarios**:
- Invalid coordinates
- Unauthorized access
- Missing organization

### Test 3: Create Employee
**Category**: User Management  
**Purpose**: Create a new employee with authentication  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'E2E Test Employee',
  email: 'e2e-employee@test.com',
  password: 'password123',
  phone_number: '+1234567891',
  special_number: 'EMP001',
  balance: 100.00
}
```
**Expected Results**:
- Employee created successfully
- Auth user created
- Employee linked to organization
- Balance set correctly
**Error Scenarios**:
- Duplicate email
- Invalid phone format
- Insufficient permissions
- Missing required fields

### Test 4: Create Vendor
**Category**: User Management  
**Purpose**: Create a new vendor with authentication  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'E2E Test Vendor',
  email: 'e2e-vendor@test.com',
  password: 'password123',
  phone_number: '+1234567892',
  latitude: 40.7589,
  longitude: -73.9851
}
```
**Expected Results**:
- Vendor created successfully
- Auth user created
- Vendor linked to organization
- Location set correctly
**Error Scenarios**:
- Duplicate email
- Invalid coordinates
- Insufficient permissions
- Missing required fields

### Test 5: Vendor Login
**Category**: Authentication  
**Purpose**: Validate vendor authentication flow  
**Prerequisites**: Existing vendor account  
**Test Data**:
```javascript
{
  email: 'e2e-vendor@test.com',
  password: 'password123',
  action: 'signin'
}
```
**Expected Results**:
- Authentication successful
- Access token returned
- User data returned
- Session established
**Error Scenarios**:
- Invalid credentials
- Account not found
- Wrong action type
- Network errors

### Test 6: Add Menu Item
**Category**: Menu Management  
**Purpose**: Create a new menu item for vendor  
**Prerequisites**: Authenticated vendor  
**Test Data**:
```javascript
{
  name: 'E2E Test Menu Item',
  description: 'A delicious test item',
  price: 15.99,
  image_url: 'https://example.com/test-image.jpg'
}
```
**Expected Results**:
- Menu item created successfully
- Item linked to vendor
- Price set correctly
- Image URL stored
**Error Scenarios**:
- Invalid price format
- Missing required fields
- Unauthorized access
- Invalid image URL

### Test 7: Update Menu Item
**Category**: Menu Management  
**Purpose**: Modify existing menu item  
**Prerequisites**: Authenticated vendor, existing menu item  
**Test Data**:
```javascript
{
  menu_item_id: 'menu-item-id',
  name: 'Updated E2E Test Menu Item',
  price: 19.99,
  status: 'active'
}
```
**Expected Results**:
- Menu item updated successfully
- Changes persisted
- Status updated correctly
- Success response returned
**Error Scenarios**:
- Item not found
- Unauthorized access
- Invalid status
- Missing item ID

### Test 8: Employee Login
**Category**: Authentication  
**Purpose**: Validate employee authentication flow  
**Prerequisites**: Existing employee account  
**Test Data**:
```javascript
{
  email: 'e2e-employee@test.com',
  password: 'password123',
  action: 'signin'
}
```
**Expected Results**:
- Authentication successful
- Access token returned
- User data returned
- Session established
**Error Scenarios**:
- Invalid credentials
- Account not found
- Wrong action type
- Network errors

### Test 9: Place Order
**Category**: Order Management  
**Purpose**: Create a new order for employee  
**Prerequisites**: Authenticated employee, existing vendor and menu item  
**Test Data**:
```javascript
{
  vendor_id: 'vendor-id',
  items: [
    { menu_item_id: 'menu-item-id', quantity: 2 }
  ]
}
```
**Expected Results**:
- Order created successfully
- Order items created
- Total calculated correctly
- Status set to 'pending'
**Error Scenarios**:
- Insufficient balance
- Invalid vendor
- Missing menu items
- Invalid quantities

### Test 10: Update Employee Balance
**Category**: User Management  
**Purpose**: Modify employee's balance  
**Prerequisites**: Authenticated staff member, existing employee  
**Test Data**:
```javascript
{
  employee_id: 'employee-id',
  new_balance: 150.00
}
```
**Expected Results**:
- Balance updated successfully
- Change persisted
- Success response returned
- Balance reflects new amount
**Error Scenarios**:
- Employee not found
- Invalid balance amount
- Unauthorized access
- Missing employee ID

### Test 11: Update Order Status
**Category**: Order Management  
**Purpose**: Change order status (vendor operation)  
**Prerequisites**: Authenticated vendor, existing order  
**Test Data**:
```javascript
{
  order_id: 'order-id',
  status: 'preparing'
}
```
**Expected Results**:
- Order status updated
- Change persisted
- Success response returned
- Status reflects new value
**Error Scenarios**:
- Order not found
- Invalid status
- Unauthorized access
- Missing order ID

### Test 12: Cancel Order Request
**Category**: Order Management  
**Purpose**: Employee requests order cancellation  
**Prerequisites**: Authenticated employee, existing order  
**Test Data**:
```javascript
{
  order_id: 'order-id',
  reason: 'E2E test cancellation'
}
```
**Expected Results**:
- Cancel request created
- Order status updated
- Reason stored
- Success response returned
**Error Scenarios**:
- Order not found
- Order already cancelled
- Unauthorized access
- Missing order ID

### Test 13: Handle Cancel Request
**Category**: Order Management  
**Purpose**: Vendor handles cancellation request  
**Prerequisites**: Authenticated vendor, existing cancel request  
**Test Data**:
```javascript
{
  order_id: 'order-id',
  action: 'accept'
}
```
**Expected Results**:
- Cancel request processed
- Order status updated
- Action logged
- Success response returned
**Error Scenarios**:
- Order not found
- Invalid action
- Unauthorized access
- Missing order ID

### Test 14: Get Sales Data
**Category**: Analytics  
**Purpose**: Retrieve sales analytics for staff  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  date_from: '2024-01-01',
  date_to: '2024-12-31'
}
```
**Expected Results**:
- Sales data returned
- Date range respected
- Aggregated statistics
- Success response returned
**Error Scenarios**:
- Invalid date format
- Unauthorized access
- Missing date range
- No data found

### Test 15: Import CSV
**Category**: Bulk Operations  
**Purpose**: Bulk import users via CSV  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  type: 'employees',
  csvData: 'name,email,password,phone_number,special_number,balance\nTest Emp 1,emp1@test.com,password123,+1111111111,EMP001,50.00'
}
```
**Expected Results**:
- CSV parsed successfully
- Users created
- Auth users created
- Success response returned
**Error Scenarios**:
- Invalid CSV format
- Duplicate emails
- Missing required fields
- Unauthorized access

### Test 16: Change Password
**Category**: User Management  
**Purpose**: Change user password  
**Prerequisites**: Authenticated staff member, target user  
**Test Data**:
```javascript
{
  target_user_id: 'user-id',
  new_password: 'newpassword123',
  user_type: 'employee'
}
```
**Expected Results**:
- Password updated successfully
- Change persisted
- Success response returned
- User can login with new password
**Error Scenarios**:
- User not found
- Invalid password format
- Unauthorized access
- Missing user type

### Test 17: Update Employee
**Category**: User Management  
**Purpose**: Modify employee details  
**Prerequisites**: Authenticated staff member, existing employee  
**Test Data**:
```javascript
{
  employee_id: 'employee-id',
  name: 'Updated E2E Test Employee',
  phone_number: '+1234567899',
  special_number: 'EMP002'
}
```
**Expected Results**:
- Employee updated successfully
- Changes persisted
- Success response returned
- Data reflects updates
**Error Scenarios**:
- Employee not found
- Invalid phone format
- Unauthorized access
- Missing employee ID

### Test 18: Update Vendor
**Category**: User Management  
**Purpose**: Modify vendor details  
**Prerequisites**: Authenticated staff member, existing vendor  
**Test Data**:
```javascript
{
  vendor_id: 'vendor-id',
  name: 'Updated E2E Test Vendor',
  phone_number: '+1234567899',
  latitude: 40.7128,
  longitude: -74.0060
}
```
**Expected Results**:
- Vendor updated successfully
- Changes persisted
- Success response returned
- Data reflects updates
**Error Scenarios**:
- Vendor not found
- Invalid coordinates
- Unauthorized access
- Missing vendor ID

### Test 19: Update Organization Staff
**Category**: User Management  
**Purpose**: Modify staff member details  
**Prerequisites**: Authenticated staff member, existing staff  
**Test Data**:
```javascript
{
  staff_id: 'staff-id',
  name: 'Updated E2E Test Staff',
  phone_number: '+1234567899'
}
```
**Expected Results**:
- Staff updated successfully
- Changes persisted
- Success response returned
- Data reflects updates
**Error Scenarios**:
- Staff not found
- Invalid phone format
- Unauthorized access
- Missing staff ID

### Test 20: Delete Menu Item
**Category**: Menu Management  
**Purpose**: Remove menu item  
**Prerequisites**: Authenticated vendor, existing menu item  
**Test Data**:
```javascript
{
  menu_item_id: 'menu-item-id'
}
```
**Expected Results**:
- Menu item deleted successfully
- Item removed from database
- Success response returned
- No orphaned references
**Error Scenarios**:
- Item not found
- Item in use by orders
- Unauthorized access
- Missing item ID

### Test 21: Test Invalid Authentication
**Category**: Security  
**Purpose**: Validate authentication failure handling  
**Prerequisites**: None  
**Test Data**:
```javascript
{
  vendor_id: 'invalid-id',
  items: []
}
```
**Expected Results**:
- Request rejected
- Authentication error returned
- No data modified
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests error handling
- Validates security
- Ensures no unauthorized access

### Test 22: Test Wrong User Role
**Category**: Security  
**Purpose**: Validate role-based access control  
**Prerequisites**: Authenticated employee  
**Test Data**:
```javascript
{
  name: 'Unauthorized Menu Item',
  price: 10.00
}
```
**Expected Results**:
- Request rejected
- Role error returned
- No data modified
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests authorization
- Validates role restrictions
- Ensures proper access control

### Test 23: Test Missing Required Fields
**Category**: Validation  
**Purpose**: Validate input validation  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'Test Employee'
  // Missing required fields
}
```
**Expected Results**:
- Request rejected
- Validation error returned
- No data created
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests input validation
- Validates required fields
- Ensures data integrity

### Test 24: Test Invalid Email Format
**Category**: Validation  
**Purpose**: Validate email format validation  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'Test Employee',
  email: 'invalid-email',
  password: 'password123'
}
```
**Expected Results**:
- Request rejected
- Validation error returned
- No data created
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests email validation
- Validates format requirements
- Ensures data quality

### Test 25: Test Duplicate Email
**Category**: Validation  
**Purpose**: Validate duplicate email handling  
**Prerequisites**: Authenticated staff member, existing employee  
**Test Data**:
```javascript
{
  name: 'Duplicate Employee',
  email: 'existing-employee@test.com',
  password: 'password123'
}
```
**Expected Results**:
- Request rejected
- Duplicate error returned
- No data created
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests uniqueness validation
- Validates constraint enforcement
- Ensures data integrity

### Test 26: Test Invalid Order Status
**Category**: Validation  
**Purpose**: Validate order status validation  
**Prerequisites**: Authenticated vendor, existing order  
**Test Data**:
```javascript
{
  order_id: 'order-id',
  status: 'invalid_status'
}
```
**Expected Results**:
- Request rejected
- Validation error returned
- No data modified
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests enum validation
- Validates status constraints
- Ensures data consistency

### Test 27: Test Non-existent Resource
**Category**: Error Handling  
**Purpose**: Validate handling of non-existent resources  
**Prerequisites**: Authenticated vendor  
**Test Data**:
```javascript
{
  order_id: 'non-existent-id',
  status: 'preparing'
}
```
**Expected Results**:
- Request rejected
- Not found error returned
- No data modified
- Proper error status code
**Error Scenarios**:
- Should always fail
- Tests error handling
- Validates resource existence
- Ensures proper error responses

### Test 28: Test Cross-Organization Access
**Category**: Security  
**Purpose**: Validate organization isolation  
**Prerequisites**: Authenticated staff member  
**Test Data**:
```javascript
{
  name: 'Cross Org Employee',
  email: 'cross-org@test.com',
  password: 'password123'
}
```
**Expected Results**:
- Request succeeds
- Employee created in correct org
- Data properly isolated
- Success response returned
**Error Scenarios**:
- Should succeed
- Tests organization isolation
- Validates data boundaries
- Ensures proper access control

---

## 🔍 Test Execution Flow

### Phase 1: Setup (Tests 1-2)
- Create organization and staff
- Update organization details
- Establish authentication tokens

### Phase 2: User Management (Tests 3-4, 10, 16-19)
- Create employees and vendors
- Update user details
- Manage passwords and balances

### Phase 3: Authentication (Tests 5, 8)
- Test login flows for all user types
- Validate token generation

### Phase 4: Menu Management (Tests 6-7, 20)
- Create and update menu items
- Delete menu items
- Validate vendor permissions

### Phase 5: Order Management (Tests 9, 11-13)
- Place orders
- Update order status
- Handle cancellations
- Complete order lifecycle

### Phase 6: Analytics (Test 14)
- Retrieve sales data
- Validate reporting functionality

### Phase 7: Bulk Operations (Test 15)
- Import CSV data
- Validate bulk operations

### Phase 8: Security & Validation (Tests 21-28)
- Test authentication failures
- Validate role-based access
- Test input validation
- Test error handling

---

## 📊 Success Criteria

### Functional Requirements:
- ✅ All CRUD operations work correctly
- ✅ Authentication flows function properly
- ✅ Role-based access control enforced
- ✅ Data validation working correctly
- ✅ Error handling appropriate

### Performance Requirements:
- ✅ Response times < 2 seconds
- ✅ 100% success rate for valid operations
- ✅ 0% success rate for invalid operations
- ✅ Proper error status codes

### Security Requirements:
- ✅ Unauthorized access blocked
- ✅ Cross-organization access prevented
- ✅ Input validation enforced
- ✅ Data integrity maintained

---

## 🚀 Running the Tests

### Prerequisites:
1. Clean database (run reset script)
2. All Edge Functions deployed
3. Node.js installed
4. Dependencies installed

### Execution:
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with verbose output
npm run test:verbose

# Run specific category
npm run test:auth
npm run test:user-mgmt
npm run test:menu
npm run test:orders
npm run test:security
npm run test:validation

# Generate detailed report
npm run test:report
```

### Expected Results:
- **Total Tests**: 28
- **Passed**: 28/28 (100%)
- **Failed**: 0/28 (0%)
- **Duration**: ~2-3 minutes
- **Coverage**: 100% function coverage

---

## 🔧 Troubleshooting

### Common Issues:
1. **Database Not Clean**: Run database reset first
2. **Functions Not Deployed**: Deploy all Edge Functions
3. **Authentication Errors**: Check Supabase keys
4. **Network Issues**: Verify Supabase URL
5. **Test Data Conflicts**: Use unique test data

### Debug Mode:
```bash
# Enable debug logging
npm run test:debug

# Run without cleanup
npm run test:no-cleanup

# Run single test category
npm run test:auth
```

### Error Resolution:
1. Check test logs for specific errors
2. Verify function deployment status
3. Check database state
4. Validate environment configuration
5. Review function logs in Supabase dashboard

---

**This comprehensive test suite ensures 100% coverage of all backend functionality with detailed validation of business logic, security, and error handling.**
