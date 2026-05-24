"use client"

import { useState } from "react"
import { ChatDemo } from "./chat-demo"
import { FormDemo } from "./form-demo"

type Tab = "chat" | "form"

export default function App() {
  const [tab, setTab] = useState<Tab>("chat")

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Voicefield Demo</h1>
        <p style={{ fontSize: 14, color: "#888" }}>Click the mic, scan with your phone, speak.</p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 1,
        }}
      >
        {(["chat", "form"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#2563eb" : "#888",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t === "chat" ? "Chat (single field)" : "Form (multi field)"}
          </button>
        ))}
      </div>

      {tab === "chat" ? <ChatDemo /> : <FormDemo />}
    </main>
  )
}
