# How to: Use a Custom STT Provider

Voicefield uses Soniox by default, but the architecture supports any STT service that can run in the browser.

## Server side: provide a token

The `generateSTTKey` callback returns whatever auth token your STT provider needs:

```typescript
// app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => {
    // Example: Deepgram
    const res = await fetch("https://api.deepgram.com/v1/keys/...", {
      method: "POST",
      headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      body: JSON.stringify({ time_to_live_in_seconds: 1800 }),
    })
    const data = await res.json()
    return {
      temporaryApiKey: data.api_key,
      expiresAt: Date.now() + 1800_000,
    }
  },
})

export { GET, POST, OPTIONS }
```

## Client side: custom phone page

The default phone page (`@voicefield/react/phone`) uses `@soniox/client`. To use a different STT, build a custom phone page that:

1. Gets the temporary key from the pair response (`sonioxTempKey` field)
2. Opens a WebSocket/connection to your STT service
3. Streams microphone audio to the STT
4. POSTs recognized text to the Voicefield relay

```tsx
// app/mic/page.tsx — custom phone page skeleton
"use client"

import { useEffect, useState } from "react"

export default function CustomMicPage() {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sttKey, setSttKey] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const server = params.get("server")
    const code = params.get("code")
    const secret = params.get("secret")

    if (server && code) {
      fetch(`${server}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, secret }),
      })
        .then((r) => r.json())
        .then((data) => {
          setSessionToken(data.sessionToken)
          setSttKey(data.sonioxTempKey) // your STT temp key
          // Now: start your STT with sttKey, send transcripts via:
          // POST ${server}/transcript { text, isFinal, fieldId }
          // with Authorization: Bearer ${data.sessionToken}
        })
    }
  }, [])

  return <div>{/* Your custom recording UI */}</div>
}
```

## What you keep from Voicefield

Even with a custom STT, you still get:
- Session management (pairing, expiry, cleanup)
- QR code / manual code pairing
- Field registration and switching
- SSE transcript relay to desktop
- Desktop hook (`useVoicefield`)

You only replace the phone page and the `generateSTTKey` callback.
