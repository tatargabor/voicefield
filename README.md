# Voicefield

**Voice-enable any web field.** Turn your phone into a microphone for any web application.

Scan a QR code → speak into your phone → text appears in the web field. Real-time, open source, self-hostable.

## How it works

```
┌────────────────────┐
│  voicefield.dev    │  Static SPA — phone UI (no data stored)
└────────┬───────────┘
         │ loads phone page
         ▼
┌────────────────────┐         ┌──────────────────────┐
│  Phone browser     │  POST   │  Your server         │
│  STT runs here     │────────▶│  @voicefield/server  │
│  (client-side)     │         │  (relay only)        │
└────────────────────┘         └──────────┬───────────┘
                                          │ SSE
                                          ▼
                               ┌──────────────────────┐
                               │  Desktop browser     │
                               │  @voicefield/react   │
                               └──────────────────────┘
```

- **No audio leaves the phone** — STT runs in the phone browser
- **Your server is the relay** — only text passes through, with short-lived sessions
- **voicefield.dev just serves the phone page** — zero data, pure static

## Quick Start

```bash
npm install @voicefield/react @voicefield/server @soniox/node
```

### 1. Add API route (Next.js App Router)

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from '@voicefield/server'
import { SonioxNodeClient } from '@soniox/node'

const soniox = new SonioxNodeClient({ api_key: process.env.SONIOX_API_KEY! })

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 1800,
      single_use: false,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
  cors: { origins: ['https://voicefield.dev'] },
})

export { GET, POST, OPTIONS }
```

### 2. Use in your component

```tsx
import { useVoicefield, QRPopup } from '@voicefield/react'

function MyComponent() {
  const vf = useVoicefield({
    serverUrl: '/api/voice',
    language: 'en',
  })

  const inputRef = useRef<HTMLInputElement>(null)
  vf.register('search', 'Search', inputRef)

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => vf.showQR()}>🎤</button>
      <QRPopup
        pairingCode={vf.pairingCode}
        secret={vf.secret}
        serverUrl={vf.serverUrl}
        phoneUrl={vf.phoneUrl}
        isVisible={vf.isQRVisible}
        onClose={vf.hideQR}
      />
    </>
  )
}
```

## Packages

| Package | Description |
|---------|-------------|
| `@voicefield/core` | Types and utilities (zero deps) |
| `@voicefield/react` | React hook + QR popup component |
| `@voicefield/server` | Next.js API route handler (relay) |

## Deployment modes

### Local development (no ngrok needed)

For local dev, mount the phone page in your own app and let Voicefield auto-detect your LAN IP:

```tsx
// app/mic/page.tsx — one line
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

```tsx
// In your component
const vf = useVoicefield({
  serverUrl: '/api/voice',
  phoneUrl: '',        // local mode — uses your server's /mic page
  language: 'en',
})
```

The QR code will point to `http://192.168.x.x:PORT/mic` — your phone connects directly over WiFi. No tunnel, no HTTPS needed (localhost gets `getUserMedia` without HTTPS).

The LAN IP is auto-detected via the `/api/voice/network-info` endpoint. To override (e.g., multiple network adapters):

```env
NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL=http://192.168.1.50:3000/api/voice
```

### Hosted mode (zero setup for phone page)

Use `voicefield.dev` to serve the phone page — your server is still the relay:

```tsx
const vf = useVoicefield({
  serverUrl: '/api/voice',
  // phoneUrl defaults to https://voicefield.dev
  externalServerUrl: 'https://myapp.com/api/voice',  // phone must reach this
  language: 'en',
})
```

The phone loads `voicefield.dev/mic` (static, open source, no data stored), but all API calls go to **your** server.

### Self-hosted phone page

Deploy the phone page yourself for full control:

```tsx
const vf = useVoicefield({
  serverUrl: '/api/voice',
  phoneUrl: 'https://voice.mycompany.com',
  language: 'en',
})
```

The phone page source is in `apps/web/` — deploy it anywhere static (Cloudflare Pages, Vercel, GitHub Pages).

## Why this architecture?

**No audio leaves the phone.** Speech-to-text runs entirely in the phone browser (via Soniox SDK). The server only relays recognized text — never audio.

**Your server, your data.** The relay runs on your infrastructure. Sessions are in-memory with short TTLs (30 min sliding, 24h hard max). No database, no persistence.

**voicefield.dev stores nothing.** It serves a static SPA (the phone page). When a phone loads `voicefield.dev/mic?server=yourapp.com&code=123456`, all API calls go to `yourapp.com` — voicefield.dev never sees the transcript.

**Why not just use the browser's SpeechRecognition API?** Browser support is inconsistent, accuracy varies wildly, and it doesn't work cross-origin. Voicefield uses the phone's microphone (better hardware) with a professional STT engine (Soniox), giving consistent, high-quality results across all devices.

## License

MIT
