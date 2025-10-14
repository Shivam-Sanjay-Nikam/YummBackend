#!/usr/bin/env node

/**
 * Integration Test Runner for YummBackend
 * 
 * This script runs the comprehensive integration test with proper setup and teardown.
 * It handles environment configuration and provides detailed reporting.
 * 
 * Usage:
 *   node run-integration-test.js
 *   node run-integration-test.js --clean
 *   node run-integration-test.js --verbose
 *   node run-integration-test.js --help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isClean = args.includes('--clean');
const isVerbose = args.includes('--verbose');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
🚀 YummBackend Integration Test Runner

Usage:
  node run-integration-test.js [options]

Options:
  --clean     Clean up test data before running tests
  --verbose   Show verbose output during test execution
  --help      Show this help message

Examples:
  node run-integration-test.js
  node run-integration-test.js --clean --verbose

Environment Variables:
  VITE_SUPABASE_URL          Supabase project URL
  VITE_SUPABASE_ANON_KEY     Supabase anonymous key
  SUPABASE_SERVICE_ROLE_KEY  Supabase service role key

The test will automatically create and clean up test data.
`);
  process.exit(0);
}

// Check if we're in the right directory
if (!fs.existsSync(path.join(__dirname, 'integration-test.js'))) {
  console.error('❌ Error: integration-test.js not found. Please run this script from the tests directory.');
  process.exit(1);
}

// Check for required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\nPlease set these environment variables before running the test.');
  console.error('You can create a .env file in the project root with:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_anon_key');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_key');
  process.exit(1);
}

// Check if dependencies are installed
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Installing test dependencies...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
}

// Run the integration test
console.log('🚀 Starting YummBackend Integration Test...');
console.log('=' .repeat(60));

const startTime = Date.now();

try {
  // Import and run the test
  const { runIntegrationTest } = require('./integration-test.js');
  
  // Set up process handlers
  process.on('SIGINT', () => {
    console.log('\n⚠️  Test interrupted by user. Cleaning up...');
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  
  // Run the test
  await runIntegrationTest();
  
} catch (error) {
  console.error('❌ Fatal error running integration test:', error.message);
  if (isVerbose) {
    console.error(error.stack);
  }
  process.exit(1);
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('=' .repeat(60));
console.log(`⏱️  Test completed in ${duration} seconds`);
console.log('🎉 Integration test finished successfully!');
