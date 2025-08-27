#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'ASSEMBLYAI_API_KEY',
  'OPENAI_API_KEY', 
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'DATABASE_ID',
  'PATIENT_COLLECTION_ID',
  'APPOINTMENT_COLLECTION_ID',
  'API_KEY',
  'PROJECT_ID',
  'NEXT_PUBLIC_ENDPOINT'
];

const optionalEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'VOICE_CALLS_COLLECTION_ID',
  'WEBSOCKET_PORT',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_DOMAIN'
];

console.log('🔍 Validating environment variables...\n');

// Check required variables
const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingRequired.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingRequired.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease add these variables to your .env.local file');
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Check optional variables
const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);

if (missingOptional.length > 0) {
  console.warn('\n⚠️  Missing optional environment variables:');
  missingOptional.forEach(varName => console.warn(`   - ${varName}`));
  console.warn('\nThese are optional but recommended for full functionality');
}

// Validate API key formats
console.log('\n🔑 Validating API key formats...');

const apiKeyPatterns = {
  'ASSEMBLYAI_API_KEY': /^[a-zA-Z0-9]{32}$/,
  'OPENAI_API_KEY': /^sk-[a-zA-Z0-9]{48}$/,
  'ELEVENLABS_API_KEY': /^[a-zA-Z0-9]{28}$/,
  'ELEVENLABS_VOICE_ID': /^[a-zA-Z0-9]{11}$/,
};

let validationErrors = 0;

Object.entries(apiKeyPatterns).forEach(([varName, pattern]) => {
  const value = process.env[varName];
  if (value && !pattern.test(value)) {
    console.error(`❌ Invalid format for ${varName}: ${value.substring(0, 10)}...`);
    validationErrors++;
  } else if (value) {
    console.log(`✅ ${varName} format is valid`);
  }
});

if (validationErrors > 0) {
  console.error(`\n❌ Found ${validationErrors} validation errors`);
  process.exit(1);
}

console.log('\n✅ All API keys have valid formats');

// Validate URLs
console.log('\n🌐 Validating URLs...');

const urlVars = ['NEXT_PUBLIC_ENDPOINT', 'NEXT_PUBLIC_BASE_URL'];
urlVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    try {
      new URL(value);
      console.log(`✅ ${varName} is a valid URL`);
    } catch (error) {
      console.error(`❌ Invalid URL for ${varName}: ${value}`);
      validationErrors++;
    }
  }
});

if (validationErrors > 0) {
  console.error(`\n❌ Found ${validationErrors} URL validation errors`);
  process.exit(1);
}

console.log('\n🎉 Environment validation completed successfully!');
console.log('\nNext steps:');
console.log('1. Run "npm run test-apis" to test API connections');
console.log('2. Run "npm run dev:voice" to start the development servers');
console.log('3. Set up Twilio webhooks for production');
