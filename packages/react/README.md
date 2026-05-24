# @voicefield/react

React hook and components for adding voice input to any web field. Scan a QR code with your phone, speak, and text appears in your desktop browser.

## Install

```bash
npm install @voicefield/react @voicefield/server @soniox/node
```

Peer dependencies: `react >= 18`, `react-dom >= 18`, `@soniox/client >= 2.0` (optional, only needed if self-hosting the phone page).

## Quick Start

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
      <button onClick={() => vf.showQR()}>🎤</button>
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

## API Reference

### `useVoicefield(config)`

The main hook. Creates and manages a voice session.

#### Config

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `serverUrl` | `string` | Yes | Path to your Voicefield API route (e.g., `/api/voice`) |
| `language` | `string \| string[]` | Yes | STT language(s) — e.g., `"en"`, `"hu"`, `["en", "hu"]` |
| `phoneUrl` | `string` | No | Phone page URL. Default: `https://voicefield.dev`. Set to `""` for local mode |
| `externalServerUrl` | `string` | No | Public URL the phone uses to reach your server (for tunnels/production) |

#### Return value

| Property | Type | Description |
|----------|------|-------------|
| `sessionId` | `string \| null` | Current session ID |
| `pairingCode` | `string \| null` | 6-digit code for manual pairing |
| `secret` | `string \| null` | Session secret (included in QR) |
| `sessionState` | `SessionState \| "disconnected" \| null` | Current session state |
| `isPaired` | `boolean` | True when phone is connected |
| `isRecording` | `boolean` | True when phone is actively recording |
| `isQRVisible` | `boolean` | QR popup visibility state |
| `fields` | `VoiceField[]` | Registered voice fields |
| `activeFieldId` | `string \| null` | Currently active field |
| `serverUrl` | `string` | Resolved external server URL |
| `phoneUrl` | `string` | Resolved phone page URL |

| Method | Description |
|--------|-------------|
| `showQR()` | Show the QR pairing popup (creates session if needed) |
| `hideQR()` | Hide the QR popup |
| `endSession()` | End the current voice session |
| `switchField(fieldId)` | Switch the active voice target field |
| `register(id, label, element?, setterFn?)` | Register a field for voice input |
| `unregister(id)` | Remove a registered field |

### `register(id, label, element?, setterFn?)`

Register a field that can receive voice input.

```tsx
// Option A: DOM element — voicefield sets .value directly
const inputRef = useRef<HTMLInputElement>(null)
vf.register("email", "Email", inputRef.current)

// Option B: Setter function — for controlled inputs or custom behavior
const [text, setText] = useState("")
vf.register("notes", "Notes", null, (value, isFinal) => {
  if (isFinal) {
    setText(prev => prev + (prev ? " " : "") + value)
  }
})
```

### `<QRPopup />`

Renders a modal overlay with the QR code and manual pairing code.

```tsx
<QRPopup
  pairingCode={vf.pairingCode}
  secret={vf.secret}
  serverUrl={vf.serverUrl}
  phoneUrl={vf.phoneUrl}
  isVisible={vf.isQRVisible}
  onClose={vf.hideQR}
  className="my-custom-overlay"  // optional: override default styles
/>
```

### Phone Page (`@voicefield/react/phone`)

Mount the phone microphone page in your own app for local development (no tunnel needed):

```tsx
// app/mic/page.tsx
"use client"
export { Mic as default } from "@voicefield/react/phone"
```

This renders the full phone UI (code entry → pairing → recording → transcript). When accessed via QR scan, the `?server=...&code=...&secret=...` params auto-pair.

## Multi-field Usage

Register multiple fields and let the phone switch between them:

```tsx
function ContactForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const vf = useVoicefield({ serverUrl: "/api/voice", language: "en" })

  vf.register("name", "Name", nameRef)
  vf.register("email", "Email", emailRef)
  vf.register("message", "Message", messageRef)

  return (
    <form>
      <input ref={nameRef} placeholder="Name" onFocus={() => vf.switchField("name")} />
      <input ref={emailRef} placeholder="Email" onFocus={() => vf.switchField("email")} />
      <textarea ref={messageRef} placeholder="Message" onFocus={() => vf.switchField("message")} />
      <button type="button" onClick={() => vf.showQR()}>🎤 Voice Input</button>
      <QRPopup {...vf} isVisible={vf.isQRVisible} onClose={vf.hideQR} />
    </form>
  )
}
```

The phone UI shows a field selector dropdown — the user can switch which field receives dictation.

## Deployment Modes

| Mode | `phoneUrl` | `externalServerUrl` | When to use |
|------|-----------|--------------------:|-------------|
| Local (LAN) | `""` | Auto-detected | Development — phone on same WiFi |
| Hosted | (default) | Your public URL | Production with voicefield.dev |
| Self-hosted | Your domain | Your domain | Enterprise / full control |

See the [deployment guide](../../docs/deployment.md) for detailed setup instructions.

## License

MIT
