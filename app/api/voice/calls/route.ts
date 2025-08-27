import { NextRequest, NextResponse } from 'next/server';

import { VoiceAppointmentManager } from '@/lib/voice-appointment';

export async function GET(request: NextRequest) {
  try {
    const appointmentManager = new VoiceAppointmentManager();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const status = searchParams.get('status');
    
    // Fetch voice calls
    const voiceCalls = await appointmentManager.getAllVoiceCalls(limit);
    
    // Filter by status if provided
    const filteredCalls = status 
      ? voiceCalls.filter((call: any) => call.status === status)
      : voiceCalls;
    
    return NextResponse.json({
      success: true,
      voiceCalls: filteredCalls,
      total: filteredCalls.length,
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch voice calls:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch voice calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
