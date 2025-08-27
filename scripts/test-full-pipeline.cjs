require('dotenv').config({ path: '.env.local' });
const AudioProcessor = require('../lib/audio-processor.cjs');
const { ConversationManager } = require('../lib/conversation-manager.cjs');

async function testFullPipeline() {
  console.log('🧪 Testing Full Voice Pipeline...\n');
  
  try {
    // Test 1: Audio Processor
    console.log('1️⃣ Testing Audio Processor...');
    const audioProcessor = new AudioProcessor();
    await audioProcessor.initializeAssemblyAI();
    console.log('✅ Audio Processor initialized\n');
    
    // Test 2: Conversation Manager
    console.log('2️⃣ Testing Conversation Manager...');
    const conversationManager = new ConversationManager('test-call', '+1234567890');
    const response = await conversationManager.processUserInput('Hello');
    console.log('✅ Conversation Manager Response:', response, '\n');
    
    // Test 3: Speech Generation
    console.log('3️⃣ Testing Speech Generation...');
    const audioData = await audioProcessor.generateTTS(response);
    console.log('✅ Speech Generated:', audioData.length, 'bytes\n');
    
    // Test 4: Audio Processing (simulate user input)
    console.log('4️⃣ Testing Audio Processing...');
    const testAudio = Buffer.alloc(160, 0); // Simulate 160 bytes of audio
    await audioProcessor.processAudio(testAudio);
    console.log('✅ Audio Processing Test Complete\n');
    
    // Cleanup
    await audioProcessor.close();
    console.log('✅ All tests passed! Pipeline is working correctly.');
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    process.exit(1);
  }
}

testFullPipeline();
