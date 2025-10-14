#!/usr/bin/env node

/**
 * Quick Integration Test Runner
 * 
 * This script allows you to run the integration tests from the project root.
 * It's a convenience wrapper around the main test runner.
 * 
 * Usage:
 *   npm run test:integration
 *   npm run test:integration:verbose
 *   npm run test:integration:clean
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

// Build the command to run
const testDir = path.join(__dirname, 'tests');
const command = `node run-integration-test.js ${args.join(' ')}`;

console.log('🚀 Running YummBackend Integration Tests...');
console.log(`📁 Test directory: ${testDir}`);
console.log(`🔧 Command: ${command}`);
console.log('=' .repeat(60));

try {
  // Change to tests directory and run the test
  execSync(command, { 
    cwd: testDir, 
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('❌ Integration test failed');
  process.exit(error.status || 1);
}
