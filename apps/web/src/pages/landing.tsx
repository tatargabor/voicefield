export function Landing() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
        Voice-enable<br />
        <span style={{ color: "#2563eb" }}>any web field.</span>
      </h1>

      <p style={{ fontSize: 20, color: "#555", marginBottom: 40, maxWidth: 520 }}>
        Turn your phone into a microphone for any web application.
        Scan a QR code, speak, text appears. Open source.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 60 }}>
        <a
          href="https://github.com/tatargabor/voicefield"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#111",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          GitHub
        </a>
        <a
          href="#quickstart"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "#f3f4f6",
            color: "#111",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Quick Start
        </a>
      </div>

      <section id="how-it-works" style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[
            { step: "1", title: "Install", desc: "Add @voicefield/react and @voicefield/server to your project" },
            { step: "2", title: "Mount", desc: "Add the catch-all API route and the React hook to your component" },
            { step: "3", title: "Scan", desc: "User scans QR with phone — phone becomes the microphone" },
            { step: "4", title: "Speak", desc: "Speech-to-text runs on the phone, text streams to your field in real time" },
          ].map((item) => (
            <div key={item.step} style={{ padding: 20, background: "#f9fafb", borderRadius: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb", marginBottom: 8 }}>{item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#666" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="quickstart" style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Quick Start</h2>

        <pre style={{ background: "#1e1e1e", color: "#d4d4d4", padding: 20, borderRadius: 12, overflow: "auto", fontSize: 14, lineHeight: 1.6 }}>
{`# Install
npm install @voicefield/react @voicefield/server

# 1. Add API route (Next.js App Router)
# app/api/voice/[...voicefield]/route.ts
import { createVoicefieldHandler } from '@voicefield/server'
import { SonioxNodeClient } from '@soniox/node'

const soniox = new SonioxNodeClient({ api_key: process.env.SONIOX_API_KEY! })

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 1800,
      single_use: false,
    })
    return {
      temporaryApiKey: result.api_key,
      expiresAt: Date.now() + 1800_000,
    }
  },
  cors: { origins: ['https://voicefield.dev'] },
})
export { GET, POST, OPTIONS }

# 2. Use in your component
import { useVoicefield, QRPopup } from '@voicefield/react'

function MyComponent() {
  const vf = useVoicefield({
    serverUrl: '/api/voice',
    language: 'en',
  })

  vf.register('myfield', 'My Input', inputRef)

  return (
    <>
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
}`}
        </pre>
      </section>

      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Architecture</h2>
        <pre style={{ background: "#f9fafb", padding: 20, borderRadius: 12, overflow: "auto", fontSize: 13, lineHeight: 1.5 }}>
{`┌────────────────────┐
│  voicefield.dev    │  Static SPA — phone UI + this landing page
│  (no data stored)  │  Source: github.com/tatargabor/voicefield
└────────┬───────────┘
         │ loads phone page
         ▼
┌────────────────────┐         ┌──────────────────────┐
│  Phone browser     │  POST   │  Your server         │
│  Soniox STT runs   │────────▶│  @voicefield/server  │
│  here (client-side)│         │  (relay only)        │
└────────────────────┘         └──────────┬───────────┘
                                          │ SSE
                                          ▼
                               ┌──────────────────────┐
                               │  Desktop browser     │
                               │  @voicefield/react   │
                               │  useVoicefield()     │
                               └──────────────────────┘`}
        </pre>
      </section>

      <footer style={{ borderTop: "1px solid #eee", paddingTop: 24, color: "#999", fontSize: 14 }}>
        <p>
          MIT License &middot;{" "}
          <a href="https://github.com/tatargabor/voicefield" style={{ color: "#2563eb" }}>
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
