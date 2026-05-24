import { networkInterfaces } from "os"
import { NextRequest, NextResponse } from "next/server"
import { isValidPairingCode } from "@voicefield/core"
import {
  createSession,
  findSessionByCode,
  findSessionById,
  findSessionByToken,
  pairSession,
  touchSession,
  endSession,
  addCommand,
  drainCommands,
  pushSSEEvent,
  registerSSEClient,
  getBufferedEventsSince,
} from "./session"

export interface VoicefieldServerConfig {
  generateSTTKey?: () => Promise<{ temporaryApiKey: string; expiresAt: number }>
  cors?: {
    origins?: string[]
  }
}

function corsHeaders(config: VoicefieldServerConfig, origin?: string | null): Record<string, string> {
  const allowed = config.cors?.origins
  const allowOrigin =
    !allowed || allowed.includes("*")
      ? origin || "*"
      : allowed.includes(origin || "")
        ? origin!
        : ""

  if (!allowOrigin) return {}

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

function json(data: unknown, status: number, cors: Record<string, string>) {
  return NextResponse.json(data, { status, headers: cors })
}

function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return findSessionByToken(authHeader.slice(7))
}

export function createVoicefieldHandler(config: VoicefieldServerConfig = {}) {
  async function handleRequest(
    request: NextRequest,
    context: { params: Promise<{ voicefield: string[] }> }
  ) {
    const origin = request.headers.get("origin")
    const cors = corsHeaders(config, origin)
    const { voicefield } = await context.params
    const path = voicefield.join("/")

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: cors })
    }

    if (request.method === "POST") {
      switch (path) {
        case "session":
          return handleCreateSession(request, config, cors)
        case "session/end":
          return handleEndSession(request, cors)
        case "pair":
          return handlePair(request, config, cors)
        case "transcript":
          return handleTranscript(request, cors)
        case "command":
          return handleCommand(request, cors)
        case "refresh-key":
          return handleRefreshKey(request, config, cors)
        default:
          return json({ error: "Not found" }, 404, cors)
      }
    }

    if (request.method === "GET") {
      switch (path) {
        case "transcript":
          return handleSSE(request, cors)
        case "status":
          return handleStatus(request, cors)
        case "network-info":
          return handleNetworkInfo(request, cors)
        default:
          return json({ error: "Not found" }, 404, cors)
      }
    }

    return json({ error: "Method not allowed" }, 405, cors)
  }

  return {
    GET: handleRequest,
    POST: handleRequest,
    OPTIONS: handleRequest,
  }
}

async function handleCreateSession(
  request: NextRequest,
  config: VoicefieldServerConfig,
  cors: Record<string, string>
) {
  if (!config.generateSTTKey) {
    return json({ error: "STT not configured", code: "NOT_CONFIGURED" }, 503, cors)
  }

  let body: { fields?: Array<{ id: string; label: string }>; language?: string | string[] }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const fields = body.fields ?? [{ id: "default", label: "Default" }]
  const language = body.language ?? "en"
  const session = createSession(fields, language)

  return json({
    sessionId: session.id,
    pairingCode: session.pairingCode,
    secret: session.secret,
    expiresAt: session.expiresAt,
  }, 200, cors)
}

async function handlePair(
  request: NextRequest,
  config: VoicefieldServerConfig,
  cors: Record<string, string>
) {
  if (!config.generateSTTKey) {
    return json({ error: "STT not configured", code: "NOT_CONFIGURED" }, 503, cors)
  }

  let body: { code?: string; secret?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const code = body.code?.replace(/\s/g, "")
  if (!code || !isValidPairingCode(code)) {
    return json({ error: "Invalid pairing code format", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const session = findSessionByCode(code)
  if (!session) {
    return json({ error: "Code expired or invalid", code: "INVALID_CODE" }, 400, cors)
  }

  if (body.secret && body.secret !== session.secret) {
    return json({ error: "Code expired or invalid", code: "INVALID_CODE" }, 400, cors)
  }

  let sessionToken: string
  try {
    sessionToken = pairSession(session)
  } catch {
    return json({ error: "Code expired or invalid", code: "INVALID_CODE" }, 400, cors)
  }

  pushSSEEvent(session, { type: "paired" })

  let sonioxTempKey = ""
  let keyExpiresAt = 0
  try {
    const keyResult = await config.generateSTTKey()
    sonioxTempKey = keyResult.temporaryApiKey
    keyExpiresAt = keyResult.expiresAt
  } catch {
    return json({ error: "Failed to initialize speech service", code: "STT_ERROR" }, 500, cors)
  }

  return json({
    sessionToken,
    sonioxTempKey,
    sonioxKeyExpiresAt: keyExpiresAt,
    fields: session.fields,
    language: session.language,
    config: {
      maxRecordingDuration: 120,
      idleTimeout: 30,
    },
  }, 200, cors)
}

async function handleTranscript(request: NextRequest, cors: Record<string, string>) {
  const session = authenticateRequest(request)
  if (!session) {
    return json({ error: "Unauthorized" }, 401, cors)
  }

  let body: { text?: string; isFinal?: boolean; fieldId?: string; recordingState?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, 400, cors)
  }

  touchSession(session)

  if (body.recordingState === "start") {
    pushSSEEvent(session, { type: "recording_start" })
    const commands = drainCommands(session)
    return json({ ok: true, commands }, 200, cors)
  }
  if (body.recordingState === "stop") {
    pushSSEEvent(session, { type: "recording_stop" })
    const commands = drainCommands(session)
    return json({ ok: true, commands }, 200, cors)
  }

  const { text, isFinal, fieldId } = body
  if (typeof text !== "string" || typeof isFinal !== "boolean") {
    return json({ error: "Missing text or isFinal", code: "VALIDATION_ERROR" }, 400, cors)
  }

  pushSSEEvent(session, { type: "transcript", text, isFinal, fieldId: fieldId ?? "default" })
  const commands = drainCommands(session)
  return json({ ok: true, commands }, 200, cors)
}

async function handleSSE(request: NextRequest, cors: Record<string, string>) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return json({ error: "Missing sessionId", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const session = findSessionById(sessionId)
  if (!session) {
    return json({ error: "Session not found or expired" }, 404, cors)
  }

  const lastEventIdHeader = request.headers.get("last-event-id")
  const lastEventId = lastEventIdHeader ? parseInt(lastEventIdHeader, 10) : 0

  const stream = new ReadableStream({
    start(controller) {
      registerSSEClient(session, controller)
      if (lastEventId > 0) {
        const missed = getBufferedEventsSince(session, lastEventId)
        for (const event of missed) {
          const encoded = `id: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`
          controller.enqueue(new TextEncoder().encode(encoded))
        }
      }
      const connectEvent = `data: ${JSON.stringify({ type: "connected", sessionId: session.id })}\n\n`
      controller.enqueue(new TextEncoder().encode(connectEvent))
    },
    cancel() {
      // cleanup handled by session expiry
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...cors,
    },
  })
}

async function handleEndSession(request: NextRequest, cors: Record<string, string>) {
  let body: { sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, 400, cors)
  }

  if (!body.sessionId) {
    return json({ error: "Missing sessionId", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const session = findSessionById(body.sessionId)
  if (!session) {
    return json({ error: "Session not found or already expired" }, 404, cors)
  }

  endSession(session)
  return json({ ok: true }, 200, cors)
}

async function handleCommand(request: NextRequest, cors: Record<string, string>) {
  let body: { sessionId?: string; type?: string; fieldId?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const { sessionId, type, fieldId } = body
  if (!sessionId || !type || !fieldId) {
    return json({ error: "Missing sessionId, type, or fieldId", code: "VALIDATION_ERROR" }, 400, cors)
  }

  const session = findSessionById(sessionId)
  if (!session || (session.state !== "paired" && session.state !== "active")) {
    return json({ error: "Session not found or not active" }, 404, cors)
  }

  if (type === "switch_field") {
    addCommand(session, { type: "switch_field", fieldId })
    pushSSEEvent(session, { type: "field_switched", fieldId })
  }

  return json({ ok: true }, 200, cors)
}

async function handleRefreshKey(
  request: NextRequest,
  config: VoicefieldServerConfig,
  cors: Record<string, string>
) {
  const session = authenticateRequest(request)
  if (!session) {
    return json({ error: "Unauthorized" }, 401, cors)
  }

  touchSession(session)

  if (!config.generateSTTKey) {
    return json({ error: "STT not configured", code: "NOT_CONFIGURED" }, 503, cors)
  }

  try {
    const { temporaryApiKey, expiresAt } = await config.generateSTTKey()
    return json({ sonioxTempKey: temporaryApiKey, expiresAt }, 200, cors)
  } catch {
    return json({ error: "Failed to refresh speech service key", code: "STT_ERROR" }, 500, cors)
  }
}

async function handleStatus(request: NextRequest, cors: Record<string, string>) {
  const session = authenticateRequest(request)
  if (!session) {
    return json({ error: "Unauthorized" }, 401, cors)
  }

  const commands = drainCommands(session)
  return json({ state: session.state, fields: session.fields, commands }, 200, cors)
}

function getLanAddresses(): string[] {
  const nets = networkInterfaces()
  const results: string[] = []
  for (const ifaces of Object.values(nets)) {
    if (!ifaces) continue
    for (const iface of ifaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        results.push(iface.address)
      }
    }
  }
  return results
}

async function handleNetworkInfo(request: NextRequest, cors: Record<string, string>) {
  const port = request.nextUrl.port || "3000"
  const lanIps = getLanAddresses()
  const basePath = request.nextUrl.pathname.replace(/\/network-info$/, "")
  return json({
    lan: lanIps.map((ip) => `http://${ip}:${port}${basePath}`),
    localhost: `http://localhost:${port}${basePath}`,
  }, 200, cors)
}
