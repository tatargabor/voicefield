import { randomBytes, randomUUID } from "crypto"
import type { VoiceField, SessionCommand, SSEEvent } from "@voicefield/core"

export type SessionState = "created" | "paired" | "active" | "expired"

export interface Session {
  id: string
  state: SessionState
  pairingCode: string
  secret: string
  sessionToken: string | null
  fields: VoiceField[]
  language: string | string[]
  pendingCommands: SessionCommand[]
  createdAt: number
  pairedAt: number | null
  lastActivityAt: number
  expiresAt: number
  sseClients: Set<ReadableStreamDefaultController>
  eventBuffer: BufferedEvent[]
  lastEventId: number
}

export interface BufferedEvent {
  id: number
  timestamp: number
  data: SSEEvent
}

const SLIDING_TTL_MS = 30 * 60 * 1000
const HARD_MAX_LIFETIME_MS = 24 * 60 * 60 * 1000
const PAIRING_TTL_MS = 5 * 60 * 1000
const EVENT_BUFFER_MAX_AGE_MS = 60 * 1000
const CLEANUP_INTERVAL_MS = 60 * 1000

const sessions = new Map<string, Session>()
const codeIndex = new Map<string, string>()

let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanupRunning() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL_MS)
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref()
  }
}

function generatePairingCode(): string {
  const max = 999999
  let code: string
  let attempts = 0
  do {
    const num = parseInt(randomBytes(3).toString("hex"), 16) % (max + 1)
    code = num.toString().padStart(6, "0")
    attempts++
    if (attempts > 100) throw new Error("Failed to generate unique pairing code")
  } while (codeIndex.has(code))
  return code
}

function generateSecret(): string {
  return randomBytes(32).toString("hex")
}

function generateSessionToken(): string {
  return randomBytes(48).toString("base64url")
}

export function createSession(fields: VoiceField[], language: string | string[]): Session {
  ensureCleanupRunning()
  const now = Date.now()
  const pairingCode = generatePairingCode()
  const session: Session = {
    id: randomUUID(),
    state: "created",
    pairingCode,
    secret: generateSecret(),
    sessionToken: null,
    fields,
    language,
    pendingCommands: [],
    createdAt: now,
    pairedAt: null,
    lastActivityAt: now,
    expiresAt: now + PAIRING_TTL_MS,
    sseClients: new Set(),
    eventBuffer: [],
    lastEventId: 0,
  }
  sessions.set(session.id, session)
  codeIndex.set(pairingCode, session.id)
  return session
}

export function findSessionByCode(code: string): Session | null {
  const sessionId = codeIndex.get(code)
  if (!sessionId) return null
  const session = sessions.get(sessionId)
  if (!session) return null
  if (isExpired(session)) return null
  return session
}

export function findSessionById(id: string): Session | null {
  const session = sessions.get(id)
  if (!session) return null
  if (isExpired(session)) return null
  return session
}

export function findSessionByToken(token: string): Session | null {
  for (const session of sessions.values()) {
    if (session.sessionToken === token && !isExpired(session)) {
      return session
    }
  }
  return null
}

export function pairSession(session: Session): string {
  if (session.state !== "created") {
    throw new Error("Session already paired")
  }
  const now = Date.now()
  const token = generateSessionToken()
  session.state = "paired"
  session.sessionToken = token
  session.pairedAt = now
  session.lastActivityAt = now
  session.expiresAt = now + SLIDING_TTL_MS
  codeIndex.delete(session.pairingCode)
  return token
}

export function touchSession(session: Session): void {
  const now = Date.now()
  session.lastActivityAt = now
  const hardExpiry = session.createdAt + HARD_MAX_LIFETIME_MS
  const slidingExpiry = now + SLIDING_TTL_MS
  session.expiresAt = Math.min(slidingExpiry, hardExpiry)
  if (session.state === "paired") {
    session.state = "active"
  }
}

export function endSession(session: Session): void {
  session.state = "expired"
  session.expiresAt = Date.now()
  codeIndex.delete(session.pairingCode)
  pushSSEEvent(session, { type: "session_ended" })
  for (const controller of session.sseClients) {
    try {
      controller.close()
    } catch {}
  }
  session.sseClients.clear()
}

export function addCommand(session: Session, command: SessionCommand): void {
  session.pendingCommands.push(command)
}

export function drainCommands(session: Session): SessionCommand[] {
  const commands = [...session.pendingCommands]
  session.pendingCommands = []
  return commands
}

export function registerSSEClient(
  session: Session,
  controller: ReadableStreamDefaultController,
): void {
  session.sseClients.add(controller)
}

export function unregisterSSEClient(
  session: Session,
  controller: ReadableStreamDefaultController,
): void {
  session.sseClients.delete(controller)
}

export function pushSSEEvent(session: Session, event: SSEEvent): void {
  session.lastEventId++
  const id = session.lastEventId
  const now = Date.now()
  session.eventBuffer.push({ id, timestamp: now, data: event })
  const cutoff = now - EVENT_BUFFER_MAX_AGE_MS
  session.eventBuffer = session.eventBuffer.filter((e) => e.timestamp > cutoff)
  const encoded = `id: ${id}\ndata: ${JSON.stringify(event)}\n\n`
  for (const controller of session.sseClients) {
    try {
      controller.enqueue(new TextEncoder().encode(encoded))
    } catch {
      session.sseClients.delete(controller)
    }
  }
}

export function getBufferedEventsSince(session: Session, lastEventId: number): BufferedEvent[] {
  return session.eventBuffer.filter((e) => e.id > lastEventId)
}

function isExpired(session: Session): boolean {
  if (session.state === "expired") return true
  if (Date.now() > session.expiresAt) {
    session.state = "expired"
    return true
  }
  if (Date.now() > session.createdAt + HARD_MAX_LIFETIME_MS) {
    session.state = "expired"
    return true
  }
  return false
}

function cleanupExpired(): number {
  let cleaned = 0
  for (const [id, session] of sessions) {
    if (isExpired(session)) {
      codeIndex.delete(session.pairingCode)
      for (const controller of session.sseClients) {
        try {
          controller.close()
        } catch {}
      }
      sessions.delete(id)
      cleaned++
    }
  }
  return cleaned
}
