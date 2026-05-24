import { createVoicefieldHandler } from "@voicefield/server"
import { SonioxNodeClient } from "@soniox/node"

const apiKey = process.env.SONIOX_API_KEY
if (!apiKey) {
  console.warn(
    "⚠️  SONIOX_API_KEY not set. Voice sessions will fail to pair.\n" +
    "   Get a free key at https://soniox.com and add to .env.local:\n" +
    "   SONIOX_API_KEY=your-key-here"
  )
}

const soniox = apiKey ? new SonioxNodeClient({ api_key: apiKey }) : null

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  generateSTTKey: async () => {
    if (!soniox) {
      throw new Error("SONIOX_API_KEY not configured")
    }
    const result = await soniox.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 1800,
    })
    return { temporaryApiKey: result.api_key, expiresAt: Date.now() + 1800_000 }
  },
  cors: {
    origins: ["*"],
  },
})

export { GET, POST, OPTIONS }
