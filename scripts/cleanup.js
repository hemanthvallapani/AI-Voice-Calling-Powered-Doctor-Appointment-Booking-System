#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up project structure...\n');

// Files to remove (not needed for AI voice calling system)
const filesToRemove = [
  'quick-start.md',
  'deployment-guide.md',
  'setup-voice-system.md',
  'sentry.client.config.ts',
  'sentry.edge.config.ts',
  'sentry.server.config.ts',
  'instrumentation.ts',
  'test-voice-system.cjs',
  'voice-server-package.json',
  'start-voice-server.bat',
  'start-voice-server.ps1',
  'debug-apis.cjs',
];

// Directories to clean up
const dirsToClean = [
  '.vscode',
  '.next',
];

// Files to keep but warn about
const filesToKeep = [
  'lib/appwrite.config.ts', // Keep for Next.js
  'lib/appwrite.config.cjs', // Keep for voice server
  'lib/voice-appointment.ts', // Keep for Next.js API routes
  'lib/voice-appointment.cjs', // Keep for voice server
];

console.log('📁 Files to remove:');
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.log(`⚠️ Could not remove ${file}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Not found: ${file}`);
  }
});

console.log('\n🗂️ Cleaning up directories:');
dirsToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      if (dir === '.next') {
        console.log(`ℹ️ Skipping ${dir} (build directory)`);
      } else {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ Removed: ${dir}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not remove ${dir}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Not found: ${dir}`);
  }
});

console.log('\n📋 Files to keep (dual purpose):');
filesToKeep.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Keeping: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

console.log('\n🔍 Checking for duplicate or unnecessary files...');

// Check for potential duplicates
const libFiles = fs.readdirSync('lib').filter(f => f.endsWith('.ts') || f.endsWith('.cjs'));
const duplicates = [];

libFiles.forEach(file => {
  const baseName = file.replace(/\.(ts|cjs)$/, '');
  const hasTs = libFiles.includes(`${baseName}.ts`);
  const hasCjs = libFiles.includes(`${baseName}.cjs`);
  
  if (hasTs && hasCjs && baseName !== 'appwrite.config') {
    duplicates.push({ baseName, ts: hasTs, cjs: hasCjs });
  }
});

if (duplicates.length > 0) {
  console.log('\n⚠️ Potential duplicate files found:');
  duplicates.forEach(({ baseName, ts, cjs }) => {
    console.log(`   ${baseName}: .ts (${ts ? '✓' : '✗'}) .cjs (${cjs ? '✓' : '✗'})`);
  });
  console.log('\n💡 These files serve different purposes:');
  console.log('   - .ts files: For Next.js (TypeScript)');
  console.log('   - .cjs files: For voice server (CommonJS)');
} else {
  console.log('✅ No duplicate files found');
}

console.log('\n📊 Project structure summary:');
console.log('=============================');

// Count files by type
const allFiles = fs.readdirSync('.');
const fileTypes = {
  'TypeScript': allFiles.filter(f => f.endsWith('.ts')).length,
  'CommonJS': allFiles.filter(f => f.endsWith('.cjs')).length,
  'JavaScript': allFiles.filter(f => f.endsWith('.js') && !f.endsWith('.cjs')).length,
  'Markdown': allFiles.filter(f => f.endsWith('.md')).length,
  'JSON': allFiles.filter(f => f.endsWith('.json')).length,
  'Other': allFiles.filter(f => !f.includes('.')).length,
};

Object.entries(fileTypes).forEach(([type, count]) => {
  if (count > 0) {
    console.log(`${type.padEnd(12)}: ${count}`);
  }
});

console.log('\n🎯 AI Voice Calling System files:');
console.log('==================================');

const voiceSystemFiles = [
  'voice-server.cjs',
  'lib/websocket-server.cjs',
  'lib/conversation-manager.cjs',
  'lib/audio-processor.cjs',
  'lib/voice-appointment.cjs',
  'lib/appwrite.config.cjs',
  'lib/voice-appointment.ts',
  'app/api/voice/incoming/route.ts',
  'app/api/voice/status/route.ts',
  'app/api/voice/calls/route.ts',
  'app/admin/voice-calls/page.tsx',
  'components/admin/VoiceCallsTable.tsx',
  'components/VoiceStatCard.tsx',
  'scripts/test-apis.js',
  'scripts/validate-env.js',
  'VOICE_SETUP_GUIDE.md',
  'env.template',
  'ngrok.yml',
];

voiceSystemFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
  }
});

console.log('\n🧹 Cleanup complete!');
console.log('\n💡 Next steps:');
console.log('1. Run: npm run test-apis');
console.log('2. Start the system: npm run dev:voice');
console.log('3. Test voice calls with your Twilio number');
console.log('4. Check admin dashboard at /admin/voice-calls');

console.log('\n🚀 Your AI Voice Calling System is ready!');
