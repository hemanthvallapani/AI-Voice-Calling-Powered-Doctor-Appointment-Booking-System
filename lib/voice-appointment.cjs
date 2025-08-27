const { databases, ID, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

class VoiceAppointmentManager {
  constructor() {
    this.DATABASE_ID = process.env.DATABASE_ID;
    this.PATIENT_COLLECTION_ID = process.env.PATIENT_COLLECTION_ID;
    this.DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID;
    this.APPOINTMENT_COLLECTION_ID = process.env.APPOINTMENT_COLLECTION_ID;
    this.VOICE_CALLS_COLLECTION_ID = process.env.VOICE_CALLS_COLLECTION_ID || 'voice_calls';
    
    // Use the CommonJS Appwrite config
    this.databases = require('./appwrite.config.cjs').databases;
  }

  async saveVoiceCall(callData) {
    try {
      console.log('💾 Saving voice call data:', callData.callSid);
      
      const document = await this.databases.createDocument(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        ID.unique(),
        {
          callSid: callData.callSid,
          fromNumber: callData.fromNumber,
          status: callData.status || 'incoming',
          startTime: callData.startTime,
          endTime: callData.endTime,
          duration: callData.duration,
          transcript: callData.transcript,
          patientId: callData.patientId,
          appointmentId: callData.appointmentId,
        }
      );
      
      console.log('✅ Voice call saved:', document.$id);
      return document;
      
    } catch (error) {
      console.error('❌ Failed to save voice call:', error);
      throw error;
    }
  }

  async updateVoiceCall(callSid, updateData) {
    try {
      console.log('🔄 Updating voice call:', callSid);
      
      // Find the voice call document
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [Query.equal('callSid', callSid)]
      );
      
      if (documents.documents.length === 0) {
        throw new Error(`Voice call with SID ${callSid} not found`);
      }
      
      const document = documents.documents[0];
      
      // Update the document
      const updatedDocument = await this.databases.updateDocument(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        document.$id,
        updateData
      );
      
      console.log('✅ Voice call updated:', updatedDocument.$id);
      return updatedDocument;
      
    } catch (error) {
      console.error('❌ Failed to update voice call:', error);
      throw error;
    }
  }

  async findPatientByPhone(phone) {
    try {
      console.log('🔍 Looking for patient with phone:', phone);
      
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.PATIENT_COLLECTION_ID,
        [Query.equal('phone', phone)]
      );
      
      if (documents.documents.length > 0) {
        console.log('✅ Patient found:', documents.documents[0].$id);
        return documents.documents[0];
      }
      
      console.log('❌ No patient found with phone:', phone);
      return null;
      
    } catch (error) {
      console.error('❌ Error finding patient:', error);
      return null;
    }
  }

  async createPatientFromVoice(patientData) {
    try {
      console.log('👤 Creating new patient from voice call:', patientData.name);
      
      const document = await this.databases.createDocument(
        this.DATABASE_ID,
        this.PATIENT_COLLECTION_ID,
        ID.unique(),
        {
          name: patientData.name,
          phone: patientData.phone,
          email: patientData.email,
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          address: patientData.address,
          emergencyContact: patientData.emergencyContact,
          medicalHistory: patientData.medicalHistory,
          allergies: patientData.allergies,
          currentMedications: patientData.currentMedications,
          insuranceProvider: patientData.insuranceProvider,
          insuranceNumber: patientData.insuranceNumber,
          registrationSource: 'voice_call',
          registrationDate: new Date(),
        }
      );
      
      console.log('✅ Patient created:', document.$id);
      return document;
      
    } catch (error) {
      console.error('❌ Failed to create patient:', error);
      throw error;
    }
  }

  async createAppointmentFromVoice(patient, appointmentData) {
    try {
      console.log('📅 Creating appointment from voice call for patient:', patient.name);
      
      // Parse preferred date and time
      let scheduleDate = new Date();
      if (appointmentData.preferredDate && appointmentData.preferredTime) {
        // Simple date parsing - in production, use a proper date library
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (appointmentData.preferredDate.toLowerCase().includes('tomorrow')) {
          scheduleDate = tomorrow;
        }
        
        // Set time (default to 9 AM if parsing fails)
        scheduleDate.setHours(9, 0, 0, 0);
      }
      
      const document = await this.databases.createDocument(
        this.DATABASE_ID,
        this.APPOINTMENT_COLLECTION_ID,
        ID.unique(),
        {
          userId: patient.$id,
          primaryPhysician: appointmentData.primaryPhysician,
          schedule: scheduleDate,
          status: appointmentData.status || 'scheduled',
          reason: appointmentData.reason,
          notes: appointmentData.notes,
          type: appointmentData.type || 'consultation',
          source: 'voice_call',
          createdAt: new Date(),
        }
      );
      
      console.log('✅ Appointment created:', document.$id);
      return document;
      
    } catch (error) {
      console.error('❌ Failed to create appointment:', error);
      throw error;
    }
  }

  async getAvailableDoctors() {
    try {
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.DOCTOR_COLLECTION_ID
      );
      
      return documents.documents;
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      return [];
    }
  }

  async checkDoctorAvailability(doctorName, date) {
    try {
      // Check existing appointments for the doctor on the given date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const appointments = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.APPOINTMENT_COLLECTION_ID,
        [
          Query.equal('primaryPhysician', doctorName),
          Query.greaterThanEqual('schedule', startOfDay),
          Query.lessThanEqual('schedule', endOfDay),
          Query.equal('status', 'scheduled')
        ]
      );
      
      // Assume doctor can handle 8 appointments per day
      const maxAppointments = 8;
      const availableSlots = maxAppointments - appointments.documents.length;
      
      return {
        available: availableSlots > 0,
        availableSlots,
        existingAppointments: appointments.documents.length
      };
      
    } catch (error) {
      console.error('❌ Error checking doctor availability:', error);
      return { available: false, availableSlots: 0, existingAppointments: 0 };
    }
  }

  async getVoiceCall(callSid) {
    try {
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [Query.equal('callSid', callSid)]
      );
      
      if (documents.documents.length > 0) {
        return documents.documents[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching voice call:', error);
      return null;
    }
  }

  async getAllVoiceCalls(limit = 25) {
    try {
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [Query.limit(limit), Query.orderDesc('$createdAt')]
      );
      
      return documents.documents;
    } catch (error) {
      console.error('❌ Error fetching voice calls:', error);
      return [];
    }
  }
}

module.exports = { VoiceAppointmentManager };
