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
  sttProvider: string
  sttKey: string | null
  sttKeyExpiresAt: number | null
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

export interface STTProviderInstance {
  start(): Promise<void>
  stop(): Promise<void>
}

export interface STTProviderConfig {
  sttKey: string | null
  language: string | string[]
  onPartial: (text: string) => void
  onFinal: (text: string) => void
  onError: (error: Error) => void
}

export type STTProviderFactory = (config: STTProviderConfig) => STTProviderInstance
