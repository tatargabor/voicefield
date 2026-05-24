# Deployment Guide

## Deployment Modes

| Mode | Phone page | Server | HTTPS | Setup | Best for |
|------|-----------|--------|-------|-------|----------|
| Local (LAN) | Your server `/mic` | localhost | Not needed | Zero config | Development |
| ngrok | voicefield.dev | ngrok tunnel | Automatic | 1 command + env var | Dev with real phone |
| mkcert | Your server `/mic` | localhost HTTPS | Manual cert | mkcert + phone CA | Offline dev |
| Hosted | voicefield.dev | Your production domain | Let's Encrypt | DNS + deploy | Production |
| Self-hosted | Your domain | Your domain | Let's Encrypt | Deploy both | Enterprise |

## Local Development (LAN)

The simplest mode. Phone and desktop are on the same WiFi network.

### Setup

1. Mount the phone page in your app:

```tsx
// app/mic/page.tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

2. Configure for local mode:

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  phoneUrl: "",        // empty string = local mode
  language: "en",
})
```

3. Start your dev server:

```bash
npm run dev
```

The QR code will point to `http://192.168.x.x:3000/mic` — your phone connects directly over LAN.

### How it works

- The `/api/voice/network-info` endpoint detects your LAN IP
- The QR encodes `http://{LAN_IP}:{PORT}/mic?server=http://{LAN_IP}:{PORT}/api/voice&code=...&secret=...`
- Phone accesses your dev server directly — no tunnel needed

### Limitations

- `getUserMedia` works on localhost without HTTPS, but **only on the same device**
- On a real phone connecting via LAN IP, Chrome/Safari **require HTTPS** for `getUserMedia`
- Solution: use ngrok or mkcert (see below)

## ngrok (Recommended for Development)

ngrok gives you a public HTTPS URL that tunnels to your local server. The phone gets HTTPS (needed for microphone access) without certificate setup.

### Setup

1. Install ngrok: https://ngrok.com/download

2. Start your dev server:

```bash
# Next.js 16+: use 127.0.0.1 (not 0.0.0.0)
npm run dev -- --hostname 127.0.0.1
```

3. Start ngrok in another terminal:

```bash
ngrok http 3000
```

4. Set the environment variable:

```env
NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL=https://abc123.ngrok-free.app/api/voice
```

5. Or pass it directly:

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  externalServerUrl: "https://abc123.ngrok-free.app/api/voice",
  language: "en",
})
```

### Important: Next.js 16 hostname

Next.js 16 has strict host header validation. Use `--hostname 127.0.0.1`:

```bash
next dev --hostname 127.0.0.1
```

With `0.0.0.0`, cloudflared (Cloudflare Tunnel) fails host validation. ngrok works with `127.0.0.1`.

### CORS for ngrok

Add your ngrok domain to CORS:

```typescript
const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSttKey: async () => { /* ... */ },
  cors: {
    origins: ["https://voicefield.dev", "https://abc123.ngrok-free.app"],
  },
})
```

## mkcert (Offline Development)

For development without internet access (airplane, restricted network).

### Setup

1. Install mkcert:

```bash
# macOS
brew install mkcert
mkcert -install

# Linux
sudo apt install mkcert
mkcert -install
```

2. Create certificates for your LAN IP:

```bash
mkcert 192.168.1.50 localhost
# Creates: 192.168.1.50+1.pem and 192.168.1.50+1-key.pem
```

3. Run your dev server with HTTPS (e.g., via a local proxy):

```bash
# Option A: local-ssl-proxy
npx local-ssl-proxy --source 3001 --target 3000 \
  --cert 192.168.1.50+1.pem --key 192.168.1.50+1-key.pem
```

4. **Install the CA on your phone:**
   - Copy `~/Library/Application Support/mkcert/rootCA.pem` (macOS) or `~/.local/share/mkcert/rootCA.pem` (Linux) to your phone
   - iOS: Settings → General → VPN & Device Management → Install Profile → then Settings → General → About → Certificate Trust Settings → enable
   - Android: Settings → Security → Install certificate → CA certificate

5. Configure:

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  phoneUrl: "",
  externalServerUrl: "https://192.168.1.50:3001/api/voice",
  language: "en",
})
```

## Production (Hosted Phone Page)

Use voicefield.dev to serve the phone page. Your server handles everything else.

### Setup

1. Deploy your app (Vercel, Railway, Fly.io, etc.)

2. Set environment variable:

```env
SONIOX_API_KEY=your-key-here
```

3. Configure CORS:

```typescript
const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSttKey: async () => { /* ... */ },
  cors: {
    origins: ["https://voicefield.dev"],
  },
})
```

4. Use default settings (phoneUrl defaults to voicefield.dev):

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  language: "en",
})
```

The phone loads `https://voicefield.dev/mic?server=https://yourapp.com/api/voice&code=...` — voicefield.dev serves the JS, your server handles all API calls.

## Self-Hosted (Enterprise)

Deploy both the phone page and relay on your own infrastructure.

### Phone page deployment

The phone page is a static SPA in `apps/web/`. Deploy it anywhere static:

```bash
cd apps/web
npm run build
# Deploy dist/ to Cloudflare Pages, Vercel, S3+CloudFront, GitHub Pages, etc.
```

### Configuration

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  phoneUrl: "https://voice.yourcompany.com",
  language: "en",
})
```

```typescript
// Server CORS
cors: {
  origins: ["https://voice.yourcompany.com"],
}
```

### Benefits

- No dependency on voicefield.dev
- Full control over phone page code
- Can customize phone UI
- Can pin specific versions

## Multiple Dev Servers

**Warning**: Running multiple Next.js dev servers simultaneously causes CPU spikes (Turbopack watcher loop). If you need multiple servers:

- Use different ports
- Consider running only the one you're actively testing
- Or use `next build && next start` for the stable one

## Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `SONIOX_API_KEY` | Server | Your Soniox API key |
| `NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL` | Client | Public URL the phone uses to reach your server |

## Checklist

- [ ] `SONIOX_API_KEY` set in environment
- [ ] Catch-all API route created (`app/api/voice/[...voicefield]/route.ts`)
- [ ] CORS origins configured (include phone page origin)
- [ ] Phone can reach your server URL (HTTPS in production, ngrok for dev)
- [ ] Phone page mounted or voicefield.dev used as default
