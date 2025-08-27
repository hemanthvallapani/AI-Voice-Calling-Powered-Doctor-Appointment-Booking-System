import { NextRequest } from 'next/server';

export function GET(request: NextRequest) {
  // This route handles WebSocket upgrade requests from Twilio
  // The actual WebSocket server runs on port 8080
  return new Response('WebSocket endpoint - use separate server', { status: 200 });
}

// Note: WebSocket server is initialized separately via voice-server.cjs
// This file is just a placeholder for the API route
// Twilio will connect to the voice server directly on port 8080
