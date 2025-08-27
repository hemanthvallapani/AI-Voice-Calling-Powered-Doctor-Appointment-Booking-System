#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const VoiceWebSocketServer = require('./lib/websocket-server.cjs');

// Validate environment variables
const requiredEnvVars = [
  'ASSEMBLYAI_API_KEY',
  'OPENAI_API_KEY', 
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'NEXT_PUBLIC_ENDPOINT',
  'PROJECT_ID',
  'API_KEY',
  'DATABASE_ID',
  'PATIENT_COLLECTION_ID',
  'APPOINTMENT_COLLECTION_ID',
  'VOICE_CALLS_COLLECTION_ID'
];

console.log('🔍 Checking environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
  console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? '***SET***' : process.env[envVar]}`);
}

console.log('🚀 Starting Voice WebSocket Server...');

// Initialize WebSocket server on port 8080
const wsServer = new VoiceWebSocketServer(8080);

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await wsServer.shutdown();
    process.exit(0);
          } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await wsServer.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log the error
});

console.log('✅ Voice WebSocket Server started successfully');
console.log('🔗 Listening on port: 8080');
console.log('🎯 Ready to receive Twilio WebSocket connections');


