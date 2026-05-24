export type SessionState = "created" | "paired" | "active" | "expired"

export interface VoiceField {
  id: string
  label: string
}

export interface SessionCommand {
  type: "switch_field"
  fieldId: string
}

export interface TranscriptMessage {
  sessionId: string
  text: string
  isFinal: boolean
  fieldId: string
}

export interface PairingResponse {
  sessionToken: string
  sonioxTempKey: string
  fields: VoiceField[]
  language: string | string[]
  config: {
    maxRecordingDuration: number
    idleTimeout: number
  }
}

export interface SessionCreateResponse {
  sessionId: string
  pairingCode: string
  secret: string
  expiresAt: number
}

export interface VoicefieldConfig {
  serverUrl: string
  externalServerUrl?: string
  phoneUrl?: string
  language: string | string[]
  maxRecordingDuration?: number
  idleTimeout?: number
}

export type SSEEventType =
  | "transcript"
  | "paired"
  | "recording_start"
  | "recording_stop"
  | "session_ended"
  | "field_switched"

export interface SSETranscriptEvent {
  type: "transcript"
  text: string
  isFinal: boolean
  fieldId: string
}

export interface SSEStatusEvent {
  type: "paired" | "recording_start" | "recording_stop" | "session_ended" | "field_switched"
  fieldId?: string
}

export type SSEEvent = SSETranscriptEvent | SSEStatusEvent

export interface STTProvider {
  start(config: STTConfig): Promise<void>
  stop(): Promise<void>
  onPartial(callback: (text: string) => void): void
  onFinal(callback: (text: string) => void): void
  onError(callback: (error: Error) => void): void
}

export interface STTConfig {
  temporaryApiKey: string
  language: string | string[]
  model?: string
}
