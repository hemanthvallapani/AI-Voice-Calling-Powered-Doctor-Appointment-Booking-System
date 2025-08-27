#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

const { AssemblyAI } = require('assemblyai');
const OpenAI = require('openai');
const { Client, Databases } = require('node-appwrite');

console.log('🧪 Testing AI Voice Calling System APIs...\n');

// Test AssemblyAI API
async function testAssemblyAI() {
  console.log('�� Testing AssemblyAI Universal Streaming API...');
  try {
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });
    
    const transcriber = client.streaming.transcriber({
      sampleRate: 8000,
      encoding: 'pcm_mulaw',
      formatTurns: true
    });
    
    console.log('✅ AssemblyAI API: Universal Streaming transcriber created successfully');
    
    // Test connection
    await transcriber.connect();
    console.log('✅ AssemblyAI API: Connection established successfully');
    
    // Test sending some audio data
    const testAudio = Buffer.alloc(160, 0); // 160 bytes of silence
    transcriber.sendAudio(testAudio);
    console.log('✅ AssemblyAI API: Test audio sent successfully');
    
    transcriber.close();
    console.log('✅ AssemblyAI API: Connection closed successfully');
    return true;
  } catch (error) { 
    console.error('❌ AssemblyAI API Error:', error.message); 
    return false; 
  }
}

// Test OpenAI API
async function testOpenAI() {
  console.log('🤖 Testing OpenAI API...');
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello, test message' }],
      max_tokens: 10,
    });
    
    if (completion.choices[0]?.message?.content) {
      console.log('✅ OpenAI API: Connection successful');
      return true;
    } else {
      throw new Error('No response from OpenAI');
    }
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    return false;
  }
}

// Test ElevenLabs API
async function testElevenLabs() {
  console.log('🎤 Testing ElevenLabs API...');
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${process.env.ELEVENLABS_VOICE_ID}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });
    
    if (response.ok) {
      const voiceData = await response.json();
      console.log(`✅ ElevenLabs API: Voice "${voiceData.name}" found`);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ ElevenLabs API Error:', error.message);
    return false;
  }
}

// Test Appwrite API
async function testAppwrite() {
  console.log('🗄️ Testing Appwrite API...');
  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
      .setProject(process.env.PROJECT_ID)
      .setKey(process.env.API_KEY);
    
    const databases = new Databases(client);
    
    // Test database connection
    const database = await databases.get(process.env.DATABASE_ID);
    console.log(`✅ Appwrite API: Database "${database.name}" connected`);
    
    // Test collections access
    const collections = await databases.listCollections(process.env.DATABASE_ID);
    console.log(`✅ Appwrite API: ${collections.total} collections accessible`);
    
    return true;
  } catch (error) {
    console.error('❌ Appwrite API Error:', error.message);
    return false;
  }
}

// Test Twilio Configuration
function testTwilio() {
  console.log('📞 Testing Twilio Configuration...');
  try {
    const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length === 0) {
      console.log('✅ Twilio Configuration: All required variables set');
      console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
      return true;
    } else {
      throw new Error(`Missing variables: ${missing.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Twilio Configuration Error:', error.message);
    return false;
  }
}

// Test Environment Variables
async function testEnvironment() {
  console.log('🔧 Testing Environment Variables...');
  const requiredVars = [
    'ASSEMBLYAI_API_KEY',
    'OPENAI_API_KEY', 
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'NEXT_PUBLIC_DOMAIN'
  ];
  
  let allGood = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allGood = false;
    }
  }
  
  return allGood;
}

// Test WebSocket Server
async function testWebSocketServer() {
  console.log('🔌 Testing WebSocket Server...');
  try {
    const WebSocket = require('ws');
    const ws = new WebSocket(`ws://localhost:${process.env.WEBSOCKET_PORT || 8080}`);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        console.log('❌ WebSocket Server: Connection timeout - Server may not be running');
        console.log('💡 Start the voice server with: npm run voice-server');
        resolve(false);
      }, 3000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        console.log('✅ WebSocket Server: Connection successful');
        resolve(true);
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        console.log('❌ WebSocket Server: Connection failed');
        console.log('💡 Make sure to start the voice server: npm run voice-server');
        resolve(false);
      });
    });
  } catch (error) {
    console.error('❌ WebSocket Server Error:', error.message);
    console.log('💡 Install ws package: npm install ws');
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const results = {
          assemblyai: await testAssemblyAI(),
    openai: await testOpenAI(),
    elevenlabs: await testElevenLabs(),
    appwrite: await testAppwrite(),
    twilio: testTwilio(),
    environment: await testEnvironment(),
    websocket: await testWebSocketServer(),
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([service, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);
    console.log(`${status} ${serviceName}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! Your AI Voice Calling System is ready.');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
    console.log('💡 Make sure all API keys are valid and services are accessible.');
  }
  
  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
