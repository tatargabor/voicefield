---

# r/reactjs

**Title:** I built a React hook that turns your phone into a wireless mic for any text field

I needed voice input in a React app — phone as mic, text appears on desktop. Couldn't find a ready-made solution (or maybe I was looking in the wrong places), so I spent a day wiring it up myself: Web Speech API, relay server, QR pairing, browser quirks, partial vs. final transcript logic.

It worked, so I packaged it into a hook. If you need the same thing, you don't have to.

**How it works:**

1. Desktop shows a QR code
2. Phone scans it, runs speech-to-text locally (Web Speech API, no API key needed)
3. Only the transcribed text gets relayed to the desktop via SSE
4. Text streams into whichever input field has focus

Audio never leaves the phone. Your server only relays text.

**Integration is 3 files:**

1. API route — `createVoicefieldHandler()` handles sessions, pairing, and relay
2. Phone page — one-line re-export of the built-in mic UI
3. Your component — `useVoicefield()` hook + `QRPopup` + `vf.register()` your fields

The phone page at [voicefield.dev](https://voicefield.dev) is a static SPA you can use as-is — open source, no data passes through it, no audio or text is stored or logged. Or self-host it on your own domain.

A few things that might be interesting technically:

- Pairing uses a 256-bit secret embedded in the QR code, sessions are cryptographically bound
- Sessions are in-memory with a sliding TTL, no database needed
- Upgrade to Soniox for better accuracy without changing client code

MIT licensed, Next.js App Router, TypeScript.

GitHub: https://github.com/tatargabor/voicefield
Site: https://voicefield.dev
Install: `npm install @voicefield/react @voicefield/server`

Happy to answer questions or hear feedback.

---

# r/webdev

**Title:** I built an open-source library that turns your phone into a wireless mic for any web form

I needed voice input in a web app — phone as mic, text appears on desktop. I either couldn't find a ready-made solution or wasn't looking in the right places, so I spent a day wiring it up: Web Speech API, relay server, QR pairing, browser quirks.

It worked, so I turned it into a library. If you need the same thing, you don't have to.

**The idea:** scan a QR code with your phone, speak, text appears in the form field on your desktop. Speech recognition runs entirely on the phone — no audio ever reaches your server, it only relays the transcribed text.

**What it takes to integrate:**

1. A catch-all API route (one handler function)
2. A phone page (one-line re-export)
3. A hook in your component + a QR popup

No API key needed to start — it uses the browser's built-in Web Speech API. If you need better accuracy, plug in Soniox or your own STT provider without changing client code.

The phone page at [voicefield.dev](https://voicefield.dev) is a static SPA you can use out of the box — open source, no data passes through it, nothing is stored or logged. Or self-host it.

Currently works with Next.js App Router. MIT licensed, TypeScript.

GitHub: https://github.com/tatargabor/voicefield
Site: https://voicefield.dev
Install: `npm install @voicefield/react @voicefield/server`

Would love to hear feedback — especially on the DX and what other frameworks you'd want supported.

---

# r/nextjs

**Title:** Built a Next.js integration that turns your phone into a wireless mic for any text field — 3 files

I needed voice input in a Next.js app: phone as mic, text appears on desktop. Couldn't find a drop-in solution (or wasn't looking in the right places), so I spent a day wiring it up from scratch. It worked, so I packaged it. If you need the same thing, here's the whole integration:

**How it works:** your app shows a QR code, user scans with their phone, phone runs STT locally, only text gets relayed back to the desktop via SSE. Audio never leaves the phone.

**The integration is 3 files in your Next.js App Router project:**

**1. API route** — `app/api/voice/[...voicefield]/route.ts`
```typescript
import { createVoicefieldHandler } from "@voicefield/server"
const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["https://voicefield.dev"] },
})
export { GET, POST, OPTIONS }
```

**2. Phone page** — `app/mic/page.tsx`
```tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

**3. Your component** — `useVoicefield()` hook + `QRPopup` + register your fields

No API key needed: uses the browser's Web Speech API out of the box. Add Soniox for better accuracy without changing client code.

The phone page at [voicefield.dev](https://voicefield.dev) is a static SPA you can use as-is — open source, no data passes through it, nothing stored or logged. Sessions are in-memory with cryptographic pairing, no database needed.

MIT licensed, TypeScript.

GitHub: https://github.com/tatargabor/voicefield
Site: https://voicefield.dev
Install: `npm install @voicefield/react @voicefield/server`

Feedback welcome — especially on the handler API and hook ergonomics.
