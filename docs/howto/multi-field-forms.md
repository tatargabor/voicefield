# How to: Multi-Field Voice Forms

Add voice input to forms with multiple fields. The phone shows a field selector so users can switch which field receives dictation.

## Register multiple fields

```tsx
"use client"

import { useRef } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

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

      <button type="button" onClick={() => vf.showQR()}>Voice Input</button>

      <QRPopup
        pairingCode={vf.pairingCode}
        secret={vf.secret}
        serverUrl={vf.serverUrl}
        phoneUrl={vf.phoneUrl}
        isVisible={vf.isQRVisible}
        onClose={vf.hideQR}
      />
    </form>
  )
}
```

## How field switching works

1. Desktop calls `vf.switchField("email")` — sends a command to the server
2. Phone polls for commands every 5 seconds — picks up the field switch
3. Phone UI updates to show the active field
4. Next dictation goes to the "email" field

The `onFocus` handler keeps the active field in sync with keyboard focus.

## Phone-side field switching

The phone UI also shows a dropdown of all registered fields. Users can switch fields directly on the phone without touching the desktop.

## Dynamic field registration

Fields can be registered and unregistered dynamically:

```tsx
useEffect(() => {
  vf.register("address", "Address", addressRef)
  return () => vf.unregister("address")
}, [])
```

The phone's field list updates automatically after the next poll cycle.
