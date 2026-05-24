# @voicefield/server

Server-side relay handler for Voicefield. Manages sessions, pairing, and transcript relay between the phone and desktop browser via SSE.

## Install

```bash
npm install @voicefield/server @soniox/node
```

Peer dependencies: `next >= 14`, `@soniox/node >= 1.0` (optional if providing your own `generateSTTKey`).

## Quick Start (Next.js App Router)

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from "@voicefield/server"
import { SonioxNodeClient } from "@soniox/node"

const soniox = new SonioxNodeClient({ api_key: process.env.SONIOX_API_KEY! })

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 1800,
      single_use: false,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
  cors: {
    origins: ["https://voicefield.dev"],
  },
})

export { GET, POST, OPTIONS }
```

That's it. The catch-all route handles all Voicefield endpoints.

## Configuration

```typescript
interface VoicefieldServerConfig {
  generateSTTKey?: () => Promise<{
    temporaryApiKey: string
    expiresAt: number   // unix ms timestamp
  }>
  cors?: {
    origins?: string[]  // allowed origins for CORS headers
  }
}
```

| Option | Description |
|--------|-------------|
| `generateSTTKey` | Async function that returns a temporary Soniox API key. Called on pairing and key refresh. |
| `cors.origins` | List of origins allowed to call the API. Include `https://voicefield.dev` if using hosted phone page. Use `["*"]` for development. |

## API Endpoints

The handler exposes these endpoints under your catch-all route:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/session` | None | Create a new voice session |
| POST | `/pair` | None | Pair phone to session (via code + secret) |
| GET | `/transcript` | None | SSE stream for desktop (by sessionId param) |
| POST | `/transcript` | Bearer | Phone sends transcript chunks |
| POST | `/command` | None | Desktop sends commands (field switch) |
| POST | `/session/end` | None | End a session |
| POST | `/refresh-key` | Bearer | Phone requests a new STT key |
| GET | `/status` | Bearer | Phone polls for commands |
| GET | `/network-info` | None | Returns LAN IPs for local mode |

### Session lifecycle

```
Created ──[phone pairs]──> Paired ──[phone starts recording]──> Active ──[timeout/end]──> Expired
   │                                                                          ▲
   └──[5min pairing TTL expires]──────────────────────────────────────────────┘
```

- **Created**: waiting for phone to pair. Expires in 5 minutes if not paired.
- **Paired**: phone connected, waiting for user to tap record.
- **Active**: phone is recording and sending transcripts.
- **Expired**: session ended (manually or by timeout).

### Session security

- Sessions are **in-memory only** — no database, no persistence across restarts
- Pairing code: 6 random digits, single-use, 5-minute TTL
- Session secret: 256-bit random, included in QR code, validated on pairing
- Session token: 384-bit random, Bearer auth for phone→server calls
- Sliding TTL: 30 minutes of inactivity → expired
- Hard max: 24 hours regardless of activity

## Custom STT Providers

You can use any STT service — just return a temporary API key (or equivalent auth token) from `generateSTTKey`. The phone page uses `@soniox/client` by default, but you could build a custom phone page that uses any provider.

```typescript
createVoicefieldHandler({
  generateSTTKey: async () => {
    // Your custom STT provider
    const token = await mySTTService.createTempToken({ duration: 1800 })
    return { temporaryApiKey: token, expiresAt: Date.now() + 1800_000 }
  },
})
```

## CORS Configuration

For **local development** (phone on same WiFi):
```typescript
cors: { origins: ["*"] }
```

For **production with voicefield.dev**:
```typescript
cors: { origins: ["https://voicefield.dev"] }
```

For **self-hosted phone page**:
```typescript
cors: { origins: ["https://voice.yourcompany.com"] }
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SONIOX_API_KEY` | Yes | Your Soniox API key for generating temp keys |
| `NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL` | No | Override the external URL (for tunnels) |

## License

MIT
