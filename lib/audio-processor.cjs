const { AssemblyAI } = require('assemblyai');
const EventEmitter = require('events');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

class AudioProcessor extends EventEmitter {
  constructor() {
    super();
    this.transcriber = null;
    this.aaiReady = false;
    this.isProcessing = false;
    this.transcriberConnectionPromise = null;
    this.ttsQueue = [];
    this.isGeneratingTTS = false;
    this.audioBuffer = Buffer.alloc(0); // Initialize audioBuffer
  }

  async initializeAssemblyAI() {
    try {
      console.log('🔍 Creating AssemblyAI RealtimeTranscriber...');
      console.log('🔑 Using API key:', process.env.ASSEMBLYAI_API_KEY ? '✅ Present' : '❌ Missing');
      
      // CRITICAL FIX: Use the CORRECT AssemblyAI Universal Streaming configuration from official docs
      this.transcriber = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
      }).streaming.transcriber({
        // Twilio media stream sends audio at 8000 sample rate
        sampleRate: 8000,
        // CRITICAL FIX: Use correct encoding - 'pcm_mulaw' is the valid format
        encoding: 'pcm_mulaw',
        // CRITICAL FIX: Add formatTurns for proper transcription (from official docs)
        formatTurns: true
      });

      // CRITICAL FIX: Use the CORRECT events for AssemblyAI Universal Streaming from official docs
      this.transcriber.on('open', ({ id }) => {
        console.log(`🔊 AssemblyAI Universal Streaming session opened with ID: ${id}`);
        this.aaiReady = true;
        this.isProcessing = true;
      });

      this.transcriber.on('error', (error) => {
        console.error('❌ AssemblyAI error:', error);
        this.aaiReady = false;
        this.isProcessing = false;
        
        // CRITICAL FIX: Attempt to reconnect on error
        setTimeout(() => {
          if (!this.aaiReady) {
            console.log('🔄 Attempting to reconnect to AssemblyAI...');
            this.initializeAssemblyAI().catch(e => console.error('❌ Reconnection failed:', e));
          }
        }, 5000);
      });

      this.transcriber.on('close', (code, reason) => {
        console.log(`🔒 AssemblyAI session closed: ${code}, ${reason}`);
        this.aaiReady = false;
        this.isProcessing = false;
      });

      // CRITICAL FIX: Use the CORRECT 'turn' event from official docs
      this.transcriber.on('turn', (turn) => {
        if (!turn.transcript) {
          return;
        }
        console.log(`📝 Turn transcript: ${turn.transcript}`);
        this.emit('transcript', turn.transcript);
      });

      // ADDITIONAL DEBUG: Listen for all possible events to see what's happening
      this.transcriber.on('message', (message) => {
        console.log('📨 AssemblyAI message received:', JSON.stringify(message, null, 2));
      });

      this.transcriber.on('data', (data) => {
        console.log('📊 AssemblyAI data received:', JSON.stringify(data, null, 2));
      });

      this.transcriber.on('transcript', (transcript) => {
        console.log('📝 AssemblyAI transcript event:', JSON.stringify(transcript, null, 2));
        if (transcript.text) {
          console.log(`📝 Transcript text: ${transcript.text}`);
          this.emit('transcript', transcript.text);
        }
      });

      this.transcriber.on('final', (final) => {
        console.log('✅ AssemblyAI final event:', JSON.stringify(final, null, 2));
        if (final.text) {
          console.log(`✅ Final transcript: ${final.text}`);
          this.emit('transcript', final.text);
        }
      });

      // CRITICAL FIX: Connect to AssemblyAI Universal Streaming with timeout
      console.log('🔌 Connecting to AssemblyAI Universal Streaming service...');
      
      const connectionPromise = this.transcriber.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AssemblyAI connection timeout')), 10000)
      );
      
      this.transcriberConnectionPromise = Promise.race([connectionPromise, timeoutPromise]);
      await this.transcriberConnectionPromise;
      
      console.log('✅ AssemblyAI Universal Streaming service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ AssemblyAI initialization failed:', error);
      this.aaiReady = false;
      this.isProcessing = false;
      throw error;
    }
  }

  processAudio(audioData, track) {
    if (!this.isProcessing || !this.transcriber || !this.aaiReady) {
      console.log('⚠️ AssemblyAI not ready, skipping audio');
      return;
    }

    try {
      // Convert audio data to Buffer if needed
      let audioBuffer = audioData;
      if (typeof audioData === 'string') {
        audioBuffer = Buffer.from(audioData, 'base64');
      } else if (!Buffer.isBuffer(audioData)) {
        audioBuffer = Buffer.from(audioData);
      }

      if (audioBuffer.length === 0) {
        console.log('⚠️ Empty audio buffer, skipping');
        return;
      }

      // CRITICAL FIX: Remove incorrect silent detection - µ-law audio can contain 0xFF values
      // The previous silent detection was incorrectly filtering out valid audio
      
      // CRITICAL FIX: Buffer audio to meet AssemblyAI's 50-1000ms requirement
      if (!this.audioBuffer) {
        this.audioBuffer = Buffer.alloc(0);
      }
      
      this.audioBuffer = Buffer.concat([this.audioBuffer, audioBuffer]);
      
      // CRITICAL FIX: Increase buffer size for smoother audio (less buffering sounds)
      // 800 bytes = ~100ms @ 8kHz - better for AssemblyAI processing
      const MIN_BUFFER_SIZE = 800; // Increased from 400 to 800 for smoother audio
      
      if (this.audioBuffer.length >= MIN_BUFFER_SIZE) {
        console.log(`🎵 Sending buffered audio to AssemblyAI: ${this.audioBuffer.length} bytes`);
        
        try {
          // Make sure the transcriber is connected before sending audio
          if (this.transcriber && this.aaiReady) {
            // CRITICAL FIX: Use the correct sendAudio method that actually exists
            this.transcriber.sendAudio(this.audioBuffer);
            console.log('✅ Audio sent to AssemblyAI successfully');
            // CRITICAL FIX: Keep a small buffer for continuity (reduces buffering sounds)
            // Only clear most of the buffer, keep last 200 bytes for smooth transition
            const KEEP_BUFFER_SIZE = 200;
            if (this.audioBuffer.length > KEEP_BUFFER_SIZE) {
              this.audioBuffer = this.audioBuffer.slice(-KEEP_BUFFER_SIZE);
            }
          } else {
            console.log('⚠️ Transcriber not ready yet, skipping audio');
          }
        } catch (error) {
          console.error('❌ Error sending audio to AssemblyAI:', error);
        }
      } else {
        console.log(`🎵 Buffering audio: ${this.audioBuffer.length}/${MIN_BUFFER_SIZE} bytes`);
      }
    } catch (error) {
      console.error('❌ Error processing audio:', error);
    }
  }

  async generateTTS(text) {
    if (!text || !text.trim()) {
      console.log('⚠️ Empty text for TTS, skipping');
      return null;
    }

    // Add to queue
    this.ttsQueue.push(text);
    
    if (!this.isGeneratingTTS) {
      this.processTTSQueue();
    }
  }

  async processTTSQueue() {
    if (this.ttsQueue.length === 0) {
      this.isGeneratingTTS = false;
      return;
    }

    this.isGeneratingTTS = true;
    const text = this.ttsQueue.shift();

    try {
      console.log(`🎤 Generating TTS for: "${text}"`);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/wav',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS failed: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log(`✅ TTS generated successfully: ${audioBuffer.byteLength} bytes`);
      
      // CRITICAL FIX: Convert WAV to µ-law for Twilio compatibility
      try {
        console.log('🔄 Converting WAV to µ-law format...');
        
        const ulawBuffer = await this.convertToULaw(Buffer.from(audioBuffer));
        console.log(`✅ Converted to µ-law: ${ulawBuffer.length} bytes`);
        
        // Emit TTS ready event with converted audio
        this.emit('ttsReady', ulawBuffer);
        
      } catch (conversionError) {
        console.error('❌ Audio conversion failed:', conversionError);
        // Fallback: emit original audio (might not work with Twilio)
        console.log('⚠️ Using original WAV format as fallback');
        this.emit('ttsReady', Buffer.from(audioBuffer));
      }
      
      // Process next item in queue after delay
      setTimeout(() => {
        this.processTTSQueue();
      }, 2000); // 2 seconds between requests
      
    } catch (error) {
      console.error('❌ TTS generation error:', error);
      
      // Retry after delay
      setTimeout(() => {
        this.processTTSQueue();
      }, 3000); // 3 seconds retry delay
    }
  }

  // CRITICAL FIX: Convert WAV to µ-law 8kHz format for Twilio
  async convertToULaw(audioBuffer) {
    try {
      console.log('🔄 Converting WAV to µ-law format...');
      
      // Skip WAV header (first 44 bytes) and get PCM data
      const pcmData = audioBuffer.slice(44);
      
      // Check if we have enough data
      if (pcmData.length < 2) {
        throw new Error('Invalid WAV data - too short');
      }
      
      // Convert 16-bit PCM to µ-law
      const ulawBuffer = Buffer.alloc(pcmData.length / 2);
      
      for (let i = 0; i < pcmData.length - 1; i += 2) {
        // Combine two bytes into 16-bit PCM sample (little-endian)
        const sample = pcmData.readInt16LE(i);
        
        // Convert to µ-law using proper algorithm
        const ulawSample = this.pcmToULaw(sample);
        ulawBuffer[i / 2] = ulawSample;
      }
      
      console.log(`✅ Converted WAV to µ-law: ${pcmData.length} -> ${ulawBuffer.length} bytes`);
      return ulawBuffer;
    } catch (error) {
      console.error('❌ Audio conversion error:', error);
      throw error;
    }
  }

  // Convert 16-bit PCM sample to µ-law using proper algorithm
  pcmToULaw(sample) {
    // Clamp sample to 16-bit range
    sample = Math.max(-32768, Math.min(32767, sample));
    
    // Convert to µ-law using standard algorithm
    const sign = sample < 0 ? 0x80 : 0;
    const absSample = Math.abs(sample);
    
    // µ-law encoding table
    if (absSample < 32) {
      return sign | (absSample << 1);
    } else if (absSample < 96) {
      return sign | 0x40 | ((absSample - 32) >> 1);
    } else if (absSample < 224) {
      return sign | 0x60 | ((absSample - 96) >> 2);
    } else if (absSample < 480) {
      return sign | 0x70 | ((absSample - 224) >> 3);
    } else if (absSample < 992) {
      return sign | 0x78 | ((absSample - 480) >> 4);
    } else if (absSample < 2016) {
      return sign | 0x7C | ((absSample - 992) >> 5);
    } else if (absSample < 4064) {
      return sign | 0x7E | ((absSample - 2016) >> 6);
    } else {
      return sign | 0x7F;
    }
  }

  async stop() {
    try {
      console.log('🛑 Stopping AudioProcessor...');
      
          // Stop AssemblyAI Universal Streaming service
    if (this.transcriber) {
      try {
        await this.transcriber.close();
        console.log('🔒 AssemblyAI Universal Streaming service closed');
      } catch (error) {
        console.error('❌ Error closing AssemblyAI Universal Streaming service:', error);
      }
    }
      
      // Reset state
      this.aaiReady = false;
      this.isProcessing = false;
      
      console.log('✅ AudioProcessor stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping AudioProcessor:', error);
    }
  }
}

module.exports = AudioProcessor;
