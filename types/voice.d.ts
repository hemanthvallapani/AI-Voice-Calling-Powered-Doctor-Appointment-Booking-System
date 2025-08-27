declare interface VoiceCallSession {
  callSid: string;
  patientPhone: string;
  conversationStep: 'greeting' | 'name' | 'doctor' | 'concern' | 'date' | 'time' | 'confirmation' | 'booking';
  patientData: {
    name?: string;
    selectedDoctor?: string;
    medicalConcern?: string;
    preferredDate?: string;
    preferredTime?: string;
  };
  transcript: string[];
  startTime: Date;
  lastActivity: Date;
}

declare interface VoiceAppointment {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  medicalConcern: string;
  appointmentDate: Date;
  appointmentTime: string;
  callSid: string;
}

declare interface ConversationResponse {
  message: string;
  nextStep: string;
  shouldBook: boolean;
  extractedData?: any;
}