# Architecture

## Overview

Voicefield turns any phone into a wireless microphone for web apps. The key insight: phones have excellent microphones and modern browsers can run STT entirely client-side. The server only relays text — never audio.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR INFRASTRUCTURE                            │
│                                                                         │
│  ┌─────────────────────┐          ┌──────────────────────────────────┐ │
│  │  Desktop browser     │   SSE    │  Your Next.js server             │ │
│  │  @voicefield/react   │◄─────────│  @voicefield/server              │ │
│  │                      │          │                                  │ │
│  │  - useVoicefield()   │          │  - In-memory sessions            │ │
│  │  - QRPopup           │          │  - Pairing (code + secret)       │ │
│  │  - Field registry    │          │  - SSE event relay               │ │
│  └─────────────────────┘          │  - Soniox temp key generation    │ │
│                                    └──────────┬───────────────────────┘ │
│                                               │                         │
└───────────────────────────────────────────────┼─────────────────────────┘
                                                │ POST /transcript
                                                │ (text only, not audio)
                                                │
┌───────────────────────────────────────────────┼─────────────────────────┐
│                                               │                         │
│  ┌────────────────────────────────────────────┼──────────────────────┐ │
│  │  Phone browser                             ▼                      │ │
│  │                                                                   │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐  │ │
│  │  │  Microphone   │───▶│  Soniox SDK  │───▶│  Send text to      │  │ │
│  │  │  getUserMedia │    │  (client STT)│    │  server relay      │  │ │
│  │  └──────────────┘    └──────────────┘    └────────────────────┘  │ │
│  │                                                                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              PHONE                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  voicefield.dev (optional)                                              │
│  Static SPA — serves phone page JS only. Zero data, zero logging.       │
│  Phone loads code from here, but ALL API calls go to YOUR server.       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Session Creation (Desktop)

```
Desktop ──POST /session──> Server
         { fields, language }
         
Server creates:
  - Session ID (UUIDv4)
  - Pairing code (6 random digits, 5-min TTL)
  - Secret (256-bit random hex)
  - No auth token yet

Server ──response──> Desktop
         { sessionId, pairingCode, secret }
```

### 2. QR Code Display

Desktop builds a URL: `{phoneUrl}/mic?server={serverUrl}&code={pairingCode}&secret={secret}`

This URL is encoded into a QR code. The phone scans it.

### 3. Pairing (Phone)

```
Phone ──POST /pair──> Server
        { code, secret }

Server validates:
  - Code exists and matches a session
  - Secret matches
  - Session is in "created" state
  - Pairing TTL hasn't expired

Server generates:
  - Session token (384-bit random, base64url)
  - Soniox temporary API key (via generateSttKey callback)

Server ──response──> Phone
         { sessionToken, sttKey, fields, language, config }

Server ──SSE push──> Desktop
         { type: "paired" }
```

### 4. Recording & Transcription (Phone → Server → Desktop)

```
Phone microphone
    │
    ▼ (audio stays on phone)
Soniox Client SDK (runs in phone browser)
    │
    ▼ (text only)
Phone ──POST /transcript──> Server ──SSE push──> Desktop
        { text, isFinal, fieldId }              { type: "transcript", text, isFinal, fieldId }
```

The server is a pure relay — it doesn't process, store, or log transcripts.

### 5. Field Switching (Desktop → Server → Phone)

```
Desktop ──POST /command──> Server (queues command)
           { sessionId, type: "switch_field", fieldId }

Phone ──GET /status──> Server (polls every 5s)
         response: { commands: [{ type: "switch_field", fieldId }] }
```

## Design Decisions

### Why STT on the phone?

- **Privacy**: Audio never leaves the device. Only recognized text is transmitted.
- **Quality**: Phone microphones are better than laptop mics (noise cancellation, closer to mouth).
- **Latency**: Soniox SDK streams results in real-time via WebSocket directly from phone to Soniox cloud — the relay only sees final/partial text.

### Why not WebSocket for desktop ← server?

SSE (Server-Sent Events) is simpler, works through all proxies/CDNs, auto-reconnects, and supports `Last-Event-ID` for resumption. The desktop only receives data — never sends via this channel.

### Why in-memory sessions?

- No database dependency
- No data persistence (privacy by design)
- Sessions are short-lived (30-min sliding TTL)
- Simple cleanup via periodic GC
- Trade-off: sessions don't survive server restart (acceptable for voice input)

### Why a separate phone page URL?

The phone page loads JavaScript that accesses `getUserMedia`. This requires HTTPS (except localhost). By defaulting to `voicefield.dev`, we avoid requiring the consumer to set up HTTPS for development. In production, the consumer's domain already has HTTPS.

### Why polling for commands (phone)?

The phone→server direction uses POST (for transcripts). The command channel (desktop→phone) uses polling because:
- Commands are rare (field switches)
- Adding a second SSE/WS connection for rare events adds complexity
- 5-second polling latency is fine for UI field switches

## Package Boundaries

```
@voicefield/core (zero deps)
├── Types (shared between all packages)
├── Pairing utilities (code format, QR URL build/parse)
└── Validation helpers

@voicefield/react (depends on core)
├── useVoicefield() hook
├── QRPopup component
├── FieldRegistry (manages field→element bindings)
└── Phone page component (Mic)

@voicefield/server (depends on core)
├── createVoicefieldHandler() — Next.js route handler factory
├── Session management (create, pair, touch, expire, cleanup)
├── SSE relay (push events to desktop)
└── Network detection (LAN IP for local mode)
```

## Session State Machine

```
         ┌─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     │
┌──────────────┐    pair()    ┌──────────┐  touch()  ┌────────┴──┐
│   CREATED    │────────────▶ │  PAIRED  │─────────▶ │  ACTIVE   │
└──────┬───────┘              └────┬─────┘           └─────┬─────┘
       │                           │                       │
       │ 5-min TTL                 │ 30-min idle           │ 30-min idle
       │                           │ or endSession()       │ or 24h hard max
       ▼                           ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                          EXPIRED                                   │
│  (cleaned up by periodic GC, SSE clients closed)                  │
└───────────────────────────────────────────────────────────────────┘
```
