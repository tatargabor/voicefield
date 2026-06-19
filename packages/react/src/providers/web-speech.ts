import type { STTProviderConfig, STTProviderInstance } from "@voicefield/core"

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string; message?: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = globalThis as Record<string, unknown>
  return (w.SpeechRecognition ??
    w.webkitSpeechRecognition ??
    null) as SpeechRecognitionConstructor | null
}

const COMMIT_INTERVAL_MS = 1500

export function createWebSpeechProvider(config: STTProviderConfig): STTProviderInstance {
  let recognition: SpeechRecognitionInstance | null = null
  let stopped = false
  let commitTimer: ReturnType<typeof setInterval> | null = null

  // Delta tracking: we build a full transcript from all results and track
  // how much of it we've already committed (sent as final).
  let committedLen = 0
  let fullText = ""

  function buildFullText(results: SpeechRecognitionResultList): string {
    let text = ""
    for (let i = 0; i < results.length; i++) {
      text += (text ? " " : "") + results[i][0].transcript
    }
    return text
  }

  function commitDelta() {
    if (fullText.length <= committedLen) return
    const delta = fullText.slice(committedLen).trim()
    if (!delta) return
    config.onFinal(delta)
    committedLen = fullText.length
  }

  function emitPartial() {
    const partial = fullText.slice(committedLen).trim()
    if (partial) config.onPartial(partial)
  }

  return {
    async start() {
      const SpeechRecognition = getSpeechRecognition()
      if (!SpeechRecognition) {
        config.onError(
          new Error(
            "Web Speech API is not supported in this browser. Try Chrome, Edge, or Safari.",
          ),
        )
        return
      }

      stopped = false
      committedLen = 0
      fullText = ""

      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = Array.isArray(config.language) ? config.language[0] : config.language

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        fullText = buildFullText(event.results)
        emitPartial()
      }

      recognition.onerror = (event: { error: string; message?: string }) => {
        if (event.error === "aborted" || event.error === "no-speech") return
        config.onError(new Error(`Speech recognition error: ${event.error}`))
      }

      recognition.onend = () => {
        if (stopped) return
        commitDelta()
        committedLen = 0
        fullText = ""
        try {
          recognition!.start()
        } catch {}
      }

      commitTimer = setInterval(() => {
        if (!stopped) commitDelta()
      }, COMMIT_INTERVAL_MS)

      try {
        recognition.start()
      } catch (err) {
        config.onError(err instanceof Error ? err : new Error(String(err)))
      }
    },

    async stop() {
      stopped = true
      if (commitTimer) {
        clearInterval(commitTimer)
        commitTimer = null
      }
      commitDelta()
      if (recognition) {
        try {
          recognition.stop()
        } catch {}
        recognition = null
      }
    },
  }
}
