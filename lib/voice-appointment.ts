// TypeScript wrapper for Next.js API routes
import { ID, Query } from 'node-appwrite';

import { databases } from './appwrite.config';

export interface VoiceCallData {
  callSid: string;
  fromNumber: string;
  status: 'incoming' | 'connected' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  transcript?: string;
  patientId?: string;
  appointmentId?: string;
}

export class VoiceAppointmentManager {
  private readonly DATABASE_ID: string;
  private readonly VOICE_CALLS_COLLECTION_ID: string;

  constructor() {
    this.DATABASE_ID = process.env.DATABASE_ID!;
    this.VOICE_CALLS_COLLECTION_ID = process.env.VOICE_CALLS_COLLECTION_ID || 'voice_calls';
  }

  async saveVoiceCall(callData: VoiceCallData) {
    try {
      console.log('💾 Saving voice call data:', callData.callSid);
      
      const document = await databases.createDocument(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        ID.unique(),
        {
          callSid: callData.callSid,
          fromNumber: callData.fromNumber,
          status: callData.status,
          startTime: callData.startTime.toISOString(),
          endTime: callData.endTime?.toISOString(),
          duration: callData.duration,
          transcript: callData.transcript,
          patientId: callData.patientId,
          appointmentId: callData.appointmentId,
          createdAt: new Date().toISOString(),
        }
      );
      
      console.log('✅ Voice call saved:', document.$id);
      return document;
    } catch (error) {
      console.error('❌ Failed to save voice call:', error);
      throw error;
    }
  }

  async updateVoiceCall(callSid: string, updateData: Partial<VoiceCallData>) {
    try {
      console.log('🔄 Updating voice call:', callSid);
      
      const documents = await databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [Query.equal('callSid', callSid)]
      );
      
      if (documents.documents.length === 0) {
        throw new Error(`Voice call with SID ${callSid} not found`);
      }
      
      const documentId = documents.documents[0].$id;
      
      const updatedDocument = await databases.updateDocument(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        documentId,
        {
          ...updateData,
          endTime: updateData.endTime?.toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      
      console.log('✅ Voice call updated:', updatedDocument.$id);
      return updatedDocument;
    } catch (error) {
      console.error('❌ Failed to update voice call:', error);
      throw error;
    }
  }

  async getAllVoiceCalls(limit: number = 25) {
    try {
      const documents = await databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(limit)
        ]
      );
      
      return documents.documents;
    } catch (error) {
      console.error('❌ Failed to get voice calls:', error);
      throw error;
    }
  }

  async getVoiceCall(callSid: string) {
    try {
      const documents = await databases.listDocuments(
        this.DATABASE_ID,
        this.VOICE_CALLS_COLLECTION_ID,
        [Query.equal('callSid', callSid)]
      );
      
      return documents.documents[0] || null;
    } catch (error) {
      console.error('❌ Failed to get voice call:', error);
      throw error;
    }
  }
}
