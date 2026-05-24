import { useState, useEffect, useRef, useCallback } from "react"
import { isValidPairingCode, normalizePairingCode } from "@voicefield/core"
import type { PairingResponse, SessionCommand } from "@voicefield/core"

type PageState = "code_entry" | "paired" | "recording" | "error"

export function Mic() {
  const [pageState, setPageState] = useState<PageState>("code_entry")
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sonioxKey, setSonioxKey] = useState<string | null>(null)
  const [sonioxKeyExpiresAt, setSonioxKeyExpiresAt] = useState(0)
  const [fields, setFields] = useState<Array<{ id: string; label: string }>>([])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [language, setLanguage] = useState<string | string[]>("en")
  const [config, setConfig] = useState({ maxRecordingDuration: 120, idleTimeout: 30 })
  const [transcript, setTranscript] = useState("")
  const [partialText, setPartialText] = useState("")
  const [wakeLockActive, setWakeLockActive] = useState(false)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sttRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const partialTextRef = useRef("")
  const serverUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const server = params.get("server")
    const code = params.get("code")
    const secret = params.get("secret") ?? undefined

    if (server) {
      setServerUrl(server)
      serverUrlRef.current = server
    }

    if (server && code && isValidPairingCode(code)) {
      pair(code, secret, server)
    }
  }, [])

  const getServerUrl = useCallback(() => serverUrlRef.current || serverUrl || "", [serverUrl])

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (sessionToken) h["Authorization"] = `Bearer ${sessionToken}`
    return h
  }, [sessionToken])

  async function pair(code: string, secret?: string, server?: string) {
    const base = server || getServerUrl()
    if (!base) {
      setError("No server URL — scan a QR code from the desktop app")
      return
    }
    setError(null)
    try {
      const body: Record<string, string> = { code }
      if (secret) body.secret = secret

      const res = await fetch(`${base}/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        let errorMsg = "Pairing failed"
        try { errorMsg = JSON.parse(text).error || errorMsg } catch {}
        throw new Error(errorMsg)
      }

      const data: PairingResponse & { sonioxKeyExpiresAt?: number } = await res.json()
      setSessionToken(data.sessionToken)
      setSonioxKey(data.sonioxTempKey)
      setSonioxKeyExpiresAt(data.sonioxKeyExpiresAt ?? 0)
      setFields(data.fields)
      setActiveFieldId(data.fields[0]?.id ?? null)
      setLanguage(data.language)
      setConfig(data.config)
      setPageState("paired")
      startPolling(data.sessionToken, base)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setPageState("code_entry")
      setCodeInput("")
    }
  }

  function startPolling(token: string, base: string) {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${base}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          setPageState("code_entry")
          setError("Session expired")
          setSessionToken(null)
          setCodeInput("")
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          return
        }
        if (res.ok) {
          const data = await res.json()
          handleCommands(data.commands ?? [])
        }
      } catch {}
    }, 5000)
  }

  function handleCommands(commands: SessionCommand[]) {
    for (const cmd of commands) {
      if (cmd.type === "switch_field") setActiveFieldId(cmd.fieldId)
    }
  }

  async function startRecording() {
    if (!sonioxKey || pageState === "recording") return
    setError(null)
    setTranscript("")
    setPartialText("")
    setPageState("recording")
    sendRecordingState("start")

    let micStream: MediaStream
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (message.includes("NotAllowed") || message.includes("Permission") || message.includes("denied")) {
        setError(isIOS
          ? "Microphone disabled — open iOS Settings → Browser → Microphone → turn ON"
          : "Microphone blocked — tap the lock icon in URL bar → Site settings → Microphone → Allow"
        )
      } else {
        setError(`Microphone error: ${message}`)
      }
      setPageState("paired")
      return
    }

    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
        setWakeLockActive(true)
      }
    } catch {}

    recordingTimerRef.current = setTimeout(() => {
      stopRecording("Maximum duration reached")
    }, config.maxRecordingDuration * 1000)

    resetSilenceTimer()

    try {
      const { SonioxClient } = await import("@soniox/client")
      const abortController = new AbortController()
      const client = new SonioxClient({ api_key: sonioxKey })
      const languageHints = Array.isArray(language) ? language : [language]

      micStream.getTracks().forEach((t) => t.stop())

      const recording = client.realtime.record({
        model: "stt-rt-v4",
        language_hints: languageHints,
        enable_endpoint_detection: true,
        signal: abortController.signal,
      })

      sttRef.current = {
        stop: async () => {
          try { abortController.abort() } catch {}
        },
      }

      recording.on("result", (result: { tokens?: Array<{ text: string; is_final?: boolean }> }) => {
        const tokens = result.tokens ?? []
        const text = tokens.map((t: { text: string }) => t.text).join("")
        if (!text) return
        resetSilenceTimer()

        const isFinal = tokens.every((t: { is_final?: boolean }) => t.is_final)
        if (isFinal) {
          setTranscript((prev) => prev + (prev ? " " : "") + text)
          setPartialText("")
          partialTextRef.current = ""
          sendTranscript(text, true)
        } else {
          setPartialText(text)
          partialTextRef.current = text
          sendTranscript(text, false)
        }
      })

      recording.on("error", (err: Error) => {
        if (err.name === "AbortError" || err.message.includes("abort")) return
        setError(err.message)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Recording error: ${message}`)
      setPageState("paired")
      releaseWakeLock()
    }
  }

  function resetSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      stopRecording("No speech detected")
    }, config.idleTimeout * 1000)
  }

  async function stopRecording(reason?: string) {
    if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

    if (sttRef.current) {
      await sttRef.current.stop()
      sttRef.current = null
    }

    const pendingPartial = partialTextRef.current
    if (pendingPartial) {
      partialTextRef.current = ""
      await sendTranscript(pendingPartial, true)
    }

    releaseWakeLock()
    setPartialText("")
    setPageState("paired")
    await sendRecordingState("stop")
    if (reason) setError(reason)
  }

  async function releaseWakeLock() {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
      setWakeLockActive(false)
    }
  }

  async function sendRecordingState(state: "start" | "stop") {
    if (!sessionToken) return
    try {
      await fetch(`${getServerUrl()}/transcript`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ recordingState: state }),
      })
    } catch {}
  }

  async function sendTranscript(text: string, isFinal: boolean) {
    if (!sessionToken || !activeFieldId) return
    try {
      const res = await fetch(`${getServerUrl()}/transcript`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text, isFinal, fieldId: activeFieldId }),
      })
      if (res.ok) {
        const data = await res.json()
        handleCommands(data.commands ?? [])
      }
    } catch {}
  }

  useEffect(() => {
    if (!sonioxKeyExpiresAt || !sessionToken) return
    const refreshIn = sonioxKeyExpiresAt - Date.now() - 5 * 60 * 1000
    if (refreshIn <= 0) return
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${getServerUrl()}/refresh-key`, {
          method: "POST",
          headers: authHeaders(),
        })
        if (res.ok) {
          const data = await res.json()
          setSonioxKey(data.sonioxTempKey)
          setSonioxKeyExpiresAt(data.expiresAt)
        }
      } catch {}
    }, refreshIn)
    return () => clearTimeout(timer)
  }, [sonioxKeyExpiresAt, sessionToken, authHeaders, getServerUrl])

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
  }, [])

  function handleCodeSubmit() {
    const code = normalizePairingCode(codeInput)
    if (!isValidPairingCode(code)) {
      setError("Enter a 6-digit code")
      return
    }
    pair(code)
  }

  if (pageState === "code_entry") {
    return (
      <div style={s.page}>
        <style>{css}</style>
        <div style={s.card}>
          <div style={s.logoRow}>
            <span style={s.logoIcon}>🎤</span>
            <span style={s.logoText}>voicefield</span>
          </div>
          <p style={s.cardSub}>Enter the code shown on your desktop</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={7}
            value={codeInput}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "").slice(0, 6)
              setCodeInput(raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw)
              if (raw.length === 6) setTimeout(() => pair(raw), 0)
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleCodeSubmit() }}
            placeholder="000 000"
            style={s.codeInput}
            autoFocus
          />
          <button onClick={handleCodeSubmit} style={s.primaryBtn}>Connect</button>
          {!serverUrl && (
            <input
              type="url"
              placeholder="Server URL (from QR code)"
              onChange={(e) => { setServerUrl(e.target.value); serverUrlRef.current = e.target.value }}
              style={s.urlInput}
            />
          )}
          {error && <div style={s.errorBox}>{error}</div>}
        </div>
      </div>
    )
  }

  const isRec = pageState === "recording"

  return (
    <div style={s.page}>
      <style>{css}</style>
      <div style={s.recordingPage}>
        <div style={s.logoRow}>
          <span style={{ fontSize: 18 }}>🎤</span>
          <span style={{ fontSize: 16, fontWeight: 600 }}>voicefield</span>
        </div>

        {fields.length > 1 && (
          <select
            value={activeFieldId ?? ""}
            onChange={(e) => setActiveFieldId(e.target.value)}
            style={s.fieldSelect}
          >
            {fields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        )}
        {fields.length === 1 && (
          <div style={s.fieldBadge}>{fields[0].label}</div>
        )}

        <button
          onClick={() => isRec ? stopRecording() : startRecording()}
          className={isRec ? "mic-btn recording" : "mic-btn"}
          aria-label={isRec ? "Stop recording" : "Start recording"}
        >
          <span className="mic-btn-inner">
            {isRec ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            )}
          </span>
        </button>

        <p style={{ fontSize: 14, color: "#888", marginTop: 12 }}>
          {isRec ? "Tap to stop" : "Tap to speak"}
        </p>

        <div style={s.transcriptBox}>
          {transcript && <p style={{ fontSize: 15, margin: 0, lineHeight: 1.5 }}>{transcript}</p>}
          {partialText && <p style={{ fontSize: 15, margin: 0, fontStyle: "italic", color: "#888", lineHeight: 1.5 }}>{partialText}</p>}
          {!transcript && !partialText && (
            <p style={{ fontSize: 14, color: "#bbb", textAlign: "center", margin: 0 }}>
              {isRec ? "Listening..." : "Transcript appears here"}
            </p>
          )}
        </div>

        <div style={s.statusRow}>
          <span className={isRec ? "status-dot recording" : "status-dot"} />
          <span style={{ fontSize: 13, color: "#888" }}>{isRec ? "Recording" : "Connected"}</span>
          {!wakeLockActive && isRec && (
            <span style={{ fontSize: 12, color: "#d97706", marginLeft: 8 }}>Keep screen on</span>
          )}
        </div>

        {error && <div style={s.errorBox}>{error}</div>}
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as const,
  card: {
    width: "100%",
    maxWidth: 360,
    background: "#fff",
    borderRadius: 20,
    padding: "40px 28px 32px",
    boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
  } as const,
  recordingPage: {
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  } as const,
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  } as const,
  logoIcon: { fontSize: 24 } as const,
  logoText: { fontSize: 20, fontWeight: 700 } as const,
  cardSub: {
    fontSize: 15,
    color: "#666",
    textAlign: "center" as const,
    margin: "0 0 8px",
  } as const,
  codeInput: {
    width: "100%",
    textAlign: "center" as const,
    fontSize: 32,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    letterSpacing: "0.15em",
    padding: "16px 0",
    border: "2px solid #e5e7eb",
    borderRadius: 14,
    outline: "none",
    transition: "border-color 0.2s",
    background: "#fafafa",
  } as const,
  urlInput: {
    width: "100%",
    textAlign: "center" as const,
    fontSize: 14,
    padding: "12px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
    color: "#555",
  } as const,
  primaryBtn: {
    width: "100%",
    padding: "14px 0",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600 as const,
    fontSize: 16,
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    transition: "background 0.15s",
  } as const,
  fieldSelect: {
    marginBottom: 12,
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    fontSize: 14,
    background: "#fff",
    outline: "none",
  } as const,
  fieldBadge: {
    fontSize: 13,
    color: "#2563eb",
    background: "#dbeafe",
    padding: "4px 12px",
    borderRadius: 20,
    fontWeight: 500,
    marginBottom: 16,
  } as const,
  transcriptBox: {
    marginTop: 20,
    width: "100%",
    minHeight: 80,
    padding: 20,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  } as const,
  statusRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as const,
  errorBox: {
    marginTop: 16,
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 12,
    fontSize: 14,
    color: "#b91c1c",
    width: "100%",
    textAlign: "center" as const,
  } as const,
}

const css = `
  .mic-btn {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: #2563eb;
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 16px;
  }
  .mic-btn:active {
    transform: scale(0.95);
  }
  .mic-btn.recording {
    background: #ef4444;
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15), 0 8px 24px rgba(239, 68, 68, 0.3);
    animation: mic-pulse 2s ease-in-out infinite;
  }
  .mic-btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }
  .status-dot.recording {
    background: #ef4444;
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
  @keyframes mic-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`
