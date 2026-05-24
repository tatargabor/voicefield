"use client"

import { useRef, useState, useCallback } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

export function FormDemo() {
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [activeField, setActiveField] = useState("name")

  const nameRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  const vf = useVoicefield({
    serverUrl: "/api/voice",
    phoneUrl: "",
    language: "en",
  })

  const nameSetter = useCallback((value: string, isFinal: boolean) => {
    if (isFinal) setName(prev => prev + (prev ? " " : "") + value)
  }, [])
  const subjectSetter = useCallback((value: string, isFinal: boolean) => {
    if (isFinal) setSubject(prev => prev + (prev ? " " : "") + value)
  }, [])
  const messageSetter = useCallback((value: string, isFinal: boolean) => {
    if (isFinal) setMessage(prev => prev + (prev ? " " : "") + value)
  }, [])

  vf.register("name", "Name", null, nameSetter)
  vf.register("subject", "Subject", null, subjectSetter)
  vf.register("message", "Message", null, messageSetter)

  const fields = [
    { id: "name", label: "Name", ref: nameRef, value: name, setValue: setName, type: "input" as const },
    { id: "subject", label: "Subject", ref: subjectRef, value: subject, setValue: setSubject, type: "input" as const },
    { id: "message", label: "Message", ref: messageRef, value: message, setValue: setMessage, type: "textarea" as const },
  ]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => vf.showQR()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            background: vf.isPaired ? (vf.isRecording ? "#ef4444" : "#22c55e") : "#2563eb",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </button>
        <span style={{ fontSize: 13, color: "#888" }}>
          {vf.isRecording
            ? "Recording — speak into your phone"
            : vf.isPaired
              ? "Phone connected — focus a field and speak"
              : "Click to pair your phone"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map(f => (
          <div key={f.id}>
            <label
              htmlFor={f.id}
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
                color: activeField === f.id ? "#2563eb" : "#374151",
              }}
            >
              {f.label}
              {activeField === f.id && vf.isPaired && (
                <span style={{ fontWeight: 400, color: "#2563eb", marginLeft: 6 }}>
                  ← voice target
                </span>
              )}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.id}
                ref={f.ref as React.RefObject<HTMLTextAreaElement | null>}
                value={f.value}
                onChange={e => f.setValue(e.target.value)}
                rows={5}
                onFocus={() => { setActiveField(f.id); vf.switchField(f.id) }}
                placeholder={`Speak or type ${f.label.toLowerCase()}...`}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                  border: `2px solid ${activeField === f.id ? "#2563eb" : "#e5e7eb"}`,
                  borderRadius: 8,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            ) : (
              <input
                id={f.id}
                ref={f.ref as React.RefObject<HTMLInputElement | null>}
                value={f.value}
                onChange={e => f.setValue(e.target.value)}
                onFocus={() => { setActiveField(f.id); vf.switchField(f.id) }}
                placeholder={`Speak or type ${f.label.toLowerCase()}...`}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: 14,
                  border: `2px solid ${activeField === f.id ? "#2563eb" : "#e5e7eb"}`,
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {vf.isPaired && (
        <button
          onClick={() => vf.endSession()}
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "#aaa",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Disconnect phone
        </button>
      )}

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
