import type { STTProviderConfig, STTProviderInstance } from "@voicefield/core"

export function createSonioxProvider(config: STTProviderConfig): STTProviderInstance {
  let abortController: AbortController | null = null

  return {
    async start() {
      if (!config.sttKey) {
        config.onError(new Error("Soniox provider requires an STT key"))
        return
      }

      let SonioxClient: new (opts: { api_key: string }) => {
        realtime: {
          record(opts: {
            model: string
            language_hints: string[]
            enable_endpoint_detection: boolean
            signal: AbortSignal
          }): {
            on(event: string, handler: (...args: never[]) => void): void
          }
        }
      }
      try {
        const mod = await import("@soniox/client")
        SonioxClient = mod.SonioxClient
      } catch {
        config.onError(
          new Error("@soniox/client is not installed. Run: npm install @soniox/client"),
        )
        return
      }

      abortController = new AbortController()
      const client = new SonioxClient({ api_key: config.sttKey })
      const languageHints = Array.isArray(config.language) ? config.language : [config.language]

      const recording = client.realtime.record({
        model: "stt-rt-v4",
        language_hints: languageHints,
        enable_endpoint_detection: true,
        signal: abortController.signal,
      })

      // Soniox sends cumulative tokens: each result contains ALL tokens from
      // session start. We track how much finalized text we already emitted so
      // we only forward the NEW incremental portion.
      let emittedFinalText = ""

      recording.on("result", (result: { tokens?: Array<{ text: string; is_final?: boolean }> }) => {
        const tokens = result.tokens ?? []
        if (!tokens.length) return

        let finalText = ""
        let partialText = ""
        for (const t of tokens) {
          if (t.is_final) finalText += t.text
          else partialText += t.text
        }

        // Detect per-segment reset (tokens don't start with previously seen finals)
        if (emittedFinalText && finalText && !finalText.startsWith(emittedFinalText)) {
          emittedFinalText = ""
        }

        if (finalText.length > emittedFinalText.length) {
          const newFinal = finalText.slice(emittedFinalText.length).trim()
          emittedFinalText = finalText
          if (newFinal) config.onFinal(newFinal)
        }

        if (partialText.trim()) {
          config.onPartial(partialText.trim())
        }
      })

      recording.on("error", (err: Error) => {
        if (err.name === "AbortError" || err.message.includes("abort")) return
        config.onError(err)
      })
    },

    async stop() {
      if (abortController) {
        try {
          abortController.abort()
        } catch {}
        abortController = null
      }
    },
  }
}
