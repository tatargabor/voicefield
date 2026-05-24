# How to: Add Voice Input to a Next.js App

Step-by-step guide to integrate Voicefield into an existing Next.js App Router project.

## Prerequisites

- Next.js 14+ with App Router

No API key needed — works immediately with the browser's built-in speech recognition.

## 1. Install packages

```bash
npm install @voicefield/react @voicefield/server
```

## 2. Create the API route

Create a catch-all route that handles all Voicefield endpoints:

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["https://voicefield.dev"] },
})

export { GET, POST, OPTIONS }
```

> **Want higher accuracy?** Add Soniox: `npm install @soniox/node`, then configure `generateSttKey`. See [Custom STT Provider](./custom-stt-provider.md).

## 3. Mount the phone page (for local dev)

```tsx
// app/mic/page.tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

This is only needed for local development. In production, phones load the page from voicefield.dev.

## 4. Add voice input to a component

```tsx
"use client"

import { useRef } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

export function VoiceSearch() {
  const inputRef = useRef<HTMLInputElement>(null)

  const vf = useVoicefield({
    serverUrl: "/api/voice",
    phoneUrl: "",        // "" for local dev, omit for production
    language: "en",
  })

  vf.register("search", "Search", inputRef)

  return (
    <div>
      <input ref={inputRef} placeholder="Search..." />
      <button onClick={() => vf.showQR()}>Mic</button>

      <QRPopup
        pairingCode={vf.pairingCode}
        secret={vf.secret}
        serverUrl={vf.serverUrl}
        phoneUrl={vf.phoneUrl}
        isVisible={vf.isQRVisible}
        onClose={vf.hideQR}
      />
    </div>
  )
}
```

## 5. Test it

```bash
npm run dev
```

Open `http://localhost:3000`, click the mic button, scan the QR with your phone.

For testing with a real phone (needs HTTPS):

```bash
ngrok http 3000
```

Open the ngrok URL in your browser instead of localhost.

## Going to production

Remove `phoneUrl: ""` (or omit it entirely) — the phone page will load from voicefield.dev:

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  language: "en",
})
```

Make sure CORS allows voicefield.dev:

```typescript
cors: { origins: ["https://voicefield.dev"] }
```

See [Deployment Guide](../deployment.md) for all deployment options.
