# How to: Self-Host the Phone Page

By default, phones load the mic page from voicefield.dev. To host it yourself (for enterprise, privacy, or customization):

## Option A: Use the built-in SPA

The `apps/web/` directory builds a static SPA that includes the phone page.

```bash
cd apps/web
pnpm build
# Deploy dist/ to any static hosting:
# Cloudflare Pages, Vercel, S3+CloudFront, GitHub Pages, Nginx, etc.
```

## Option B: Mount in your Next.js app

Add a single-line phone page to your existing app:

```tsx
// app/mic/page.tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

This serves the phone UI from your own domain — no external dependency.

## Configure the desktop to use your phone page

```tsx
const vf = useVoicefield({
  serverUrl: "/api/voice",
  phoneUrl: "https://voice.yourcompany.com",  // your hosted phone page
  language: "en",
})
```

The QR code will point to `https://voice.yourcompany.com/mic?server=...`.

## Update CORS

Your server must allow the phone page origin:

```typescript
const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => { /* ... */ },
  cors: {
    origins: ["https://voice.yourcompany.com"],
  },
})
```

## Benefits of self-hosting

- No dependency on voicefield.dev
- Full control over the phone page code
- Can customize the phone UI
- Can pin specific package versions
- Meets enterprise security requirements

## Trade-offs

- You must keep the phone page updated with new releases
- You need HTTPS on your domain (required for microphone access)
- You maintain the static hosting infrastructure
