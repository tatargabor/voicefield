import { createVoicefieldHandler } from "@voicefield/server"

const { GET, POST, OPTIONS } = createVoicefieldHandler({
  cors: { origins: ["*"] },
})

export { GET, POST, OPTIONS }
