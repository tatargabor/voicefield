# How to: Voice Input with Controlled Inputs

When you manage input state with React `useState` (controlled inputs), use the setter function pattern instead of a DOM ref.

## The problem

With controlled inputs, setting `.value` on the DOM element doesn't trigger React's state update. The UI won't reflect the voice input.

## The solution: setter function

Pass a setter function as the 4th argument to `register`:

```tsx
"use client"

import { useState } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

function ChatInput() {
  const [message, setMessage] = useState("")

  const vf = useVoicefield({ serverUrl: "/api/voice", language: "en" })

  vf.register("message", "Message", null, (value, isFinal) => {
    if (isFinal) {
      setMessage((prev) => prev + (prev ? " " : "") + value)
    }
  })

  return (
    <>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type or speak..."
      />
      <button onClick={() => vf.showQR()}>Mic</button>
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

## Partial vs final text

The setter receives two arguments:
- `value` — the recognized text
- `isFinal` — `true` when the recognizer is confident, `false` for interim results

Common patterns:

```tsx
// Append only final text (most common)
vf.register("notes", "Notes", null, (value, isFinal) => {
  if (isFinal) setText((prev) => prev + " " + value)
})

// Show partial text as preview
vf.register("notes", "Notes", null, (value, isFinal) => {
  if (isFinal) {
    setFinalText((prev) => prev + " " + value)
    setPartial("")
  } else {
    setPartial(value)
  }
})
```

## When to use which pattern

| Pattern | When to use |
|---------|------------|
| DOM ref (`register("id", "Label", ref)`) | Uncontrolled inputs, simple forms |
| Setter function (`register("id", "Label", null, fn)`) | Controlled inputs, React state, custom logic |
