import { NextRequest, NextResponse } from 'next/server';

import { VoiceAppointmentManager } from '@/lib/voice-appointment';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    
    console.log(`📊 Call status update - SID: ${callSid}, Status: ${callStatus}, Duration: ${callDuration}`);
    
    const appointmentManager = new VoiceAppointmentManager();
    
    // Update call status based on Twilio status
    let status: 'incoming' | 'connected' | 'completed' | 'failed';
    let endTime: Date | undefined;
    let duration: number | undefined;
    
    switch (callStatus) {
      case 'in-progress':
        status = 'connected';
        break;
      case 'completed':
        status = 'completed';
        endTime = new Date();
        duration = parseInt(callDuration) || 0;
        break;
      case 'failed':
      case 'busy':
      case 'no-answer':
        status = 'failed';
        endTime = new Date();
        break;
      default:
        status = 'incoming';
    }
    
    // Update voice call record
    await appointmentManager.updateVoiceCall(callSid, {
      status,
      endTime,
      duration,
    });
    
    console.log(`✅ Call status updated for ${callSid}: ${status}`);
    
    return new NextResponse('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Call status handler error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
