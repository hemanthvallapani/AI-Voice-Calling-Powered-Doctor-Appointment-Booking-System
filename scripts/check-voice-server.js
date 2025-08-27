#!/usr/bin/env node

const net = require('net');
const { spawn } = require('child_process');

console.log('🔍 Checking Voice Server Status...\n');

// Check if port 8080 is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, 'localhost');
  });
}

// Check if voice server process is running
function checkVoiceServerProcess() {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'tasklist' : 'ps';
    const args = isWin ? ['/FI', 'IMAGENAME eq node.exe'] : ['aux'];
    
    const child = spawn(cmd, args);
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', () => {
      const isRunning = output.includes('voice-server.cjs') || output.includes('node.exe');
      resolve(isRunning);
    });
    
    child.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  console.log('📊 Voice Server Status Check');
  console.log('============================\n');
  
  // Check port
  const portInUse = await checkPort(8080);
  console.log(`🔌 Port 8080: ${portInUse ? '✅ In Use' : '❌ Not in Use'}`);
  
  // Check process
  const processRunning = await checkVoiceServerProcess();
  console.log(`🔄 Voice Server Process: ${processRunning ? '✅ Running' : '❌ Not Running'}`);
  
  console.log('\n📋 Status Summary:');
  if (portInUse && processRunning) {
    console.log('✅ Voice server is running properly');
  } else if (portInUse && !processRunning) {
    console.log('⚠️ Port 8080 is in use but voice server process not found');
    console.log('💡 Another service might be using port 8080');
  } else if (!portInUse && processRunning) {
    console.log('⚠️ Voice server process found but port 8080 not accessible');
  } else {
    console.log('❌ Voice server is not running');
  }
  
  console.log('\n🚀 To start the voice server:');
  console.log('   npm run voice-server');
  
  console.log('\n🔧 To start both Next.js and voice server:');
  console.log('   npm run dev:voice');
  
  console.log('\n📞 To test voice calls:');
  console.log('   1. Start the voice server');
  console.log('   2. Start Ngrok: ngrok start next voice');
  console.log('   3. Call your Twilio number');
}

main().catch(console.error);
