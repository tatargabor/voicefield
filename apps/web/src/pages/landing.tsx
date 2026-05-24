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
        <div className="container hero-content">
          <div className="hero-left">
            <p className="hero-tag">Voice input primitives for React</p>
            <h1>
              Turn any input into a<br />
              <span className="hero-accent">realtime voice interface.</span>
            </h1>
            <p className="hero-sub">
              Wrap your existing fields. Your user's phone becomes the mic.
              No audio infrastructure, no rebuilding your app.
            </p>
            <div className="hero-install">
              <code>npm install @voicefield/react @voicefield/server</code>
            </div>
            <div className="hero-actions">
              <a href="#start" className="btn-primary">Get Started</a>
              <a href="https://github.com/tatargabor/voicefield" className="btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          <div className="hero-code">
            <div className="hero-code-col">
              <span className="hero-code-label">Before</span>
              <pre>{`<textarea
  placeholder="Ask anything..."
/>`}</pre>
            </div>
            <div className="hero-code-col hero-code-after">
              <span className="hero-code-label">After</span>
              <pre>{`const ref = useRef(null)
const vf = useVoicefield()
vf.register('prompt', 'Prompt', ref)

<textarea
  ref={ref}
  placeholder="Ask anything..."
/>`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="demo">
        <div className="container">
          <div className="demo-scene">
            <div className="demo-side">
              <span className="demo-label">Phone</span>
              <div className="phone">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <img src="/demo/phone-1.webp" alt="Phone scanning QR code" className="demo-img demo-img-1" />
                  <img src="/demo/phone-2.webp" alt="Phone recording voice" className="demo-img demo-img-2" />
                  <img src="/demo/phone-3.webp" alt="Phone multi-field mode" className="demo-img demo-img-3" />
                </div>
              </div>
            </div>

            <div className="connector">
              <div className="connector-line" />
              <div className="connector-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted text only</span>
                <span className="connector-sub">No audio leaves the phone</span>
              </div>
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
                  <img src="/demo/desktop-1.webp" alt="Desktop QR pairing" className="demo-img demo-img-1" />
                  <img src="/demo/desktop-2.webp" alt="Desktop voice message" className="demo-img demo-img-2" />
                  <img src="/demo/desktop-3.webp" alt="Desktop form filled" className="demo-img demo-img-3" />
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

      {/* Why this exists */}
      <section className="why">
        <div className="container">
          <h2>Typing is the bottleneck of modern AI interfaces.</h2>
          <p className="section-sub">
            Especially on mobile. Long prompts, multi-field forms, agent interactions —
            all limited by keyboard speed. VoiceField adds realtime voice to your existing
            UI without rebuilding your app.
          </p>
        </div>
      </section>

      {/* Built for existing interfaces */}
      <section className="existing" id="how">
        <div className="container">
          <h2>Built for existing interfaces</h2>
          <p className="section-sub">
            You already have the app. VoiceField upgrades one missing capability.
            No custom voice shell, no assistant framework, no audio routing.
          </p>
          <div className="existing-grid">
            <div className="existing-item">
              <span className="existing-label">Agent prompt</span>
              <pre>{`const ref = useRef(null)
vf.register('prompt', 'Prompt', ref)

<textarea ref={ref}
  placeholder="Describe what you want..."
/>`}</pre>
            </div>
            <div className="existing-item">
              <span className="existing-label">Search bar</span>
              <pre>{`const ref = useRef(null)
vf.register('search', 'Search', ref)

<input ref={ref} type="search"
  placeholder="Search docs..."
/>`}</pre>
            </div>
            <div className="existing-item">
              <span className="existing-label">Chat input</span>
              <pre>{`const ref = useRef(null)
vf.register('message', 'Message', ref)

<input ref={ref}
  placeholder="Type a message..."
/>`}</pre>
            </div>
            <div className="existing-item">
              <span className="existing-label">Multi-field form</span>
              <pre>{`vf.register('name', 'Name', nameRef)
vf.register('subject', 'Subject', subRef)
vf.register('body', 'Message', bodyRef)

// Phone shows pill buttons to
// switch between fields`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="use-cases" id="use-cases">
        <div className="container">
          <h2>Where it fits</h2>
          <div className="case-grid">
            <div className="case">
              <strong>AI agent prompts</strong>
              <span>Long-form prompts, context injection, copilot interfaces</span>
            </div>
            <div className="case">
              <strong>Chat interfaces</strong>
              <span>Customer support, team chat, conversational UIs</span>
            </div>
            <div className="case">
              <strong>Search &amp; command bars</strong>
              <span>Spotlight-style search, command palettes, dashboards</span>
            </div>
            <div className="case">
              <strong>Forms &amp; data entry</strong>
              <span>Multi-field forms, CRMs, internal tools, mobile-first apps</span>
            </div>
            <div className="case">
              <strong>Mobile &amp; kiosk</strong>
              <span>Tablets, point-of-sale, digital signage, field apps</span>
            </div>
            <div className="case">
              <strong>Remote desktops &amp; VMs</strong>
              <span>No mic available — your phone always has one</span>
            </div>
          </div>
        </div>
      </section>

      {/* Not another framework */}
      <section className="not-this">
        <div className="container">
          <h2>Not another voice framework</h2>
          <p className="section-sub">
            Existing voice tools solve a different problem.
            VoiceField is a UI primitive, not a platform.
          </p>
          <div className="compare-grid">
            <div className="compare-col compare-others">
              <h3>Voice platforms</h3>
              <ul>
                <li>Full assistant stacks</li>
                <li>Telephony &amp; call routing</li>
                <li>Custom audio pipelines</li>
                <li>Speech-to-speech agents</li>
                <li>Weeks of integration</li>
              </ul>
            </div>
            <div className="compare-col compare-vf">
              <h3>VoiceField</h3>
              <ul>
                <li>One React hook</li>
                <li>Works with existing inputs</li>
                <li>No audio infrastructure</li>
                <li>Text in, text out</li>
                <li>5 minutes to ship</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="feature-grid">
            <div className="feature">
              <strong>Multi-field, multi-screen</strong>
              <span>Register any number of fields. Phone shows pill buttons to switch targets. Works across pages.</span>
            </div>
            <div className="feature">
              <strong>Zero audio on the wire</strong>
              <span>STT runs in the phone browser. Your server never sees audio. Cryptographic pairing, encrypted relay.</span>
            </div>
            <div className="feature">
              <strong>Pluggable STT</strong>
              <span>Ships with Web Speech API — no key needed. Upgrade to Soniox, Deepgram, or any WebSocket provider.</span>
            </div>
            <div className="feature">
              <strong>Realtime partials</strong>
              <span>Text appears word-by-word. Final results on pause. Low-latency streaming over SSE.</span>
            </div>
            <div className="feature">
              <strong>3 files, 5 minutes</strong>
              <span>One API route, one phone page, one hook. No build config, no vendor dashboard.</span>
            </div>
            <div className="feature">
              <strong>Production-ready UX</strong>
              <span>QR popup, field selector, connection status, auto-reconnect. Ships polished.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pluggable STT */}
      <section className="stt-section">
        <div className="container">
          <h2>Bring your own STT</h2>
          <p className="section-sub">
            Ships with Web Speech API and Soniox. Drop in any provider
            with a 10-line factory function.
          </p>
          <div className="stt-grid">
            <div className="stt-col">
              <span className="stt-label">The interface</span>
              <pre>{`interface STTProviderInstance {
  start(): Promise<void>
  stop(): Promise<void>
}

interface STTProviderConfig {
  sttKey: string | null
  language: string | string[]
  onPartial: (text: string) => void
  onFinal: (text: string) => void
  onError: (error: Error) => void
}

type STTProviderFactory =
  (config: STTProviderConfig) => STTProviderInstance`}</pre>
            </div>
            <div className="stt-col">
              <span className="stt-label">Custom provider example</span>
              <pre>{`import type { STTProviderFactory } from '@voicefield/core'

export const createDeepgramProvider: STTProviderFactory =
  (config) => {
    let socket: WebSocket | null = null

    return {
      async start() {
        socket = new WebSocket(DEEPGRAM_URL)
        socket.onmessage = (e) => {
          const { transcript, is_final } = JSON.parse(e.data)
          if (is_final) config.onFinal(transcript)
          else config.onPartial(transcript)
        }
      },
      async stop() {
        socket?.close()
      },
    }
  }`}</pre>
            </div>
          </div>
          <div className="stt-providers">
            <span className="stt-provider stt-provider-active">Web Speech API</span>
            <span className="stt-provider stt-provider-active">Soniox</span>
            <span className="stt-provider">Deepgram</span>
            <span className="stt-provider">Whisper</span>
            <span className="stt-provider">Azure Speech</span>
            <span className="stt-provider">Your own</span>
          </div>
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
                <span className="code-file">components/voice-input.tsx</span>
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
            <pre>{`const soniox = new SonioxNodeClient({
  api_key: process.env.SONIOX_API_KEY!
})

createVoicefieldHandler({
  generateSttKey: async () => {
    const key = await soniox.auth.createTemporaryKey({
      usage_type: 'transcribe_websocket',
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: key.api_key,
             expiresAt: Date.now() + 1800_000 }
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
              <span>Types + pairing utilities, zero deps</span>
            </a>
            <a href="https://npmjs.com/package/@voicefield/react" className="pkg">
              <code>@voicefield/react</code>
              <span>Hook, QR popup, phone page</span>
            </a>
            <a href="https://npmjs.com/package/@voicefield/server" className="pkg">
              <code>@voicefield/server</code>
              <span>Next.js handler, session relay</span>
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing">
        <div className="container">
          <h2>Stop typing. Start speaking.</h2>
          <p className="section-sub">
            Add realtime voice input to your React app today. MIT licensed, zero vendor lock-in.
          </p>
          <div className="hero-actions">
            <a href="#start" className="btn-primary">Get Started</a>
            <a href="https://github.com/tatargabor/voicefield" className="btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <span className="footer-note">MIT &middot; Built because typing is too slow.</span>
        </div>
      </footer>
    </div>
  )
}
