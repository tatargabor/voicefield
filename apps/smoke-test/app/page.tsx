"use client"

import { useRef } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

export default function SmokeTest() {
  const inputRef = useRef<HTMLInputElement>(null)

  const vf = useVoicefield({
    serverUrl: "/api/voice",
    language: "en",
  })

  vf.register("test", "Test Field", inputRef.current)

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Voicefield Smoke Test</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
        npm packages @voicefield/*@0.2.0 — Web Speech API (no API key)
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          ref={inputRef}
          placeholder="Speak into your phone..."
          style={{
            flex: 1,
            padding: "12px 16px",
            fontSize: 16,
            border: "2px solid #e5e7eb",
            borderRadius: 10,
            outline: "none",
          }}
        />
        <button
          onClick={() => vf.showQR()}
          style={{
            padding: "12px 20px",
            fontSize: 16,
            background: vf.isPaired ? "#22c55e" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {vf.isRecording ? "Recording..." : vf.isPaired ? "Paired" : "Start"}
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#999" }}>
        Status: {vf.sessionState ?? "idle"} | Provider: Web Speech API
      </div>

      <QRPopup
        pairingCode={vf.pairingCode}
        secret={vf.secret}
        serverUrl={vf.serverUrl}
        phoneUrl={vf.phoneUrl}
        isVisible={vf.isQRVisible}
        onClose={vf.hideQR}
      />
    </div>
  )
}
