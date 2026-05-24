# Troubleshooting

## Microphone Errors

### "Microphone blocked" / "NotAllowedError"

**Cause**: Browser denied microphone access.

**Fix**:
- **Desktop Chrome**: Click lock icon in URL bar → Site settings → Microphone → Allow
- **iOS Safari**: Settings → Safari → Microphone → Allow
- **Android Chrome**: Tap lock icon → Permissions → Microphone → Allow
- If previously denied, you may need to reset site permissions

### "getUserMedia is not a function" / "mediaDevices is undefined"

**Cause**: Page is not served over HTTPS (or localhost).

**Fix**: `getUserMedia` requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security):
- `https://` — always works
- `http://localhost` — works (browser exception)
- `http://192.168.x.x` — **does NOT work**

For development with a real phone, use ngrok (automatic HTTPS) or mkcert (manual HTTPS). See [deployment guide](./deployment.md).

### iOS: "Microphone disabled" after allowing

**Cause**: iOS has a global browser microphone toggle separate from per-site permissions.

**Fix**: Settings → [Your Browser] → Microphone → toggle ON

## Connection Issues

### QR code scanned but phone shows "No server URL"

**Cause**: The QR URL's `server` parameter is empty or unreachable.

**Fix**:
1. Check that your dev server is running
2. Check that the phone can reach the server (same WiFi for LAN mode)
3. If using ngrok, ensure `NEXT_PUBLIC_VOICEFIELD_EXTERNAL_URL` or `externalServerUrl` is set
4. Try opening the server URL directly on the phone browser

### Phone paired but no text appears on desktop

**Cause**: SSE connection failed or is blocked.

**Debug**:
1. Open desktop browser DevTools → Network tab → filter by "EventStream"
2. Check if the SSE connection to `/api/voice/transcript?sessionId=...` is active
3. If not connected: check for proxy/firewall blocking SSE
4. If connected but no events: check phone is actually recording (see phone screen)

### "Code expired or invalid" on phone

**Cause**: Pairing code expired (5-minute TTL) or session was already paired.

**Fix**:
- Close the QR popup and reopen it (creates a new session)
- If the code shows but pairing fails, check the server URL is correct

### CORS error in phone browser console

**Cause**: Your server's CORS config doesn't include the phone page origin.

**Fix**: Add the phone page origin to your handler config:

```typescript
cors: {
  origins: [
    "https://voicefield.dev",          // if using hosted mode
    "http://192.168.1.50:3000",         // if using local mode
    "https://your-ngrok-url.ngrok.app", // if using ngrok
  ],
}
```

## Development Issues

### Next.js 16: "Invalid host header" with cloudflared

**Cause**: Next.js 16 validates the Host header. Cloudflare Tunnel sends the tunnel hostname which doesn't match.

**Fix**: Use ngrok instead, or start with `--hostname 127.0.0.1`:

```bash
next dev --hostname 127.0.0.1
```

ngrok works with this setting; cloudflared does not.

### CPU 100% with multiple Next.js dev servers

**Cause**: Turbopack file watcher creates a feedback loop when multiple Next.js instances watch overlapping directories.

**Fix**:
- Run only one dev server at a time
- Or use `next build && next start` for the stable one
- Or separate them into different directories (they're already in different workspaces)

### `pnpm publish` vs `npm publish`

**Cause**: The monorepo uses `workspace:^` protocol for inter-package dependencies. `npm publish` doesn't resolve these.

**Fix**: Always use `pnpm publish` from the package directory:

```bash
cd packages/core && pnpm publish --access public
cd packages/react && pnpm publish --access public
cd packages/server && pnpm publish --access public
```

pnpm automatically converts `workspace:^` → actual version numbers during publish.

### Build fails with "Cannot find module @voicefield/core"

**Cause**: Packages not built in the right order.

**Fix**:

```bash
pnpm build  # turbo handles dependency order (core → react/server)
```

Or build manually in order:

```bash
cd packages/core && pnpm build
cd packages/react && pnpm build
cd packages/server && pnpm build
```

## Session & State Issues

### Session expires too quickly

**Cause**: 30-minute sliding TTL with no activity. If the phone isn't recording, no `touchSession()` calls happen.

**Behavior**: The phone polls `/status` every 5 seconds, but this doesn't count as "activity" (by design). Activity = recording or sending transcripts.

**If this is a problem**: The session is designed for active voice input sessions, not persistent connections. For long-idle use cases, have the user re-pair when needed (QR scan is fast).

### Transcript appears in wrong field

**Cause**: The active field on the phone is out of sync with the desktop.

**Fix**: Call `vf.switchField(fieldId)` on the desktop when the user focuses a different input. This sends a command to the phone.

### Phone shows "Session expired" during use

**Cause**: Either:
- 30 minutes of no recording activity
- 24-hour hard session limit reached
- Server restarted (in-memory sessions are lost)

**Fix**: Re-pair by scanning the QR code again.

## Vercel / Serverless Deployment

### SSE doesn't work on Vercel

**Cause**: Vercel's serverless functions have a response timeout (10s on Hobby, 60s on Pro). SSE requires a long-lived connection.

**Workaround options**:
1. Deploy on a platform with persistent connections (Railway, Fly.io, Render, self-hosted)
2. Use Vercel's Edge Runtime (longer timeout, but still limited)
3. Switch to a polling-based approach for desktop (loses real-time feel)

**Recommended**: Use Railway or Fly.io for the backend, Vercel for the frontend only.

### Sessions lost on redeploy

**Cause**: Sessions are in-memory. When the server restarts, all sessions are gone.

**Impact**: Active users will see "Session expired" and need to re-pair.

**Mitigation**: This is by design (privacy). For production, use a platform with rolling deploys that don't kill all instances simultaneously.
