"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useVoicefield, QRPopup } from "@voicefield/react"

interface Message {
  id: number
  text: string
  timestamp: Date
}

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  const vf = useVoicefield({
    serverUrl: "/api/voice",
    phoneUrl: "",
    language: "en",
  })

  const onTranscript = useCallback((value: string, isFinal: boolean) => {
    if (isFinal) {
      setDraft((prev) => prev + (prev ? " " : "") + value)
    }
  }, [])

  vf.register("chat", "Chat", null, onTranscript)

  const draftRef = useRef("")
  draftRef.current = draft

  const send = useCallback(() => {
    const text = draftRef.current.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: nextId.current++, text, timestamp: new Date() }])
    setDraft("")
    draftRef.current = ""
    inputRef.current?.focus()
  }, [])

  const prevRecording = useRef(false)
  useEffect(() => {
    if (prevRecording.current && !vf.isRecording && draftRef.current.trim()) {
      setTimeout(() => send(), 300)
    }
    prevRecording.current = vf.isRecording
  }, [vf.isRecording, send])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 480 }}>
      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "12px 12px 0 0",
          padding: 16,
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#bbb", fontSize: 14, textAlign: "center", margin: "auto 0" }}>
            Speak into your phone or type below
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: "flex-end",
              maxWidth: "80%",
              padding: "10px 14px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "16px 16px 4px 16px",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          background: "#fff",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => vf.showQR()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "none",
            background: vf.isPaired ? (vf.isRecording ? "#ef4444" : "#22c55e") : "#2563eb",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          title={
            vf.isPaired ? (vf.isRecording ? "Recording..." : "Phone connected") : "Pair your phone"
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        </button>

        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send()
          }}
          placeholder={vf.isRecording ? "Listening..." : "Type or speak..."}
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            outline: "none",
          }}
        />

        <button
          onClick={send}
          disabled={!draft.trim()}
          style={{
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            background: draft.trim() ? "#2563eb" : "#e5e7eb",
            color: draft.trim() ? "#fff" : "#aaa",
            border: "none",
            borderRadius: 8,
            cursor: draft.trim() ? "pointer" : "default",
            transition: "background 0.15s",
          }}
        >
          Send
        </button>
      </div>

      {/* Status */}
      {vf.isPaired && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 8,
            fontSize: 12,
            color: "#888",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: vf.isRecording ? "#ef4444" : "#22c55e",
            }}
          />
          {vf.isRecording ? "Recording — speak into your phone" : "Phone connected"}
          <button
            onClick={() => vf.endSession()}
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "#aaa",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Disconnect
          </button>
        </div>
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
