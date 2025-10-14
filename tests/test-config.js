/**
 * Test Configuration for YummBackend Integration Tests
 * 
 * This file contains configuration options for the integration tests.
 * You can modify these values to customize test behavior.
 */

module.exports = {
  // Test execution settings
  timeout: 30000, // 30 seconds timeout for each test step
  retries: 2, // Number of retries for failed tests
  
  // Test data settings
  testData: {
    // Organization settings
    organization: {
      namePrefix: 'Test Org',
      staffName: 'Test Admin',
      emailDomain: 'test.com',
      phonePrefix: '+123456789',
      specialNumberPrefix: 'TEST'
    },
    
    // Employee settings
    employee: {
      name: 'Test Employee',
      emailDomain: 'test.com',
      phonePrefix: '+123456789',
      specialNumberPrefix: 'EMP',
      defaultBalance: 100.00
    },
    
    // Vendor settings
    vendor: {
      name: 'Test Vendor',
      emailDomain: 'test.com',
      phonePrefix: '+123456789',
      defaultLocation: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    
    // Menu item settings
    menuItems: [
      {
        name: 'Test Burger',
        description: 'A delicious test burger with all the fixings',
        price: 12.99,
        status: 'active'
      },
      {
        name: 'Test Pizza',
        description: 'A tasty test pizza with premium toppings',
        price: 15.99,
        status: 'active'
      },
      {
        name: 'Test Salad',
        description: 'A fresh and healthy test salad',
        price: 8.99,
        status: 'active'
      }
    ]
  },
  
  // API settings
  api: {
    // Pagination settings
    defaultPage: 1,
    defaultLimit: 100,
    
    // Request settings
    requestTimeout: 10000, // 10 seconds
    maxRetries: 3
  },
  
  // Cleanup settings
  cleanup: {
    // Clean up test data after tests
    enabled: true,
    
    // Clean up before running tests (if --clean flag is used)
    cleanBeforeTest: false,
    
    // Timeout for cleanup operations
    timeout: 15000 // 15 seconds
  },
  
  // Logging settings
  logging: {
    // Enable verbose logging
    verbose: false,
    
    // Log level: 'error', 'warn', 'info', 'debug'
    level: 'info',
    
    // Include timestamps in logs
    includeTimestamps: true,
    
    // Include colors in logs
    includeColors: true
  },
  
  // Assertion settings
  assertions: {
    // Strict mode: fail on any assertion failure
    strict: true,
    
    // Continue on failure: continue running tests even if some fail
    continueOnFailure: false,
    
    // Detailed error messages
    detailedErrors: true
  }
};
