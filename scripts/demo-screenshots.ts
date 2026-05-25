import { chromium, type Page } from "playwright"
import sharp from "sharp"
import { spawn } from "child_process"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const BASE = "http://127.0.0.1:3100"
const API = `${BASE}/api/voice`
const OUT_DIR = path.resolve(ROOT, "apps/web/public/demo")
const TEMP_DIR = path.resolve(ROOT, ".demo-screenshots-tmp")

interface SessionData {
  sessionId: string
  pairingCode: string
  secret: string
}

interface PairData {
  sessionToken: string
}

async function api(
  endpoint: string,
  body?: Record<string, unknown>,
  token?: string,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  return res.json() as Promise<Record<string, unknown>>
}

async function waitForServer(maxWait = 30_000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function processImage(name: string, width: number, height: number) {
  await sharp(`${TEMP_DIR}/${name}.png`)
    .resize(width, height, { fit: "cover", position: "top" })
    .webp({ quality: 85 })
    .toFile(`${OUT_DIR}/${name}.webp`)
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `${TEMP_DIR}/${name}.png` })
  console.log(`  ${name} captured`)
}

async function main() {
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  let serverProcess: ReturnType<typeof spawn> | null = null
  const serverReady = await waitForServer(2000).catch(() => false)

  if (!serverReady) {
    console.log("Starting example app...")
    serverProcess = spawn("npx", ["next", "dev", "--hostname", "127.0.0.1", "--port", "3100"], {
      cwd: path.resolve(ROOT, "apps/example"),
      stdio: "pipe",
    })
    if (!(await waitForServer(60_000))) {
      console.error("Server failed to start")
      serverProcess.kill()
      process.exit(1)
    }
    console.log("Server ready")
  }

  const browser = await chromium.launch({ headless: true })

  try {
    await captureDesktop(browser)
    await capturePhone(browser)

    const specs = [
      { name: "desktop-1", width: 480, height: 404 },
      { name: "desktop-2", width: 480, height: 432 },
      { name: "desktop-3", width: 480, height: 432 },
      { name: "phone-1", width: 280, height: 392 },
      { name: "phone-2", width: 280, height: 527 },
      { name: "phone-3", width: 280, height: 527 },
    ]
    for (const s of specs) {
      await processImage(s.name, s.width, s.height)
      console.log(`  ${s.name}.webp (${s.width}x${s.height})`)
    }
    console.log("Done!")
  } finally {
    await browser.close()
    serverProcess?.kill()
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

async function captureDesktop(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  console.log("Capturing desktop screenshots...")

  const context = await browser.newContext({
    viewport: { width: 480, height: 600 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  await page.route("**/api/voice/network-info", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ lan: [], localhost: "/api/voice" }),
    }),
  )

  let capturedSession: SessionData | null = null
  await page.route("**/api/voice/session", async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    capturedSession = json as SessionData
    await route.fulfill({ response })
  })

  await page.goto(BASE)
  await page.waitForSelector("h1")

  // --- Desktop 1: QR Popup ---
  await page.click('button[title="Pair your phone"]')
  await page.waitForSelector('img[alt="QR code for pairing"]')
  await page.waitForTimeout(500)

  // Hide the "Server: ..." text at bottom of popup
  await page.evaluate(() => {
    const els = document.querySelectorAll("p")
    for (const el of els) {
      if (el.textContent?.startsWith("Server:")) {
        el.style.display = "none"
      }
    }
  })
  await screenshot(page, "desktop-1")

  // --- Desktop 2: Chat with message ---
  const pair1 = (await api("/pair", {
    code: capturedSession!.pairingCode,
    secret: capturedSession!.secret,
  })) as PairData

  await page.waitForSelector("text=Phone connected", { timeout: 5000 })

  // Send transcript — need recording start/stop cycle for auto-send
  await api("/transcript", { recordingState: "start" }, pair1.sessionToken)
  await page.waitForTimeout(200)
  await api(
    "/transcript",
    { text: "Testing voice input from my phone", isFinal: true, fieldId: "chat" },
    pair1.sessionToken,
  )
  await page.waitForTimeout(200)
  await api("/transcript", { recordingState: "stop" }, pair1.sessionToken)

  // Wait for auto-send (300ms timeout in chat-demo + render time)
  await page.waitForTimeout(1000)

  // Verify the message bubble appeared
  const msgVisible = await page.locator("text=Testing voice input from my phone").isVisible()
  if (!msgVisible) {
    console.warn("  Warning: message bubble not visible, waiting longer...")
    await page.waitForTimeout(2000)
  }

  await screenshot(page, "desktop-2")

  // --- Desktop 3: Form with filled fields ---
  capturedSession = null
  await page.click("text=Form (multi field)")
  await page.waitForTimeout(500)

  // The form tab's mic button — find by the green/blue circle
  await page.locator('button:has(svg path[d*="M12 2a3"])').first().click()
  await page.waitForSelector('img[alt="QR code for pairing"]')
  await page.waitForTimeout(500)

  const pair2 = (await api("/pair", {
    code: capturedSession!.pairingCode,
    secret: capturedSession!.secret,
  })) as PairData

  await page.waitForSelector("text=Phone connected")
  await page.waitForTimeout(300)

  // Send transcripts to each field
  await api(
    "/transcript",
    { text: "Sarah Chen", isFinal: true, fieldId: "name" },
    pair2.sessionToken,
  )
  await page.waitForTimeout(300)
  await api(
    "/transcript",
    { text: "Voice works great", isFinal: true, fieldId: "subject" },
    pair2.sessionToken,
  )
  await page.waitForTimeout(300)
  await api(
    "/transcript",
    { text: "The dictation is coming through from my phone right now.", isFinal: true, fieldId: "message" },
    pair2.sessionToken,
  )
  await page.waitForTimeout(500)

  // Focus Name field to show "voice target" indicator
  await page.click("#name")
  await page.waitForTimeout(200)

  await screenshot(page, "desktop-3")

  await context.close()
}

async function injectPhoneTranscript(page: Page, text: string) {
  await page.evaluate((t) => {
    // The transcript box has a placeholder <p> with "Transcript appears here"
    const placeholder = Array.from(document.querySelectorAll("p")).find(
      (p) => p.textContent === "Transcript appears here",
    )
    if (placeholder) {
      placeholder.textContent = t
      placeholder.style.color = "#1a1a1a"
      placeholder.style.fontStyle = "normal"
    }
  }, text)
}

async function capturePhone(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  console.log("Capturing phone screenshots...")
  const phoneUA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

  // --- Phone 1: Code entry ---
  const ctx1 = await browser.newContext({
    viewport: { width: 280, height: 392 },
    deviceScaleFactor: 2,
    userAgent: phoneUA,
  })
  const p1 = await ctx1.newPage()
  await p1.goto(`${BASE}/mic?server=${encodeURIComponent(API)}`)
  await p1.waitForSelector('input[placeholder="000 000"]')
  await p1.waitForTimeout(500)
  await screenshot(p1, "phone-1")
  await ctx1.close()

  // --- Phone 2: Paired single field with transcript ---
  const session2 = (await api("/session", {
    fields: [{ id: "chat", label: "Chat" }],
    language: "en",
  })) as SessionData

  const ctx2 = await browser.newContext({
    viewport: { width: 280, height: 527 },
    deviceScaleFactor: 2,
    userAgent: phoneUA,
  })
  const p2 = await ctx2.newPage()
  await p2.goto(
    `${BASE}/mic?server=${encodeURIComponent(API)}&code=${session2.pairingCode}&secret=${session2.secret}`,
  )
  await p2.waitForSelector("text=Tap to speak", { timeout: 10000 })
  await p2.waitForTimeout(500)
  await injectPhoneTranscript(p2, "Testing voice input from my phone")
  await p2.waitForTimeout(200)
  await screenshot(p2, "phone-2")
  await ctx2.close()

  // --- Phone 3: Multi-field paired ---
  const session3 = (await api("/session", {
    fields: [
      { id: "name", label: "Name" },
      { id: "subject", label: "Subject" },
      { id: "message", label: "Message" },
    ],
    language: "en",
  })) as SessionData

  const ctx3 = await browser.newContext({
    viewport: { width: 280, height: 527 },
    deviceScaleFactor: 2,
    userAgent: phoneUA,
  })
  const p3 = await ctx3.newPage()
  await p3.goto(
    `${BASE}/mic?server=${encodeURIComponent(API)}&code=${session3.pairingCode}&secret=${session3.secret}`,
  )
  await p3.waitForSelector("text=Tap to speak", { timeout: 10000 })
  await p3.waitForTimeout(500)

  // Click "Message" pill to make it active
  await p3.click("text=Message")
  await p3.waitForTimeout(200)

  await injectPhoneTranscript(p3, "The dictation is coming through from my phone right now.")
  await p3.waitForTimeout(200)
  await screenshot(p3, "phone-3")
  await ctx3.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
