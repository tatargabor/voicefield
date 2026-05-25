"use client"

import { useEffect, useState } from "react"
import { formatPairingCode, buildQRUrl } from "@voicefield/core"
import { VERSION } from "./version"

interface QRPopupProps {
  pairingCode: string | null
  secret: string | null
  serverUrl: string
  phoneUrl: string
  isVisible: boolean
  onClose: () => void
  className?: string
}

export function QRPopup({
  pairingCode,
  secret,
  serverUrl,
  phoneUrl,
  isVisible,
  onClose,
  className,
}: QRPopupProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pairingCode || !secret || !isVisible) {
      setQrDataUrl(null)
      return
    }

    const currentOrigin = typeof window !== "undefined" ? window.location.origin : ""
    const url = buildQRUrl(phoneUrl, serverUrl, pairingCode, secret, currentOrigin)

    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        width: 200,
        margin: 2,
      }).then(setQrDataUrl)
    })
  }, [pairingCode, secret, serverUrl, phoneUrl, isVisible])

  if (!isVisible || !pairingCode) return null

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const base = phoneUrl || origin
  const micHost = base ? new URL("/mic", base).host : "voicefield.dev"

  return (
    <div
      className={className || "vf-overlay"}
      onClick={onClose}
      style={
        className
          ? undefined
          : {
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "380px",
          width: "100%",
          margin: "0 16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>Pair your phone</h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          Scan the QR code or enter the code manually
        </p>

        {qrDataUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <img
              src={qrDataUrl}
              alt="QR code for pairing"
              width={200}
              height={200}
              style={{ borderRadius: "8px" }}
            />
          </div>
        )}

        <p style={{ fontSize: "13px", color: "#888", marginBottom: "4px" }}>
          Or go to <span style={{ fontFamily: "monospace", fontWeight: 500 }}>{micHost}/mic</span>
        </p>
        <p
          style={{
            fontSize: "28px",
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          {formatPairingCode(pairingCode)}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "#aaa",
            wordBreak: "break-all",
            fontFamily: "monospace",
            lineHeight: 1.4,
          }}
        >
          Server: {serverUrl}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "8px",
            fontSize: "14px",
            color: "#888",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <span style={{ fontSize: "11px", color: "#ccc" }}>v{VERSION}</span>
      </div>
    </div>
  )
}
