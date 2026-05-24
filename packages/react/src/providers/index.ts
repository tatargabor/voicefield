import type { STTProviderFactory } from "@voicefield/core"
import { createSonioxProvider } from "./soniox"
import { createWebSpeechProvider } from "./web-speech"

const providers = new Map<string, STTProviderFactory>([
  ["soniox", createSonioxProvider],
  ["web-speech", createWebSpeechProvider],
])

export function getProvider(name: string): STTProviderFactory {
  const factory = providers.get(name)
  if (!factory) {
    throw new Error(`Unknown STT provider: "${name}". Available: ${[...providers.keys()].join(", ")}`)
  }
  return factory
}

export { createSonioxProvider } from "./soniox"
export { createWebSpeechProvider } from "./web-speech"
