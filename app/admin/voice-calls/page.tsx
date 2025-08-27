import VoiceCallsTable from "@/components/admin/VoiceCallsTable";
import { Phone, Calendar, Users, Activity } from "lucide-react";

export default function VoiceCallsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <h1 className="header">Voice Calls Dashboard 📞</h1>
        <p className="text-dark-700">
          Monitor and manage AI voice call sessions and appointments
        </p>
      </header>

      <main className="admin-main">
        {/* Quick Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Voice System Status</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <Phone className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WebSocket Server</p>
                <p className="text-2xl font-bold text-blue-600">Running</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Assistant</p>
                <p className="text-2xl font-bold text-purple-600">GPT-4o</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Voice Quality</p>
                <p className="text-2xl font-bold text-orange-600">HD</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Voice Calls Table */}
        <VoiceCallsTable />

        {/* System Information */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Voice Call Flow</h4>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>User calls Twilio number</li>
                <li>WebSocket connection established</li>
                <li>AssemblyAI processes speech-to-text</li>
                <li>OpenAI GPT-4o manages conversation</li>
                <li>ElevenLabs generates speech response</li>
                <li>Appointment created in Appwrite</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Technical Stack</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Next.js 14 App Router</li>
                <li>WebSocket Server (Node.js)</li>
                <li>AssemblyAI STT API</li>
                <li>OpenAI GPT-4o</li>
                <li>ElevenLabs TTS API</li>
                <li>Appwrite Database</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
