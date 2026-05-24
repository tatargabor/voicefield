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

      recording.on("result", (result) => {
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

  const s = styles

  if (pageState === "code_entry") {
    return (
      <div style={s.container}>
        <h1 style={s.title}>Voicefield</h1>
        <p style={s.subtitle}>Enter the code shown on your desktop</p>
        <div style={s.formWrap}>
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
          <button onClick={handleCodeSubmit} style={s.connectBtn}>Connect</button>
          {!serverUrl && (
            <input
              type="url"
              placeholder="Server URL (from QR code)"
              onChange={(e) => { setServerUrl(e.target.value); serverUrlRef.current = e.target.value }}
              style={{ ...s.codeInput, fontSize: 14, letterSpacing: "normal" }}
            />
          )}
        </div>
        {error && <div style={s.errorBox}>{error}</div>}
      </div>
    )
  }

  return (
    <div style={s.container}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Voicefield</h1>

      {fields.length > 1 && (
        <select
          value={activeFieldId ?? ""}
          onChange={(e) => setActiveFieldId(e.target.value)}
          style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
        >
          {fields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      )}
      {fields.length === 1 && (
        <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{fields[0].label}</p>
      )}

      <button
        onClick={() => pageState === "recording" ? stopRecording() : startRecording()}
        style={{
          width: 128, height: 128, borderRadius: "50%", border: "none", cursor: "pointer",
          fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", transition: "all 0.2s",
          background: pageState === "recording" ? "#ef4444" : "#2563eb",
          boxShadow: pageState === "recording"
            ? "0 0 0 8px rgba(239,68,68,0.2)"
            : "0 4px 12px rgba(37,99,235,0.3)",
          animation: pageState === "recording" ? "pulse 2s infinite" : "none",
        }}
        aria-label={pageState === "recording" ? "Stop recording" : "Start recording"}
      >
        {pageState === "recording" ? "⏹" : "🎤"}
      </button>

      <p style={{ marginTop: 12, fontSize: 14, color: "#888" }}>
        {pageState === "recording" ? "Tap to stop" : "Tap to speak"}
      </p>

      <div style={s.transcriptBox}>
        {transcript && <p style={{ fontSize: 14 }}>{transcript}</p>}
        {partialText && <p style={{ fontSize: 14, fontStyle: "italic", color: "#888" }}>{partialText}</p>}
        {!transcript && !partialText && (
          <p style={{ fontSize: 14, color: "#aaa", textAlign: "center" }}>
            {pageState === "recording" ? "Listening..." : "Transcript appears here"}
          </p>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888" }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: pageState === "recording" ? "#ef4444" : "#22c55e",
          animation: pageState === "recording" ? "pulse 2s infinite" : "none",
        }} />
        <span>{pageState === "recording" ? "Recording" : "Connected"}</span>
        {!wakeLockActive && pageState === "recording" && (
          <span style={{ color: "#d97706", marginLeft: 8 }}>Keep screen on</span>
        )}
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
    </div>
  )
}

const styles = {
  container: {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    justifyContent: "center", minHeight: "100vh", padding: 24,
  },
  title: { fontSize: 28, fontWeight: 700 as const, marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24, textAlign: "center" as const },
  formWrap: { width: "100%", maxWidth: 320, display: "flex", flexDirection: "column" as const, gap: 12 },
  codeInput: {
    width: "100%", textAlign: "center" as const, fontSize: 28, fontFamily: "monospace",
    letterSpacing: "0.15em", padding: "16px 0", border: "2px solid #e5e7eb",
    borderRadius: 12, outline: "none",
  },
  connectBtn: {
    width: "100%", padding: "14px 0", background: "#2563eb", color: "#fff",
    fontWeight: 600 as const, fontSize: 16, border: "none", borderRadius: 12, cursor: "pointer",
  },
  transcriptBox: {
    marginTop: 24, width: "100%", maxWidth: 380, minHeight: 80,
    padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f9fafb",
  },
  errorBox: {
    marginTop: 16, padding: 12, background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 12, fontSize: 14, color: "#b91c1c", maxWidth: 380, width: "100%", textAlign: "center" as const,
  },
} as const
