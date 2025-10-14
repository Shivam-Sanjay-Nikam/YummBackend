#!/usr/bin/env node

/**
 * Environment Setup Script for YummBackend Integration Tests
 * 
 * This script helps set up the environment variables needed for the integration tests.
 * It can create a .env file template or validate existing environment variables.
 * 
 * Usage:
 *   node setup-env.js --create-template
 *   node setup-env.js --validate
 *   node setup-env.js --help
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const createTemplate = args.includes('--create-template');
const validate = args.includes('--validate');
const showHelp = args.includes('--help');

if (showHelp) {
  console.log(`
🔧 YummBackend Integration Test Environment Setup

Usage:
  node setup-env.js [options]

Options:
  --create-template    Create a .env.template file with required variables
  --validate          Validate that all required environment variables are set
  --help              Show this help message

Examples:
  node setup-env.js --create-template
  node setup-env.js --validate

Required Environment Variables:
  VITE_SUPABASE_URL          Your Supabase project URL
  VITE_SUPABASE_ANON_KEY     Your Supabase anonymous key
  SUPABASE_SERVICE_ROLE_KEY  Your Supabase service role key

You can get these values from your Supabase project dashboard.
`);
  process.exit(0);
}

// Required environment variables
const requiredEnvVars = [
  {
    name: 'VITE_SUPABASE_URL',
    description: 'Supabase project URL (e.g., https://your-project.supabase.co)',
    example: 'https://abcdefghijklmnop.supabase.co'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key (public key)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (private key)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
];

function createEnvTemplate() {
  const projectRoot = path.resolve(__dirname, '..');
  const envTemplatePath = path.join(projectRoot, '.env.template');
  
  let templateContent = `# YummBackend Environment Variables
# Copy this file to .env and fill in your actual values

# Supabase Configuration
# Get these values from your Supabase project dashboard: https://supabase.com/dashboard

`;

  requiredEnvVars.forEach(envVar => {
    templateContent += `# ${envVar.description}\n`;
    templateContent += `${envVar.name}=${envVar.example}\n\n`;
  });

  templateContent += `# Optional: Test Configuration
# NODE_ENV=test
# TEST_TIMEOUT=30000
`;

  try {
    fs.writeFileSync(envTemplatePath, templateContent);
    console.log('✅ Created .env.template file in project root');
    console.log('📝 Please copy .env.template to .env and fill in your actual values');
    console.log(`📁 Template location: ${envTemplatePath}`);
  } catch (error) {
    console.error('❌ Error creating .env.template:', error.message);
    process.exit(1);
  }
}

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  let allValid = true;
  const results = [];
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar.name];
    const isValid = value && value.trim() !== '';
    
    results.push({
      name: envVar.name,
      description: envVar.description,
      isValid,
      value: value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'Not set'
    });
    
    if (!isValid) {
      allValid = false;
    }
  });
  
  // Display results
  results.forEach(result => {
    const status = result.isValid ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Value: ${result.value}`);
    console.log('');
  });
  
  if (allValid) {
    console.log('🎉 All required environment variables are set!');
    console.log('🚀 You can now run the integration tests.');
  } else {
    console.log('❌ Some required environment variables are missing.');
    console.log('💡 Run "node setup-env.js --create-template" to create a template file.');
    process.exit(1);
  }
}

// Main execution
if (createTemplate) {
  createEnvTemplate();
} else if (validate) {
  validateEnvironment();
} else {
  console.log('❌ No action specified. Use --help for usage information.');
  process.exit(1);
}
