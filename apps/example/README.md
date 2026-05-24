# Voicefield Example App

Minimal Next.js app demonstrating `@voicefield/react` + `@voicefield/server`.

Two demos — chat (single field) and form (multi-field). Pair your phone via QR code, speak, and text appears in real-time.

## Setup

```bash
# From the monorepo root:
pnpm install
pnpm build

# Copy and fill in your API key:
cp apps/example/.env.local.example apps/example/.env.local
# Edit .env.local → add your SONIOX_API_KEY (free at https://soniox.com)

# Start the example:
cd apps/example
pnpm dev
```

Open http://localhost:3000 — click the mic button, scan the QR with your phone.

## Files

```
app/
├── page.tsx                           ← Homepage (dynamic import)
├── components/
│   ├── app.tsx                        ← Tab switcher (chat / form)
│   ├── chat-demo.tsx                  ← Single-field chat demo
│   └── form-demo.tsx                  ← Multi-field form demo
├── api/voice/[...voicefield]/route.ts ← Server handler
├── mic/page.tsx                       ← Phone page (1 line)
└── layout.tsx                         ← Root layout
e2e/
└── voicefield.spec.ts                 ← Playwright e2e tests
playwright.config.ts                   ← Playwright config
```

## Development with a real phone

Your phone needs HTTPS to access the microphone. Options:

### ngrok (easiest)

```bash
# Terminal 1:
pnpm dev

# Terminal 2:
ngrok http 3000

# Then set in .env.local:
NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL=https://abc123.ngrok-free.app/api/voice
```

### Same-device testing

Open http://localhost:3000/mic on the same machine — localhost gets `getUserMedia` without HTTPS.

## What this demonstrates

- **Multi-field voice input**: Two fields with active field switching
- **Automatic LAN detection**: QR code encodes the local network address
- **Local phone page**: `/mic` route serves the phone UI — no external dependency
- **Minimal server setup**: One catch-all API route handles everything
