# Voicefield Example App

Minimal Next.js app demonstrating `@voicefield/react` + `@voicefield/server`.

Two fields (title + body) with voice input. Pair your phone via QR code, speak, and text appears in real-time.

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
├── page.tsx                          ← Homepage with voice demo
├── components/voice-demo.tsx         ← Client component using useVoicefield
├── api/voice/[...voicefield]/route.ts ← Server handler (3 lines of setup)
├── mic/page.tsx                      ← Phone page (1 line)
└── layout.tsx                        ← Root layout
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
