// app/api/incoming/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;

    console.log('📞 Incoming call:', { callSid, from, to, direction });

    // Ensure this is your public ngrok URL and include /stream path
    const wsUrl = `wss://58d5b4b45069.ngrok-free.app/stream`;

    // Minimal TwiML - do NOT mix Say inside Connect unless you know it won't open second stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="fromNumber" value="${from}" />
      <Parameter name="toNumber" value="${to}" />
      <Parameter name="direction" value="${direction}" />
    </Stream>
  </Connect>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('❌ Incoming route error:', err);
    const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(errorTwiML, {
      status: 500,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
