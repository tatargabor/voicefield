---
title: "Turn Your Phone Into Voice Input for Any React Text Field"
published: false
description: "Voicefield lets users scan a QR code, speak into their phone, and see text appear in any web form field. Speech recognition runs on the phone, no audio ever reaches your server."
tags: #react #nextjs, #speechtotext, #opensource
---

Every time I needed voice input in a React app, I ended up wiring it from scratch (via agent). Web Speech API setup, browser inconsistencies, a relay server for the phone-to-desktop connection, later QR pairing, Chrome killing recognition mid-sentence, partial vs. final transcript logic. A day of annoying plumbing before you get to the actual feature.

There was never a ready-made solution for this. So I built one. Install it, add three files, and you have voice input that works — without the day of debugging browser quirks.

[Voicefield](https://voicefield.dev) — one hook, any text field, your phone as the mic. No audio leaves the device, no API keys to start. The phone page at [voicefield.dev](https://voicefield.dev) is a static SPA you can use as-is if you don't want to build your own frontend — it's open source, no data passes through it, and no audio or text is stored or logged.

## How it works

1. Your desktop app shows a QR code
2. User scans it with their phone
3. Phone runs speech-to-text locally (Web Speech API, no key needed)
4. Only the transcribed text gets relayed to the desktop
5. The desktop app streams the transcript directly into whichever input field currently has focus

Audio never leaves the phone. Your server never sees or stores any audio data. It only relays text.

## The architecture

```
Phone (STT)              Your Server             Desktop Browser
+-----------+  text only +--------------+  SSE   +--------------+
| Web Speech| ---------> | Relay        | -----> | useVoicefield|
| API       |  POST /txt | (in-memory   | stream | () hook      |
| (browser) |            |  sessions)   |        |              |
+-----------+            +--------------+        +--------------+
      ^                         ^                       |
      |        QR scan          |    creates session    |
      +-------------------------+-----------------------+
```

The phone and desktop find each other through cryptographic pairing — a 256-bit secret is embedded in the QR code, and the phone gets a 384-bit session token after pairing. Sessions live in memory with a 30-minute sliding TTL. No database needed.

Speech recognition defaults to the browser's built-in Web Speech API, which means zero API keys to get started. If you need better accuracy or more languages, you can plug in [Soniox](https://soniox.com) — the hook abstracts over the provider.

## 3-file integration

Voicefield integration in a Next.js app boils down to three files.

**1. API route** — `app/api/voice/[...voicefield]/route.ts`

```typescript
import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["*"] },
})

export { GET, POST, OPTIONS }
```

That's your relay server. It handles session creation, pairing, transcript forwarding, and SSE streaming.

**2. Phone page** — `app/mic/page.tsx`

```tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

This is the page the phone loads after scanning the QR code. It handles microphone access, STT, and sending transcripts.

**3. Your component** — wherever you want voice input

```tsx
import { useVoicefield, QRPopup } from "@voicefield/react"
import { useRef } from "react"

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null)

  const vf = useVoicefield({
    serverUrl: "/api/voice",
    language: "en",
  })

  vf.register("search", "Search", inputRef)

  return (
    <>
      <input ref={inputRef} placeholder="Search..." />
      <button onClick={() => vf.showQR()}>Pair phone</button>
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

Register fields, switch between them on focus, done.

## Why this matters for privacy

Most voice-to-text solutions work like this: capture audio, send it to a server, get text back. That means someone's server has a recording of everything your user said.

Voicefield flips it. The Web Speech API runs entirely in the phone's browser. The relay server only ever sees the resulting text — short strings like "John Smith" or "I'd like to schedule a demo." No audio buffers, no recordings, no stored voice data.

This matters for medical forms, legal intake, financial applications — anywhere users are dictating sensitive information.

## Try it

Voicefield is MIT licensed, works with Next.js App Router, and doesn't require any API keys to get started.

Install it, add three files, scan a QR code, and your forms suddenly support voice input.

```bash
npm install @voicefield/react @voicefield/server
```

Repo: [github.com/tatargabor/voicefield](https://github.com/tatargabor/voicefield)
Docs: [voicefield.dev](https://voicefield.dev)

If you build something with it, I'd genuinely love to hear about it.
