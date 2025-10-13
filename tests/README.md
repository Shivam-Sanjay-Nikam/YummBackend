# YummBackend Integration Tests

This directory contains comprehensive integration tests for the YummBackend application. These tests verify the complete end-to-end flow of the application, ensuring that the frontend and backend work together seamlessly.

## 🎯 Test Coverage

The integration test covers the complete application workflow:

1. **Organization Registration** - New organization signs up with staff member
2. **Staff Authentication** - Staff member logs in successfully
3. **Employee Management** - Staff creates a new employee account
4. **Vendor Management** - Staff creates a new vendor account
5. **Vendor Authentication** - Vendor logs in successfully
6. **Menu Management** - Vendor creates menu items
7. **Employee Authentication** - Employee logs in successfully
8. **Vendor Discovery** - Employee can view available vendors
9. **Menu Browsing** - Employee can view vendor menu items
10. **Order Placement** - Employee places an order
11. **Order Management** - Order appears in employee's order list
12. **Order Status Updates** - Vendor updates order status
13. **Order Cancellation** - Employee requests order cancellation
14. **Cancellation Handling** - Vendor handles cancellation request

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Supabase Project** with all migrations applied
3. **Environment Variables** configured

### Environment Setup

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running the Tests

#### Option 1: Using the Test Runner (Recommended)

```bash
# Navigate to the tests directory
cd tests

# Run the integration test
node run-integration-test.js

# Run with verbose output
node run-integration-test.js --verbose

# Run with cleanup before test
node run-integration-test.js --clean

# Show help
node run-integration-test.js --help
```

#### Option 2: Direct Execution

```bash
# Navigate to the tests directory
cd tests

# Install dependencies (first time only)
npm install

# Run the test
node integration-test.js
```

#### Option 3: Using npm scripts

```bash
# From the tests directory
npm test

# With cleanup
npm run test:clean

# With verbose output
npm run test:verbose
```

## 📊 Test Results

The test provides detailed output showing:

- ✅ **Passed Tests** - Successfully completed test steps
- ❌ **Failed Tests** - Failed test steps with error details
- 📈 **Success Rate** - Percentage of tests that passed
- ⏱️ **Execution Time** - Total time taken to run all tests

### Sample Output

```
🚀 Starting comprehensive integration test...
============================================================
✅ [2024-01-15T10:30:00.000Z] PASS: Organization signup should not have network errors
✅ [2024-01-15T10:30:01.000Z] PASS: Organization signup should return 200 status
✅ [2024-01-15T10:30:02.000Z] PASS: Staff login should not have network errors
...
============================================================
📊 TEST RESULTS:
✅ Passed: 45
❌ Failed: 0
📈 Success Rate: 100.00%
⏱️  Test completed in 12.34 seconds
🎉 ALL TESTS PASSED! Integration is working perfectly!
```

## 🧪 Test Data Management

### Automatic Cleanup

The test automatically:
- Creates unique test data with timestamps
- Cleans up all test data after completion
- Removes orphaned authentication users
- Handles cleanup even if tests fail

### Test Data Structure

```javascript
{
  organization: {
    org_name: "Test Org 1705312200000",
    staff_name: "Test Admin",
    staff_email: "admin1705312200000@test.com",
    // ... other fields
  },
  employee: {
    name: "Test Employee",
    email: "employee1705312200000@test.com",
    // ... other fields
  },
  vendor: {
    name: "Test Vendor",
    email: "vendor1705312200000@test.com",
    // ... other fields
  },
  menuItems: [
    {
      name: "Test Burger",
      description: "A delicious test burger",
      price: 12.99,
      status: "active"
    }
    // ... more items
  ]
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Set

**Error:** `Missing required environment variables`

**Solution:** Create a `.env` file in the project root with your Supabase credentials.

#### 2. Dependencies Not Installed

**Error:** `Cannot find module '@supabase/supabase-js'`

**Solution:** Run `npm install` in the tests directory.

#### 3. Supabase Connection Issues

**Error:** `Network errors` or `Authentication failed`

**Solution:** 
- Verify your Supabase URL and keys are correct
- Ensure your Supabase project is running
- Check that all migrations have been applied

#### 4. Test Data Cleanup Issues

**Error:** `Cleanup error` or tests failing due to existing data

**Solution:** 
- Run the test with `--clean` flag
- Manually clean up test data in Supabase dashboard
- Check RLS policies allow service role operations

### Debug Mode

For detailed debugging, run with verbose output:

```bash
node run-integration-test.js --verbose
```

This will show:
- Detailed error messages
- Stack traces for failures
- Network request/response details
- Step-by-step execution flow

## 📝 Test Architecture

### File Structure

```
tests/
├── integration-test.js      # Main test implementation
├── run-integration-test.js  # Test runner with setup/teardown
├── package.json            # Test dependencies
└── README.md              # This documentation
```

### Test Functions

- `testOrganizationSignup()` - Tests organization registration
- `testStaffLogin()` - Tests staff authentication
- `testCreateEmployee()` - Tests employee creation
- `testCreateVendor()` - Tests vendor creation
- `testVendorLogin()` - Tests vendor authentication
- `testCreateMenuItems()` - Tests menu item creation
- `testEmployeeLogin()` - Tests employee authentication
- `testGetVendors()` - Tests vendor listing
- `testGetMenuItems()` - Tests menu item listing
- `testPlaceOrder()` - Tests order placement
- `testGetOrders()` - Tests order listing
- `testUpdateOrderStatus()` - Tests order status updates
- `testCancelOrderRequest()` - Tests order cancellation
- `testHandleCancelRequest()` - Tests cancellation handling

### Utility Functions

- `callEdgeFunction()` - Makes HTTP requests to Supabase Edge Functions
- `assert()` - Custom assertion function with logging
- `log()` - Colored logging with timestamps
- `cleanupTestData()` - Removes all test data

## 🎯 Integration Verification

This test verifies that:

1. **Frontend-Backend Communication** - All API calls work correctly
2. **Authentication Flow** - User registration, login, and session management
3. **Role-Based Access** - Different user roles can access appropriate functions
4. **Data Flow** - Data is correctly created, retrieved, and updated
5. **Business Logic** - Order workflow functions as expected
6. **Error Handling** - Proper error responses and handling
7. **Real-time Updates** - Data consistency across different user sessions

## 🔄 Continuous Integration

To integrate these tests into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run integration tests
        run: cd tests && node run-integration-test.js
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 📞 Support

If you encounter issues with the integration tests:

1. Check the troubleshooting section above
2. Run with `--verbose` flag for detailed output
3. Verify your Supabase project configuration
4. Ensure all database migrations are applied
5. Check that RLS policies allow the necessary operations

The integration test is designed to be comprehensive and should catch any issues with the frontend-backend integration before deployment.
