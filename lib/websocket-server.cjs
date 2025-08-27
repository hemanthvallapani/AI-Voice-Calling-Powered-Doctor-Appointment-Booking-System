const http = require('http');
const { WebSocketServer } = require('ws');
const AudioProcessor = require('./audio-processor.cjs');
const { ConversationManager } = require('./conversation-manager.cjs');
const { VoiceAppointmentManager } = require('./voice-appointment.cjs');
require('dotenv').config({ path: '.env.local' });

class VoiceWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.server = null;
    this.wss = null;

    // maps
    this.wsToCall = new Map();       // ws -> callSid
    this.callToWs = new Map();       // callSid -> { ws, streamSid }
    this.audioProcessors = new Map(); // callSid -> AudioProcessor
    this.conversationManagers = new Map(); // callSid -> ConversationManager
    this.appointmentManagers = new Map();  // callSid -> VoiceAppointmentManager

    this.initialize();
    global.voiceServer = this;
  }

  initialize() {
    this.server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('Voice WebSocket Server');
    });

    this.wss = new WebSocketServer({ server: this.server, path: '/stream' });

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    this.wss.on('error', (e) => console.error('❌ WSS error', e));

    this.server.listen(this.port, () => {
      console.log(`✅ WebSocket server listening on port ${this.port}`);
    });
  }

  handleConnection(ws, req) {
    console.log('🔗 New WS connection');
    ws.on('message', async (data) => {
      await this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      console.log('🔌 WS closed - cleaning any associated call');
      const callSid = this.wsToCall.get(ws);
      if (callSid) this.cleanupCall(callSid);
    });

    ws.on('error', (e) => console.error('❌ WS error', e));
  }

  async handleMessage(ws, data) {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      console.log('⚠️ non-json frame or binary ignored');
      return;
    }
    if (!msg.event) return;

    switch (msg.event) {
      case 'connected':
        console.log('🔗 Twilio connected');
        break;

      case 'start':
        await this.handleStart(ws, msg);
        break;

      case 'media':
        await this.handleMedia(ws, msg);
        break;

      case 'stop':
        await this.handleStop(msg);
        break;

      default:
        console.log('⚠️ Unknown event:', msg.event);
    }
  }

  async handleStart(ws, msg) {
    const callSid = msg.start?.callSid;
    const streamSid = msg.start?.streamSid;
    
    if (!callSid || !streamSid) {
      console.warn('⚠️ Start message missing callSid or streamSid');
      return;
    }

    // CRITICAL FIX: Check if call already exists and cleanup if needed
    if (this.audioProcessors.has(callSid)) {
      console.log(`🔄 Call ${callSid} already exists, cleaning up previous session`);
      this.cleanupCall(callSid);
    }

    // CRITICAL FIX: Bind ws <-> callSid FIRST
    this.wsToCall.set(ws, callSid);
    this.callToWs.set(callSid, { ws, streamSid });

    console.log(`📞 Start received: callSid=${callSid} streamSid=${streamSid}`);

    try {
      // CRITICAL FIX: Create AudioProcessor FIRST and wait for it to be ready
      console.log(`🔧 Creating AudioProcessor for call: ${callSid}`);
      const audioProc = new AudioProcessor();
      this.audioProcessors.set(callSid, audioProc);

      // CRITICAL FIX: Initialize AssemblyAI BEFORE anything else
      try {
        console.log(`🚀 Initializing AssemblyAI for call: ${callSid}`);
        await audioProc.initializeAssemblyAI();
        console.log(`✅ AssemblyAI ready for call: ${callSid}`);
      } catch (error) {
        console.error(`❌ Failed to initialize AssemblyAI for call: ${callSid}`, error);
        // Clean up failed processor
        this.audioProcessors.delete(callSid);
        this.wsToCall.delete(ws);
        this.callToWs.delete(callSid);
        return;
      }

      // CRITICAL FIX: Create ConversationManager + AppointmentManager AFTER AssemblyAI is ready
      const conv = new ConversationManager(callSid, msg.start?.from || '+unknown');
      const appt = new VoiceAppointmentManager();
      this.conversationManagers.set(callSid, conv);
      this.appointmentManagers.set(callSid, appt);

      // CRITICAL FIX: Wire up event handlers AFTER everything is created
      audioProc.on('transcript', async (text) => {
        try {
          console.log(`[${callSid}] Transcript:`, text);
          const reply = await conv.processUserInput(text);
          if (reply) {
            console.log(`[${callSid}] Generating TTS for:`, reply);
            await audioProc.generateTTS(reply);
          }
        } catch (e) {
          console.error(`❌ Error processing transcript for ${callSid}:`, e);
        }
      });

      audioProc.on('ttsReady', (ulawBuf) => {
        const entry = this.callToWs.get(callSid);
        if (!entry) {
          console.warn(`⚠️ No WebSocket entry found for call: ${callSid}`);
          return;
        }
        console.log(`[${callSid}] Streaming TTS audio back to Twilio`);
        this.streamULawToTwilio(entry.ws, entry.streamSid, ulawBuf);
      });

      // Save voice call to database
      try {
        await appt.saveVoiceCall({
          callSid,
          fromNumber: msg.start?.from || '+unknown',
          status: 'connected',
          startTime: new Date()
        });
        console.log(`✅ Voice call saved to database: ${callSid}`);
      } catch (error) {
        console.error(`❌ Failed to save voice call: ${callSid}`, error);
      }

      // CRITICAL FIX: Send welcome message ONLY after everything is wired up
      try {
        console.log(`🎉 Sending welcome message for call: ${callSid}`);
        const welcome = await conv.processUserInput('start');
        if (welcome) {
          console.log(`🎉 Welcome message: ${welcome}`);
          await audioProc.generateTTS(welcome);
        }
      } catch (e) {
        console.error(`❌ Failed to send welcome message for ${callSid}:`, e);
      }

      console.log(`✅ Call ${callSid} fully initialized and ready for audio processing`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize call ${callSid}:`, error);
      // Clean up on failure
      this.cleanupCall(callSid);
      this.wsToCall.delete(ws);
      this.callToWs.delete(callSid);
    }
  }

  async handleMedia(ws, msg) {
    // Twilio media: msg.media.payload is base64 of µ-law 8k
    const callSid = this.wsToCall.get(ws);
    if (!callSid) {
      console.warn('⚠️ media with unknown call context - ignoring');
      return;
    }
    const audioProc = this.audioProcessors.get(callSid);
    if (!audioProc) {
      console.warn('⚠️ no audio processor for callSid', callSid);
      return;
    }

    const payloadB64 = msg.media?.payload;
    if (!payloadB64) return;
    audioProc.processAudio(payloadB64);
  }

  async handleStop(msg) {
    const callSid = msg.stop?.callSid;
    console.log(`🛑 Stop for callSid=${callSid}`);
    if (callSid) this.cleanupCall(callSid);
  }

  // Stream µ-law buffer back to Twilio as proper chunks
  streamULawToTwilio(ws, streamSid, ulawBuffer) {
    if (!ws || ws.readyState !== ws.OPEN) return;
    
    // CRITICAL FIX: Optimize chunk sizes for smoother audio (less buffering sounds)
    const MIN_CHUNK_SIZE = 800; // ~100ms @ 8kHz - increased for smoother audio
    const MAX_CHUNK_SIZE = 16000; // ~2000ms @ 8kHz - increased for better continuity
    const total = ulawBuffer.length;
    let offset = 0;

    // CRITICAL FIX: Send frames spaced ~80ms for smoother audio playback
    const interval = setInterval(() => {
      if (ws.readyState !== ws.OPEN) {
        clearInterval(interval);
        return;
      }
      if (offset >= total) {
        clearInterval(interval);
        return;
      }
      
      // CRITICAL FIX: Send larger chunks for smoother audio (less buffering)
      const chunkSize = Math.min(MAX_CHUNK_SIZE, total - offset);
      const chunk = ulawBuffer.slice(offset, offset + chunkSize);
      offset += chunkSize;
      
      const msg = {
        event: 'media',
        streamSid,
        media: { payload: chunk.toString('base64') },
      };
      try {
        ws.send(JSON.stringify(msg));
      } catch (e) {
        console.error('❌ Error sending ulaw chunk to Twilio', e);
        clearInterval(interval);
      }
    }, 80); // 80ms intervals for smoother audio (was 100ms)
  }

  async cleanupCall(callSid) {
    try {
      console.log(`🧹 Cleaning up call ${callSid}`);

      const audioProc = this.audioProcessors.get(callSid);
      if (audioProc) {
        await audioProc.stop();
      }

      // remove conversation, appointment managers
      this.conversationManagers.delete(callSid);
      this.appointmentManagers.delete(callSid);

      // close ws if still there
      const entry = this.callToWs.get(callSid);
      if (entry && entry.ws && entry.ws.readyState === entry.ws.OPEN) {
        try { entry.ws.close(); } catch (e) {}
      }

      // cleanup maps
      for (const [ws, cs] of this.wsToCall.entries()) {
        if (cs === callSid) this.wsToCall.delete(ws);
      }
      this.callToWs.delete(callSid);
      this.audioProcessors.delete(callSid);

      console.log(`✅ Cleaned up ${callSid}`);
    } catch (e) {
      console.error('❌ cleanupCall error:', e);
    }
  }

  // graceful shutdown
  async shutdown() {
    console.log('🛑 Server shutdown starting...');
    for (const [callSid] of this.audioProcessors) {
      await this.cleanupCall(callSid);
    }
    if (this.wss) this.wss.close();
    if (this.server) this.server.close();
    console.log('✅ Server shutdown complete');
  }
}

module.exports = VoiceWebSocketServer;