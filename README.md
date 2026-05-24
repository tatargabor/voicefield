# Voicefield

**Voice-enable any web field.** Turn your phone into a microphone for any web application.

Scan a QR code → speak into your phone → text appears in the web field. Real-time, open source, self-hostable.

## How it works

```
┌─────────────────────────────┐
│  voicefield.dev / your host │  Static phone page (no data stored)
└────────────┬────────────────┘
             │ loads phone page
             ▼
┌────────────────────┐         ┌──────────────────────┐
│  Phone browser     │  POST   │  Your server         │
│  STT runs here     │────────▶│  @voicefield/server  │
│  (client-side)     │  text   │  (relay only)        │
└────────────────────┘         └──────────┬───────────┘
                                          │ SSE
                                          ▼
                               ┌──────────────────────┐
                               │  Desktop browser     │
                               │  @voicefield/react   │
                               └──────────────────────┘
```

- **Works out of the box** — uses the browser's built-in Web Speech API, no API key needed
- **Upgrade to Soniox** — for higher accuracy, add a Soniox API key (or bring your own STT provider)
- **No audio leaves the phone** — STT runs client-side, your server only relays text
- **Phone page is static** — defaults to voicefield.dev, or self-host on your own domain

## Quick Start

```bash
npm install @voicefield/react @voicefield/server
```

No API key needed — works immediately with the browser's built-in speech recognition.

### 1. Add API route (Next.js App Router)

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from '@voicefield/server'

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ['https://voicefield.dev'] },
})

export { GET, POST, OPTIONS }
```

> **Want higher accuracy?** Add [Soniox](https://soniox.com) or another cloud STT provider. See [Upgrading to a cloud STT provider](#upgrading-to-a-cloud-stt-provider).

### 2. Mount the phone page (for local dev)

```tsx
// app/mic/page.tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

### 3. Use in your component

```tsx
import { useVoicefield, QRPopup } from '@voicefield/react'

function MyComponent() {
  const inputRef = useRef<HTMLInputElement>(null)

  const vf = useVoicefield({
    serverUrl: '/api/voice',
    language: 'en',
  })

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

That's it. 3 files, and any web field has voice input.

## Example App

A working example lives in [`apps/example/`](apps/example/):

```bash
pnpm install && pnpm build
cd apps/example && pnpm dev
```

Works immediately with Web Speech API. For Soniox, copy `.env.local.example` and add your key.

## Upgrading to a Cloud STT Provider

Web Speech API works great for most use cases. For higher accuracy or more language support, add a cloud provider like [Soniox](https://soniox.com):

```bash
npm install @soniox/node
```

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from '@voicefield/server'
import { SonioxNodeClient } from '@soniox/node'

const soniox = new SonioxNodeClient({ api_key: process.env.SONIOX_API_KEY! })

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSttKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
  cors: { origins: ['https://voicefield.dev'] },
})

export { GET, POST, OPTIONS }
```

The provider is selected automatically — if `generateSttKey` is configured, the phone uses Soniox. Otherwise, it falls back to the browser's Web Speech API. You can also [build your own provider](docs/howto/custom-stt-provider.md).

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@voicefield/core`](packages/core/) | Types and utilities (zero deps) | [![npm](https://img.shields.io/npm/v/@voicefield/core)](https://npmjs.com/package/@voicefield/core) |
| [`@voicefield/react`](packages/react/) | React hook + QR popup + phone page | [![npm](https://img.shields.io/npm/v/@voicefield/react)](https://npmjs.com/package/@voicefield/react) |
| [`@voicefield/server`](packages/server/) | Next.js API route handler (relay) | [![npm](https://img.shields.io/npm/v/@voicefield/server)](https://npmjs.com/package/@voicefield/server) |

## Deployment Modes

| Mode | Phone page | Server | HTTPS | Setup effort |
|------|-----------|--------|-------|-------------|
| **Local (LAN)** | Your `/mic` page | localhost | Not needed | Zero |
| **ngrok** | voicefield.dev | ngrok tunnel | Automatic | 1 command |
| **mkcert** | Your `/mic` page | localhost + cert | Manual | Phone CA install |
| **Production** | voicefield.dev | Your domain | Let's Encrypt | Standard deploy |
| **Self-hosted** | Your domain | Your domain | Let's Encrypt | Deploy both |

### Local development (no tunnel needed)

For local dev, mount the phone page in your app and let Voicefield auto-detect your LAN IP:

```tsx
const vf = useVoicefield({
  serverUrl: '/api/voice',
  phoneUrl: '',        // local mode — uses your server's /mic page
  language: 'en',
})
```

The QR code points to `http://192.168.x.x:PORT/mic` — phone connects over WiFi.

**Note**: Real phones need HTTPS for microphone access. Use ngrok for dev:

```bash
ngrok http 3000
# Set: NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL=https://abc123.ngrok-free.app/api/voice
```

### Production (hosted phone page)

```tsx
const vf = useVoicefield({
  serverUrl: '/api/voice',
  // phoneUrl defaults to https://voicefield.dev
  language: 'en',
})
```

Phone loads `voicefield.dev/mic` (static, open source), all API calls go to **your** server.

## Security

- **Audio stays on the phone** — STT runs client-side, only text is relayed
- **In-memory sessions** — no database, no persistence, 30-min TTL
- **Cryptographic pairing** — 256-bit secret in QR, 384-bit session token
- **Single-use codes** — 6-digit pairing code deleted after use
- **Your server controls everything** — STT keys generated on your infra, provider of your choice

See [Security Model](docs/security.md) for the full threat model and design.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, data flow, design decisions |
| [API Reference](docs/api-reference.md) | All endpoints, request/response shapes, error codes |
| [Security](docs/security.md) | Threat model, auth flow, crypto primitives |
| [Deployment](docs/deployment.md) | Detailed setup for all deployment modes |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and fixes |
| [Contributing](CONTRIBUTING.md) | Dev setup, branching, code style, testing |

### How-To Guides

| Guide | Description |
|-------|-------------|
| [Add voice to Next.js](docs/howto/add-voice-to-nextjs.md) | Step-by-step integration |
| [Multi-field forms](docs/howto/multi-field-forms.md) | Register multiple fields, field switching |
| [Controlled inputs](docs/howto/controlled-inputs.md) | Setter function pattern for React state |
| [Custom STT provider](docs/howto/custom-stt-provider.md) | Replace Soniox with another STT |
| [Self-host phone page](docs/howto/self-host-phone-page.md) | Deploy your own phone page |

## Why this architecture?

**Why not just use the browser's SpeechRecognition API?** That's exactly what Voicefield does by default — but with a twist: it runs on the phone's browser (better mic hardware) and relays only text to the desktop. For higher accuracy, you can upgrade to a cloud STT provider like Soniox without changing any client code.

**Why a relay server?** The phone needs a way to send transcripts to the desktop. The relay is minimal — in-memory, no persistence, only text passes through. When using a cloud STT provider, the server also generates temporary API keys.

**Why voicefield.dev?** The phone page needs HTTPS for microphone access. Rather than making every developer set up HTTPS locally, the phone loads its UI from voicefield.dev (static, open source) while making all API calls to your server. For production, you can [self-host the phone page](docs/howto/self-host-phone-page.md).

## Development

```bash
# Clone and install
git clone https://github.com/tatargabor/voicefield.git
cd voicefield
pnpm install

# Build all packages
pnpm build

# Run example app (works immediately, no API key needed)
cd apps/example && pnpm dev
```

### Testing & Linting

```bash
pnpm test           # unit tests (vitest)
pnpm lint           # eslint
pnpm format         # prettier
pnpm format:check   # check formatting

# E2E tests
cd apps/example && npx playwright test
```

### Publishing

```bash
# Always use pnpm (resolves workspace: protocol)
cd packages/core && pnpm publish --access public
cd packages/react && pnpm publish --access public
cd packages/server && pnpm publish --access public
```

## License

MIT
