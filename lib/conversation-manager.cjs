const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

class ConversationManager {
  constructor(callSid, fromNumber) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.state = {
      callSid,
      fromNumber,
      currentStep: 'greeting',
      patientInfo: {},
      conversationHistory: [],
      appointmentDetails: {},
    };
  }

  getSystemPrompt() {
    return `You are an AI healthcare assistant for CarePulse clinic. Your role is to help patients book appointments through voice calls.

IMPORTANT GUIDELINES:
1. Be warm, professional, and empathetic
2. Speak naturally and conversationally
3. Collect patient information systematically
4. Confirm all details before booking
5. Handle errors gracefully
6. Keep responses concise for voice interaction

APPOINTMENT BOOKING FLOW:
1. Greet and introduce yourself
2. Collect patient name, phone, and reason for visit
3. Ask for preferred date and time
4. Confirm all details
5. Book the appointment
6. Provide confirmation

AVAILABLE DOCTORS:
- Dr. Sarah Cameron (General Medicine)
- Dr. Maria Cruz (Cardiology)
- Dr. David Green (Pediatrics)
- Dr. Jennifer Lee (Dermatology)
- Dr. Robert Livingston (Orthopedics)
- Dr. Amanda Peter (Neurology)
- Dr. Michael Powell (Psychiatry)
- Dr. Lisa Remirez (Gynecology)
- Dr. Rajesh Sharma (Internal Medicine)

RESPONSE FORMAT:
- Keep responses under 2-3 sentences for voice
- Ask one question at a time
- Be clear and direct
- Use natural conversation flow

Current conversation state: ${this.state.currentStep}
Patient info collected: ${JSON.stringify(this.state.patientInfo)}`;
  }

  async processUserInput(userMessage) {
    try {
      console.log('🤖 Processing user input:', userMessage);
      
      // CRITICAL FIX: For welcome message, use consistent response
      if (userMessage === 'start') {
        const welcomeMessage = "Hello! Thank you for calling CarePulse clinic. I'm your healthcare assistant. How may I assist you in booking an appointment today?";
        console.log('🎤 Consistent welcome message generated');
        return welcomeMessage;
      }
      
      // Add user message to conversation history
      this.state.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.state.conversationHistory.slice(-10) // Keep last 10 messages for context
      ];

      console.log('📤 Sending to OpenAI:', messages.length, 'messages');
      console.log('📝 Last message:', userMessage);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I did not understand that. Could you please repeat?';
      console.log('🤖 AI Response:', aiResponse);

      // Add AI response to conversation history
      this.state.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });

      // Update conversation state
      await this.updateConversationState(userMessage, aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('❌ Error processing user input:', error);
      return 'I apologize, I encountered an error. Please try again.';
    }
  }

  async updateConversationState(userMessage, aiResponse) {
    const message = userMessage.toLowerCase();
    
    // Extract patient information based on conversation flow
    if (this.state.currentStep === 'greeting') {
      if (message.includes('start') || message.includes('hello') || message.includes('hi')) {
        this.state.currentStep = 'collecting_name';
        return;
      }
    }
    
    if (this.state.currentStep === 'collecting_name') {
      // Extract name from user message
      const nameMatch = userMessage.match(/(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/i);
      if (nameMatch) {
        this.state.patientInfo.name = nameMatch[1].trim();
        this.state.currentStep = 'collecting_phone';
        return;
      }
    }
    
    if (this.state.currentStep === 'collecting_phone') {
      // Extract phone number
      const phoneMatch = userMessage.match(/(\d{10,11})/);
      if (phoneMatch) {
        this.state.patientInfo.phone = phoneMatch[1];
        this.state.currentStep = 'collecting_reason';
        return;
      }
    }
    
    if (this.state.currentStep === 'collecting_reason') {
      // Extract reason for visit
      this.state.patientInfo.reason = userMessage;
      this.state.currentStep = 'collecting_date';
      return;
    }
    
    if (this.state.currentStep === 'collecting_date') {
      // Extract preferred date
      const dateMatch = userMessage.match(/(?:on|for|at)\s+([a-zA-Z\s\d]+)/i);
      if (dateMatch) {
        this.state.appointmentDetails.preferredDate = dateMatch[1].trim();
        this.state.currentStep = 'collecting_time';
        return;
      }
    }
    
    if (this.state.currentStep === 'collecting_time') {
      // Extract preferred time
      const timeMatch = userMessage.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
      if (timeMatch) {
        this.state.appointmentDetails.preferredTime = userMessage;
        this.state.currentStep = 'confirming_details';
        return;
      }
    }
    
    if (this.state.currentStep === 'confirming_details') {
      if (message.includes('yes') || message.includes('correct') || message.includes('right')) {
        this.state.currentStep = 'booking_appointment';
        return;
      } else if (message.includes('no') || message.includes('wrong')) {
        this.state.currentStep = 'collecting_name'; // Start over
        this.state.patientInfo = {};
        this.state.appointmentDetails = {};
        return;
      }
    }
    
    if (this.state.currentStep === 'booking_appointment') {
      // This step will be handled by the bookAppointment method
      // Just acknowledge and move to completion
      this.state.currentStep = 'completed';
      return;
    }
  }

  async bookAppointment(appointmentManager) {
    try {
      if (this.state.currentStep !== 'booking_appointment') {
        return null;
      }
      
      // Create patient data
      const patient = {
        name: this.state.patientInfo.name,
        phone: this.state.patientInfo.phone,
        email: `${this.state.patientInfo.phone}@voicecall.com`, // Placeholder email
        dateOfBirth: new Date('1990-01-01'), // Placeholder DOB
        gender: 'Not specified',
        address: 'Voice call registration',
        emergencyContact: 'Not provided',
        medicalHistory: 'Not provided',
        allergies: 'Not specified',
        currentMedications: 'None',
        insuranceProvider: 'Not specified',
        insuranceNumber: 'Not provided',
      };
      
      // Create appointment data
      const appointment = {
        primaryPhysician: 'Dr. Sarah Cameron', // Default doctor
        schedule: new Date(), // Will be updated with actual date/time
        status: 'scheduled',
        reason: this.state.patientInfo.reason,
        notes: `Appointment booked via voice call. Preferred: ${this.state.appointmentDetails.preferredDate} at ${this.state.appointmentDetails.preferredTime}`,
        type: 'consultation',
      };
      
      // Actually create the patient and appointment in the database
      try {
        const createdPatient = await appointmentManager.createPatientFromVoice(patient);
        console.log('✅ Patient created:', createdPatient.$id);
        
        // Update appointment with patient ID
        appointment.patientId = createdPatient.$id;
        
        const createdAppointment = await appointmentManager.createAppointment(appointment);
        console.log('✅ Appointment created:', createdAppointment.$id);
        
        this.state.currentStep = 'completed';
        this.state.patientId = createdPatient.$id;
        this.state.appointmentId = createdAppointment.$id;
        
        return { patient: createdPatient, appointment: createdAppointment };
        
      } catch (dbError) {
        console.error('❌ Database error creating appointment:', dbError);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      return null;
    }
  }

  isComplete() {
    return this.state.currentStep === 'completed';
  }

  getConfirmationMessage() {
    return `Perfect! Your appointment has been booked successfully. You'll receive a confirmation shortly. Thank you for choosing CarePulse. Have a great day!`;
  }

  getFullTranscript() {
    return this.state.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  getCurrentState() {
    return this.state;
  }
}

module.exports = { ConversationManager };
