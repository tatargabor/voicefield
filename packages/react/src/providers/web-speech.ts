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
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null
}

export function createWebSpeechProvider(config: STTProviderConfig): STTProviderInstance {
  let recognition: SpeechRecognitionInstance | null = null
  let intentionallyStopped = false
  let lastPartial = ""

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

      intentionallyStopped = false
      lastPartial = ""
      let processedFinalCount = 0
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = Array.isArray(config.language) ? config.language[0] : config.language

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          if (result.isFinal) {
            if (i >= processedFinalCount) {
              processedFinalCount = i + 1
              lastPartial = ""
              config.onFinal(transcript)
            }
          } else {
            lastPartial = transcript
            config.onPartial(transcript)
          }
        }
      }

      recognition.onerror = (event: { error: string; message?: string }) => {
        if (event.error === "aborted" || event.error === "no-speech") return
        config.onError(new Error(`Speech recognition error: ${event.error}`))
      }

      recognition.onend = () => {
        if (!intentionallyStopped && recognition) {
          if (lastPartial) {
            config.onFinal(lastPartial)
            lastPartial = ""
          }
          processedFinalCount = 0
          try {
            recognition.start()
          } catch {}
        }
      }

      try {
        recognition.start()
      } catch (err) {
        config.onError(err instanceof Error ? err : new Error(String(err)))
      }
    },

    async stop() {
      intentionallyStopped = true
      if (recognition) {
        try {
          recognition.stop()
        } catch {}
        recognition = null
      }
    },
  }
}
