"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { VoicefieldConfig, SessionState, VoiceField } from "@voicefield/core"
import { FieldRegistry } from "./field-registry"

const PHONE_URL_HOSTED = "https://voicefield.dev"

export interface UseVoicefieldReturn {
  sessionId: string | null
  pairingCode: string | null
  secret: string | null
  sessionState: SessionState | "disconnected" | null
  isPaired: boolean
  isRecording: boolean
  fields: VoiceField[]
  activeFieldId: string | null
  showQR: () => Promise<void>
  hideQR: () => void
  isQRVisible: boolean
  endSession: () => Promise<void>
  switchField: (fieldId: string) => Promise<void>
  register: (
    id: string,
    label: string,
    element?: HTMLInputElement | HTMLTextAreaElement | null,
    setterFn?: (value: string, isFinal: boolean) => void
  ) => void
  unregister: (id: string) => void
  serverUrl: string
  phoneUrl: string
}

export function useVoicefield(config: VoicefieldConfig): UseVoicefieldReturn {
  const serverUrl = config.serverUrl.replace(/\/$/, "")
  const phoneUrl = (config.phoneUrl === undefined ? PHONE_URL_HOSTED : config.phoneUrl).replace(/\/$/, "")

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<SessionState | "disconnected" | null>(null)
  const [isQRVisible, setIsQRVisible] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [detectedExternalUrl, setDetectedExternalUrl] = useState<string | null>(null)

  const registryRef = useRef(new FieldRegistry())
  const eventSourceRef = useRef<EventSource | null>(null)
  const rotationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const externalServerUrl = config.externalServerUrl
    || detectedExternalUrl
    || (typeof window !== "undefined" ? window.location.origin + serverUrl : serverUrl)

  useEffect(() => {
    if (config.externalServerUrl) return
    fetch(`${serverUrl}/network-info`)
      .then((r) => r.json())
      .then((data: { lan?: string[] }) => {
        if (data.lan && data.lan.length > 0) {
          setDetectedExternalUrl(data.lan[0])
        }
      })
      .catch(() => {})
  }, [serverUrl, config.externalServerUrl])

  const createNewSession = useCallback(async () => {
    const fields = registryRef.current.getFields()
    const res = await fetch(`${serverUrl}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields, language: config.language }),
    })
    if (!res.ok) throw new Error("Failed to create session")
    const data = await res.json()
    setSessionId(data.sessionId)
    setPairingCode(data.pairingCode)
    setSecret(data.secret)
    setSessionState("created")
    return data.sessionId
  }, [serverUrl, config.language])

  const subscribeSSE = useCallback((sid: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`${serverUrl}/transcript?sessionId=${sid}`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>
        const type = data.type as string

        switch (type) {
          case "connected":
            break
          case "paired":
            setSessionState("paired")
            setIsQRVisible(false)
            if (rotationTimerRef.current) {
              clearTimeout(rotationTimerRef.current)
              rotationTimerRef.current = null
            }
            break
          case "transcript": {
            const { text, isFinal, fieldId } = data as unknown as {
              text: string
              isFinal: boolean
              fieldId: string
            }
            if (isFinal) {
              registryRef.current.finalizePartial(fieldId)
              registryRef.current.injectText(fieldId, text, true)
            } else {
              registryRef.current.injectText(fieldId, text, false)
            }
            break
          }
          case "recording_start":
            setIsRecording(true)
            setSessionState("active")
            break
          case "recording_stop":
            setIsRecording(false)
            break
          case "session_ended":
            setSessionState("expired")
            es.close()
            break
          case "field_switched":
            if (data.fieldId && typeof data.fieldId === "string") {
              registryRef.current.setActiveField(data.fieldId)
            }
            break
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setSessionState("disconnected")
      }
    }
  }, [serverUrl])

  const showQR = useCallback(async () => {
    if (!sessionId || sessionState === "expired" || sessionState === "disconnected") {
      const sid = await createNewSession()
      subscribeSSE(sid)
    }
    setIsQRVisible(true)

    if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current)
    rotationTimerRef.current = setTimeout(async () => {
      if (sessionState === "created") {
        const sid = await createNewSession()
        subscribeSSE(sid)
      }
    }, 5 * 60 * 1000)
  }, [sessionId, sessionState, createNewSession, subscribeSSE])

  const hideQR = useCallback(() => {
    setIsQRVisible(false)
    if (rotationTimerRef.current) {
      clearTimeout(rotationTimerRef.current)
      rotationTimerRef.current = null
    }
  }, [])

  const endSessionFn = useCallback(async () => {
    if (!sessionId) return
    await fetch(`${serverUrl}/session/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
    eventSourceRef.current?.close()
    setSessionState("expired")
    setSessionId(null)
    setPairingCode(null)
    setSecret(null)
    setIsRecording(false)
  }, [sessionId, serverUrl])

  const switchField = useCallback(
    async (fieldId: string) => {
      if (!sessionId) return
      registryRef.current.setActiveField(fieldId)
      await fetch(`${serverUrl}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, type: "switch_field", fieldId }),
      })
    },
    [sessionId, serverUrl]
  )

  const register = useCallback(
    (
      id: string,
      label: string,
      element?: HTMLInputElement | HTMLTextAreaElement | null,
      setterFn?: (value: string, isFinal: boolean) => void
    ) => {
      registryRef.current.register(id, label, element, setterFn)
    },
    []
  )

  const unregister = useCallback((id: string) => {
    registryRef.current.unregister(id)
  }, [])

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
      if (rotationTimerRef.current) clearTimeout(rotationTimerRef.current)
    }
  }, [])

  return {
    sessionId,
    pairingCode,
    secret,
    sessionState,
    isPaired: sessionState === "paired" || sessionState === "active",
    isRecording,
    fields: registryRef.current.getFields(),
    activeFieldId: registryRef.current.getActiveFieldId(),
    showQR,
    hideQR,
    isQRVisible,
    endSession: endSessionFn,
    switchField,
    register,
    unregister,
    serverUrl: externalServerUrl,
    phoneUrl,
  }
}
