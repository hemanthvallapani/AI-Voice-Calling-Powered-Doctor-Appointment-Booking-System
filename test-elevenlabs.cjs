require('dotenv').config({ path: '.env.local' });

async function testElevenLabs() {
  try {
    console.log('🔍 Testing ElevenLabs API key...');
    console.log('API Key:', process.env.ELEVENLABS_API_KEY);
    console.log('Voice ID:', process.env.ELEVENLABS_VOICE_ID);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: "Hello, this is a test.",
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      console.log('✅ Success! Audio generated:', audioBuffer.byteLength, 'bytes');
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testElevenLabs();
