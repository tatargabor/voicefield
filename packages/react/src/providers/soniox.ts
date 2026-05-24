import type { STTProviderConfig, STTProviderInstance } from "@voicefield/core"

export function createSonioxProvider(config: STTProviderConfig): STTProviderInstance {
  let abortController: AbortController | null = null

  return {
    async start() {
      if (!config.sttKey) {
        config.onError(new Error("Soniox provider requires an STT key"))
        return
      }

      let SonioxClient: typeof import("@soniox/client").SonioxClient
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

      recording.on("result", (result: { tokens?: Array<{ text: string; is_final?: boolean }> }) => {
        const tokens = result.tokens ?? []
        const text = tokens.map((t: { text: string }) => t.text).join("")
        if (!text) return

        const isFinal = tokens.every((t: { is_final?: boolean }) => t.is_final)
        if (isFinal) {
          config.onFinal(text)
        } else {
          config.onPartial(text)
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
