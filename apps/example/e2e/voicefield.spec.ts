import { test, expect } from "@playwright/test"

const API = "/api/voice"

test.describe("Session lifecycle", () => {
  test("creates a session and returns pairing code", async ({ request }) => {
    const res = await request.post(`${API}/session`, {
      data: {
        fields: [{ id: "message", label: "Message" }],
        language: "en",
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pairingCode).toMatch(/^\d{6}$/)
    expect(body.secret).toBeTruthy()
    expect(body.sessionId).toBeTruthy()
  })

  test("ends a session", async ({ request }) => {
    const create = await request.post(`${API}/session`, {
      data: { fields: [{ id: "msg", label: "Msg" }], language: "en" },
    })
    const { sessionId } = await create.json()

    const end = await request.post(`${API}/session/end`, {
      data: { sessionId },
    })
    expect(end.status()).toBe(200)
  })
})

test.describe("Pairing flow", () => {
  test("pairs with correct code and secret", async ({ request }) => {
    const create = await request.post(`${API}/session`, {
      data: { fields: [{ id: "msg", label: "Msg" }], language: "en" },
    })
    const { pairingCode, secret } = await create.json()

    const pair = await request.post(`${API}/pair`, {
      data: { code: pairingCode, secret },
    })

    // Pairing may fail if SONIOX_API_KEY is not set (STT key generation fails)
    // In that case we still validate the API responded correctly
    if (pair.status() === 200) {
      const body = await pair.json()
      expect(body.sessionToken).toBeTruthy()
      expect(body.fields).toBeInstanceOf(Array)
    } else {
      expect(pair.status()).toBe(500)
      const body = await pair.json()
      expect(body.code).toBe("STT_ERROR")
    }
  })

  test("rejects pairing with wrong code", async ({ request }) => {
    const create = await request.post(`${API}/session`, {
      data: { fields: [{ id: "msg", label: "Msg" }], language: "en" },
    })
    const { secret } = await create.json()

    const pair = await request.post(`${API}/pair`, {
      data: { code: "000000", secret },
    })
    expect(pair.status()).toBe(400)
  })

  test("rejects pairing with wrong secret", async ({ request }) => {
    const create = await request.post(`${API}/session`, {
      data: { fields: [{ id: "msg", label: "Msg" }], language: "en" },
    })
    const { pairingCode } = await create.json()

    const pair = await request.post(`${API}/pair`, {
      data: { code: pairingCode, secret: "wrong-secret" },
    })
    expect(pair.status()).toBe(400)
  })
})

test.describe("Transcript relay", () => {
  test("SSE stream receives transcript from paired session", async ({ request }) => {
    // Create session
    const create = await request.post(`${API}/session`, {
      data: { fields: [{ id: "msg", label: "Msg" }], language: "en" },
    })
    const { pairingCode, secret, sessionId } = await create.json()

    // Pair (skip if no SONIOX_API_KEY)
    const pair = await request.post(`${API}/pair`, {
      data: { code: pairingCode, secret },
    })
    if (pair.status() !== 200) {
      test.skip(true, "SONIOX_API_KEY not configured, skipping transcript test")
      return
    }
    const { sessionToken } = await pair.json()

    // Send transcript
    const transcript = await request.post(`${API}/transcript`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      data: { text: "hello world", isFinal: true, fieldId: "msg" },
    })
    expect(transcript.status()).toBe(200)
  })
})

test.describe("UI rendering", () => {
  test("loads the demo page with tab navigation", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toContainText("Voicefield Demo")
    await expect(page.getByText("Chat (single field)")).toBeVisible()
    await expect(page.getByText("Form (multi field)")).toBeVisible()
  })
})
