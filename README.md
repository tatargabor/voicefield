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

## Self-hosting the phone page

By default, the QR code points to `voicefield.dev/mic`. To self-host:

```tsx
const vf = useVoicefield({
  serverUrl: '/api/voice',
  phoneUrl: 'https://my-voicefield.example.com',
  language: 'en',
})
```

The phone page source is in `apps/web/` — deploy it anywhere static (Cloudflare Pages, Vercel, GitHub Pages).

## License

MIT
