"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/table/DataTable";
import { VoiceStatCard } from "@/components/VoiceStatCard";
import { Phone, Clock, CheckCircle, XCircle, Calendar, User, MessageSquare } from "lucide-react";

interface VoiceCall {
  $id: string;
  callSid: string;
  fromNumber: string;
  status: 'incoming' | 'connected' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  transcript?: string;
  patientId?: string;
  appointmentId?: string;
  $createdAt: string;
}

export default function VoiceCallsTable() {
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    averageDuration: 0,
    appointmentsCreated: 0,
  });

  useEffect(() => {
    fetchVoiceCalls();
  }, []);

  const fetchVoiceCalls = async () => {
    try {
      const response = await fetch('/api/voice/calls');
      if (response.ok) {
        const data = await response.json();
        setVoiceCalls(data.voiceCalls || []);
        
        // Calculate enhanced stats
        const total = data.voiceCalls?.length || 0;
        const completed = data.voiceCalls?.filter((call: VoiceCall) => call.status === 'completed').length || 0;
        const failed = data.voiceCalls?.filter((call: VoiceCall) => call.status === 'failed').length || 0;
        const appointmentsCreated = data.voiceCalls?.filter((call: VoiceCall) => call.appointmentId).length || 0;
        const durations = data.voiceCalls?.map((call: VoiceCall) => call.duration || 0).filter((d: number) => d > 0) || [];
        const averageDuration = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0;
        
        setStats({ total, completed, failed, averageDuration, appointmentsCreated });
      }
    } catch (error) {
      console.error('Failed to fetch voice calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'connected':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Phone className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'connected':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const voiceCallColumns = [
    {
      accessorKey: "callSid",
      header: "Call ID",
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">
          {row.getValue("callSid").substring(0, 8)}...
        </div>
      ),
    },
    {
      accessorKey: "fromNumber",
      header: "Phone Number",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {formatPhoneNumber(row.getValue("fromNumber"))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.getValue("status");
        return (
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        );
      },
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-600">
          {new Date(row.getValue("startTime")).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }: any) => {
        const duration = row.getValue("duration");
        return (
          <div className="text-sm text-gray-600">
            {duration ? formatDuration(duration) : 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: "appointmentId",
      header: "Appointment",
      cell: ({ row }: any) => {
        const appointmentId = row.getValue("appointmentId");
        return (
          <div className="text-sm text-gray-600">
            {appointmentId ? (
              <span className="text-green-600 font-medium">✓ Created</span>
            ) : (
              <span className="text-gray-400">No appointment</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "transcript",
      header: "Transcript",
      cell: ({ row }: any) => {
        const transcript = row.getValue("transcript");
        return (
          <div className="text-sm text-gray-600 max-w-xs truncate">
            {transcript || 'No transcript available'}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Voice Calls</h2>
        <p className="text-muted-foreground">
          Monitor and manage AI voice call interactions
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <VoiceStatCard
          title="Total Calls"
          value={stats.total.toString()}
          icon={Phone}
          description="All voice calls received"
        />
        <VoiceStatCard
          title="Completed"
          value={stats.completed.toString()}
          icon={CheckCircle}
          description="Successfully completed calls"
          className="text-green-600"
        />
        <VoiceStatCard
          title="Failed"
          value={stats.failed.toString()}
          icon={XCircle}
          description="Failed or dropped calls"
          className="text-red-600"
        />
        <VoiceStatCard
          title="Avg Duration"
          value={formatDuration(stats.averageDuration)}
          icon={Clock}
          description="Average call duration"
        />
        <VoiceStatCard
          title="Appointments"
          value={stats.appointmentsCreated.toString()}
          icon={Calendar}
          description="Appointments created"
          className="text-blue-600"
        />
      </div>

      {/* Voice Calls Table */}
      <div className="rounded-md border">
        <DataTable columns={voiceCallColumns} data={voiceCalls} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={fetchVoiceCalls}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
        <button
          onClick={() => window.open('/admin', '_blank')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          View All Appointments
        </button>
      </div>
    </div>
  );
}