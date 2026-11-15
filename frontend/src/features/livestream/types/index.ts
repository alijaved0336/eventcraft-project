export interface VirtualSession {
  id: string;
  roomName: string;
  joinUrl: string;
  hostUrl?: string;
  isLive: boolean;
  peakAttendees: number;
  expiresAt?: string;
  endedAt?: string;
  recordingUrl?: string;
}

export interface StreamState {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  participantCount: number;
}
