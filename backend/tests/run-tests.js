#!/usr/bin/env node

/**
 * Simple Test Runner for Yuum Backend
 * Executes the comprehensive test suite with proper error handling
 */

const { runComprehensiveTests } = require('./e2e-tests.js');

async function main() {
  console.log('🚀 Starting Yuum Backend Test Suite...');
  console.log('=====================================');
  
  try {
    const success = await runComprehensiveTests();
    
    if (success) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉');
      console.log('✅ Your backend is working perfectly!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      console.log('🔍 Check the error details above');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test runner crashed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
