# @voicefield/server

Server-side relay handler for [Voicefield](https://voicefield.dev). Manages sessions, pairing, and transcript relay between the phone and desktop browser via SSE.

## Install

```bash
npm install @voicefield/server
```

No API key needed — works immediately with the browser's built-in Web Speech API.

**Try the demo app** — clone [github.com/tatargabor/voicefield](https://github.com/tatargabor/voicefield) and run `pnpm install && pnpm build && cd apps/example && pnpm dev`. For phone testing: `ngrok http 3000` and open the HTTPS URL on desktop.

## Quick Start (Next.js App Router)

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["https://voicefield.dev"] },
})

export { GET, POST, OPTIONS }
```

That's it. The catch-all route handles all Voicefield endpoints.

### Upgrading to Soniox (optional)

For higher accuracy, add a cloud STT provider:

```bash
npm install @soniox/node
```

```typescript
import { createVoicefieldHandler } from "@voicefield/server"
import { SonioxNodeClient } from "@soniox/node"

const soniox = new SonioxNodeClient({ api_key: process.env.SONIOX_API_KEY! })

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSttKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
  cors: { origins: ["https://voicefield.dev"] },
})

export { GET, POST, OPTIONS }
```

## Configuration

```typescript
interface VoicefieldServerConfig {
  generateSttKey?: () => Promise<{
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
| `generateSttKey` | Optional. Async function that returns a temporary STT API key. If omitted, the phone uses the browser's Web Speech API. |
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

## License

MIT
