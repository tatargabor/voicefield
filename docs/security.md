# Security Model

Voicefield is designed with a "zero trust the relay" principle: audio never leaves the phone, sessions are ephemeral, and the relay server handles only text.

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Audio interception | Audio stays on phone — STT runs client-side via Soniox SDK |
| Session hijacking | 384-bit random token, Bearer auth on all phone→server calls |
| Pairing code brute-force | 6 digits, single-use, 5-minute TTL, code deleted after pairing |
| QR code replay | Secret validated on pair, session transitions to "paired" (can't re-pair) |
| Man-in-the-middle | HTTPS required for production; local mode uses LAN (no internet hop) |
| Server data retention | In-memory only, no DB, no logging of transcripts, 30-min sliding TTL |
| Soniox key exposure | Temporary keys (30-min), generated per-session, not the master API key |
| CORS bypass | Explicit origin allowlist in handler config |

## Authentication Flow

```
1. Desktop creates session → gets sessionId + pairingCode + secret
2. Phone scans QR (contains server URL + code + secret)
3. Phone POSTs /pair with code + secret
4. Server validates code + secret, returns sessionToken (384-bit)
5. Phone uses sessionToken as Bearer token for all subsequent calls
6. Desktop uses sessionId as query param for SSE stream (read-only)
```

### Why no auth on the SSE stream?

The SSE endpoint (`GET /transcript?sessionId=...`) doesn't require a Bearer token because:
- Session IDs are UUIDv4 (122 bits of entropy) — not guessable
- The stream is read-only (can't inject data)
- Adding auth would require cookies (SSE doesn't support custom headers)
- The sessionId is only known to the desktop that created it

### Why separate secret from pairing code?

The 6-digit pairing code is designed for manual entry (shown on screen, typed on phone). It's short enough to be usable but too short to be cryptographically secure. The 256-bit secret (in the QR code) ensures that QR-based pairing is secure even if someone glimpses the code.

## Cryptographic Primitives

| Value | Size | Generation | Purpose |
|-------|------|-----------|---------|
| Session ID | 128-bit | `crypto.randomUUID()` | Session lookup |
| Pairing code | ~20-bit | `crypto.randomBytes(3)` mod 1M | Human-readable pairing |
| Secret | 256-bit | `crypto.randomBytes(32).hex` | QR pairing validation |
| Session token | 384-bit | `crypto.randomBytes(48).base64url` | Phone auth (Bearer) |
| Soniox temp key | Provider-defined | Via `generateSttKey()` callback | Phone→Soniox auth |

## Session Lifecycle Security

### Creation
- No authentication required (anyone can create a session)
- Rate limiting is the consumer's responsibility (middleware)
- Session starts with 5-minute pairing TTL

### Pairing
- Code is deleted from index immediately after successful pairing → can't be reused
- Secret must match → prevents code-only attacks
- Session transitions `created → paired` → can't pair again

### Active Use
- Every phone request `touchSession()` → refreshes sliding TTL
- Hard maximum: 24 hours from creation (prevents abandoned sessions)
- Phone polls `/status` every 5s → server detects if phone disconnects (no touch)

### Expiry
- Periodic GC runs every 60 seconds
- Expired sessions: SSE clients closed, session removed from memory
- No data persists after expiry

## CORS Policy

The server handler sets CORS headers based on config:

```typescript
cors: {
  origins: ["https://voicefield.dev"]  // production
  // or ["*"] for development
}
```

The phone page (voicefield.dev or self-hosted) makes cross-origin requests to your server. Without proper CORS, the browser blocks these requests.

**Important**: Only allow origins you control. The phone page origin is either:
- `https://voicefield.dev` (hosted mode)
- Your own domain (self-hosted mode)
- `http://192.168.x.x:PORT` (local mode — use `["*"]`)

## What Voicefield Does NOT Protect Against

- **Compromised phone**: If the phone browser is compromised, the attacker has access to the microphone regardless
- **Network sniffing on HTTP**: Local mode uses HTTP over LAN — use WPA2/3 WiFi or a tunnel
- **Server memory dumps**: Transcripts pass through server memory briefly — if the server process is compromised, in-flight text could be captured
- **Soniox cloud processing**: Audio is sent from the phone to Soniox's cloud for STT — this is the same as using any cloud STT service

## Recommendations for Production

1. **Always use HTTPS** — via your domain's certificate (Let's Encrypt, Cloudflare, etc.)
2. **Set explicit CORS origins** — never use `["*"]` in production
3. **Rate-limit session creation** — prevent abuse (add middleware before the handler)
4. **Monitor session count** — memory usage grows with concurrent sessions
5. **Rotate Soniox API key** periodically — limit blast radius if leaked
6. **Use CSP headers** — restrict what the phone page can load
