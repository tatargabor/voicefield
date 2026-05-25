import { useState, useEffect, useCallback } from "react"

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light"
    const stored = localStorage.getItem("vf-theme")
    if (stored === "dark" || stored === "light") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("vf-theme", theme)
  }, [theme])

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  )

  return { theme, toggle }
}

function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark"
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="theme-toggle"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      data-testid="theme-toggle"
    >
      {theme === "dark" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])

  return (
    <button
      onClick={copy}
      className="copy-btn"
      aria-label="Copy to clipboard"
      data-testid="copy-button"
    >
      {copied ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  )
}

const INSTALL_CMD = "npm install @voicefield/react @voicefield/server"

const CODE_STEP_1 = `import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["https://voicefield.dev"] },
})

export { GET, POST, OPTIONS }`

const CODE_STEP_2 = `"use client"
export { Mic as default } from "@voicefield/react/phone"`

const CODE_STEP_3 = `import { useVoicefield, QRPopup } from "@voicefield/react"
import { useRef } from "react"

export function VoiceInput() {
  const ref = useRef<HTMLInputElement>(null)
  const vf = useVoicefield({
    serverUrl: "/api/voice",
    language: "en",
  })

  vf.register("search", "Search", ref)

  return (
    <>
      <input ref={ref} placeholder="Search..." />
      <button onClick={() => vf.showQR()}>
        Voice Input
      </button>
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
}`

const CODE_SONIOX = `const soniox = new SonioxNodeClient({
  api_key: process.env.SONIOX_API_KEY!
})

createVoicefieldHandler({
  generateSttKey: async () => {
    const key = await soniox.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: key.api_key,
             expiresAt: Date.now() + 1800_000 }
  },
})`

export function Landing() {
  const { theme, toggle } = useTheme()

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            <svg
              className="nav-logo-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            voicefield
          </a>
          <div className="nav-links">
            <a href="#setup">Docs</a>
            <a
              href="https://github.com/tatargabor/voicefield"
              className="nav-github"
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>
            Voice input for any text field.
            <br />
            <span className="hero-dim">A React hook. That&apos;s it.</span>
          </h1>
          <p className="hero-sub">
            There are STT APIs. There are speech platforms. There are whole
            products. But if you just want to add voice input to a text field
            in your React app — something you can npm&nbsp;install and wire up
            in an afternoon — that didn&apos;t exist. So I built it.
          </p>
          <p className="hero-sub-2">
            One hook. Your user&apos;s phone becomes the mic. Speech
            recognition runs on the phone, only text reaches your server.
            No API key needed to start.
          </p>
          <div className="hero-install">
            <code>{INSTALL_CMD}</code>
            <CopyButton text={INSTALL_CMD} />
          </div>
          <div className="hero-actions">
            <a href="#setup" className="btn-primary">
              Set it up
            </a>
            <a
              href="https://github.com/tatargabor/voicefield"
              className="btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="flow" id="how">
        <div className="container">
          <h2>Phone scans QR. You talk. Text appears.</h2>
          <p className="section-sub">
            Speech recognition runs on the phone — your server is a relay
            that only ever sees text. No audio leaves the device.
          </p>
          <div className="flow-scene">
            <div className="flow-device">
              <span className="flow-label">Phone</span>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <img
                    src="/demo/phone-1.webp"
                    alt="Phone scanning QR code"
                    className="flow-img flow-img-1"
                  />
                  <img
                    src="/demo/phone-2.webp"
                    alt="Phone recording voice"
                    className="flow-img flow-img-2"
                  />
                  <img
                    src="/demo/phone-3.webp"
                    alt="Phone multi-field mode"
                    className="flow-img flow-img-3"
                  />
                </div>
              </div>
            </div>
            <div className="flow-connector">
              <div className="flow-line" />
              <div className="flow-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Text only</span>
              </div>
              <div className="flow-line" />
            </div>
            <div className="flow-device">
              <span className="flow-label">Desktop</span>
              <div className="desktop">
                <div className="desktop-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="desktop-screen">
                  <img
                    src="/demo/desktop-1.webp"
                    alt="Desktop QR pairing"
                    className="flow-img flow-img-1"
                  />
                  <img
                    src="/demo/desktop-2.webp"
                    alt="Desktop voice message"
                    className="flow-img flow-img-2"
                  />
                  <img
                    src="/demo/desktop-3.webp"
                    alt="Desktop form filled"
                    className="flow-img flow-img-3"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flow-steps">
            <span className="flow-step flow-step-1">1. Scan QR</span>
            <span className="flow-step flow-step-2">2. Speak</span>
            <span className="flow-step flow-step-3">3. Text appears</span>
          </div>
          <div className="privacy-callout">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p>
              <strong>Audio never leaves the phone.</strong> Speech recognition
              runs entirely in the phone&apos;s browser. Your server only relays
              text — no audio is ever transmitted, stored, or logged.
            </p>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="transform">
        <div className="container">
          <div className="transform-grid">
            <div className="transform-col">
              <span className="transform-label">Before</span>
              <pre>{`<textarea
  placeholder="Ask anything..."
/>`}</pre>
            </div>
            <div className="transform-arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div className="transform-col transform-after">
              <span className="transform-label">After</span>
              <pre>{`const ref = useRef(null)
const vf = useVoicefield()
vf.register("prompt", "Prompt", ref)

<textarea
  ref={ref}
  placeholder="Ask anything..."
/>`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="start" id="setup">
        <div className="container">
          <h2>Three files. That&apos;s the whole integration.</h2>
          <div className="start-install">
            <code>{INSTALL_CMD}</code>
            <CopyButton text={INSTALL_CMD} />
          </div>
          <p className="start-note">
            Works immediately with the browser&apos;s built-in speech
            recognition. No API key, no vendor account.
          </p>
          <div className="start-steps">
            <div className="start-step">
              <div className="start-step-header">
                <span className="start-step-num">1</span>
                <span className="start-step-title">API Route</span>
                <span className="start-step-file">
                  app/api/voice/[...voicefield]/route.ts
                </span>
              </div>
              <div className="code-block">
                <CopyButton text={CODE_STEP_1} />
                <pre>{CODE_STEP_1}</pre>
              </div>
            </div>
            <div className="start-step">
              <div className="start-step-header">
                <span className="start-step-num">2</span>
                <span className="start-step-title">Phone Page</span>
                <span className="start-step-file">app/mic/page.tsx</span>
              </div>
              <div className="code-block">
                <CopyButton text={CODE_STEP_2} />
                <pre>{CODE_STEP_2}</pre>
              </div>
            </div>
            <div className="start-step">
              <div className="start-step-header">
                <span className="start-step-num">3</span>
                <span className="start-step-title">Your Component</span>
                <span className="start-step-file">components/voice-input.tsx</span>
              </div>
              <div className="code-block">
                <CopyButton text={CODE_STEP_3} />
                <pre>{CODE_STEP_3}</pre>
              </div>
            </div>
          </div>
          <div className="start-upgrade">
            <strong>Want better accuracy?</strong> Add{" "}
            <a href="https://soniox.com">Soniox</a> or any cloud STT provider.
            Configure <code>generateSttKey</code> in your API route — the phone
            switches automatically:
            <div className="code-block">
              <CopyButton text={CODE_SONIOX} />
              <pre>{CODE_SONIOX}</pre>
            </div>
          </div>
          <p className="browser-note">
            Web Speech API works in Chrome, Edge, and Safari.
            Firefox needs a cloud provider like Soniox.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span>voicefield</span>
          </div>
          <div className="footer-links">
            <a href="https://github.com/tatargabor/voicefield">GitHub</a>
            <a href="https://npmjs.com/package/@voicefield/react">npm</a>
            <a href="https://github.com/tatargabor/voicefield/tree/main/docs">
              Docs
            </a>
          </div>
          <span className="footer-copy">MIT</span>
        </div>
      </footer>
    </div>
  )
}
