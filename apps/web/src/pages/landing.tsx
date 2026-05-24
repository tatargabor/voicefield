export function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            <svg
              className="nav-logo-icon"
              width="24"
              height="24"
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
            <a href="#how">How it works</a>
            <a href="#start">Quick Start</a>
            <a
              href="https://github.com/tatargabor/voicefield"
              className="nav-github"
              aria-label="GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Star
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128L1440,320L0,320Z" />
          </svg>
        </div>
        <div className="container hero-content">
          <h1>
            Browser STT, phone mics, QR pairing —<br />
            <span className="hero-accent">all proven. Now wired together.</span>
          </h1>
          <p className="hero-sub">
            Voice input for any web field, powered by the user's phone. Drop in a React hook — works
            even on remote desktops and VMs where there's no mic.
          </p>
          <div className="hero-actions">
            <a href="#start" className="btn-primary">
              Get Started
            </a>
            <a href="https://github.com/tatargabor/voicefield" className="btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Demo — real screenshots cycling through 3 states */}
      <section className="demo">
        <div className="container">
          <div className="demo-scene">
            <div className="demo-side">
              <span className="demo-label">Phone</span>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <img src="/demo/phone-1.webp" alt="Phone: enter pairing code" className="demo-img demo-img-1" />
                  <img src="/demo/phone-2.webp" alt="Phone: recording voice" className="demo-img demo-img-2" />
                  <img src="/demo/phone-3.webp" alt="Phone: multi-field mode" className="demo-img demo-img-3" />
                </div>
              </div>
            </div>

            <div className="connector">
              <div className="connector-line" />
              <span>text only</span>
              <div className="connector-line" />
            </div>

            <div className="demo-side">
              <span className="demo-label">Desktop</span>
              <div className="desktop">
                <div className="desktop-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="desktop-screen">
                  <img src="/demo/desktop-1.webp" alt="Desktop: QR pairing dialog" className="demo-img demo-img-1" />
                  <img src="/demo/desktop-2.webp" alt="Desktop: voice message received" className="demo-img demo-img-2" />
                  <img src="/demo/desktop-3.webp" alt="Desktop: form fields filled" className="demo-img demo-img-3" />
                </div>
              </div>
            </div>
          </div>
          <div className="demo-steps">
            <span className="demo-step demo-step-1">1. Scan QR code</span>
            <span className="demo-step demo-step-2">2. Speak into phone</span>
            <span className="demo-step demo-step-3">3. Text fills the form</span>
          </div>
        </div>
      </section>

      {/* What / Why — plain text, no cards */}
      <section className="traits" id="how">
        <div className="container">
          <ul className="trait-list">
            <li>
              <strong>No audio leaves the phone.</strong> STT runs client-side — your server only
              sees text.
            </li>
            <li>
              <strong>3 files to integrate.</strong> One API route, one phone page, one hook. That's
              it.
            </li>
            <li>
              <strong>Works out of the box.</strong> Uses the browser's built-in speech recognition
              — no API key needed. Upgrade to Soniox or bring your own STT for higher accuracy.
            </li>
            <li>
              <strong>In-memory sessions.</strong> No database, no logs, 30-min TTL. Nothing
              persists.
            </li>
            <li>
              <strong>Works where desktop mic can't.</strong> Remote desktop, VMs, thin clients,
              servers — no mic available. Your phone always has one.
            </li>
            <li>
              <strong>Real-time partial results.</strong> Text appears word-by-word as you speak.
            </li>
          </ul>
        </div>
      </section>

      {/* Quick Start */}
      <section className="start" id="start">
        <div className="container">
          <h2>Quick Start</h2>
          <div className="install-line">
            <code>npm install @voicefield/react @voicefield/server</code>
          </div>
          <p className="install-note">
            No API key needed — works immediately with the browser's built-in speech recognition.
          </p>
          <div className="code-steps">
            <div className="code-step">
              <div className="code-header">
                <span className="code-num">1</span>
                <span className="code-title">API Route</span>
                <span className="code-file">app/api/voice/[...voicefield]/route.ts</span>
              </div>
              <pre>{`import { createVoicefieldHandler } from '@voicefield/server'

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ['https://voicefield.dev'] },
})

export { GET, POST, OPTIONS }`}</pre>
            </div>
            <div className="code-step">
              <div className="code-header">
                <span className="code-num">2</span>
                <span className="code-title">Phone Page</span>
                <span className="code-file">app/mic/page.tsx</span>
              </div>
              <pre>{`"use client"
export { Mic as default } from "@voicefield/react/phone"`}</pre>
            </div>
            <div className="code-step">
              <div className="code-header">
                <span className="code-num">3</span>
                <span className="code-title">Your Component</span>
                <span className="code-file">components/my-input.tsx</span>
              </div>
              <pre>{`import { useVoicefield, QRPopup } from '@voicefield/react'
import { useRef } from 'react'

export function VoiceInput() {
  const ref = useRef<HTMLInputElement>(null)
  const vf = useVoicefield({
    serverUrl: '/api/voice',
    language: 'en',
  })

  vf.register('search', 'Search', ref)

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
}`}</pre>
            </div>
          </div>
          <div className="upgrade-note">
            <strong>Want higher accuracy?</strong> Add{" "}
            <a href="https://soniox.com">Soniox</a> — just configure{" "}
            <code>generateSttKey</code> in your API route:
            <pre>{`import { SonioxNodeClient } from '@soniox/node'

const soniox = new SonioxNodeClient({
  api_key: process.env.SONIOX_API_KEY!
})

createVoicefieldHandler({
  generateSttKey: async () => {
    const result = await soniox.auth.createTemporaryKey({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 1800,
    })
    return {
      temporaryApiKey: result.api_key,
      expiresAt: Date.now() + 1800_000,
    }
  },
})`}</pre>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="packages">
        <div className="container">
          <div className="pkg-grid">
            <a href="https://npmjs.com/package/@voicefield/core" className="pkg">
              <code>@voicefield/core</code>
              <span>Types + utilities, zero deps</span>
            </a>
            <a href="https://npmjs.com/package/@voicefield/react" className="pkg">
              <code>@voicefield/react</code>
              <span>React hook, QR popup, phone page</span>
            </a>
            <a href="https://npmjs.com/package/@voicefield/server" className="pkg">
              <code>@voicefield/server</code>
              <span>Next.js handler, session relay</span>
            </a>
          </div>
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
            <a href="https://github.com/tatargabor/voicefield/tree/main/docs">Docs</a>
          </div>
          <span className="footer-note">MIT &middot; Built because laptop mics are terrible.</span>
        </div>
      </footer>
    </div>
  )
}
