import { describe, it, expect, vi, beforeEach } from "vitest"
import { getProvider } from "../providers"
import { createWebSpeechProvider } from "../providers/web-speech"

describe("getProvider", () => {
  it("returns soniox provider factory", () => {
    const factory = getProvider("soniox")
    expect(typeof factory).toBe("function")
  })

  it("returns web-speech provider factory", () => {
    const factory = getProvider("web-speech")
    expect(typeof factory).toBe("function")
  })

  it("throws on unknown provider", () => {
    expect(() => getProvider("unknown")).toThrow('Unknown STT provider: "unknown"')
  })
})

describe("createWebSpeechProvider", () => {
  let mockRecognition: {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: ((event: unknown) => void) | null
    onerror: ((event: unknown) => void) | null
    onend: (() => void) | null
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
    abort: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: "",
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    }

    ;(globalThis as Record<string, unknown>).webkitSpeechRecognition = function () {
      return mockRecognition
    }
  })

  it("creates instance with start and stop", () => {
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "en",
      onPartial: vi.fn(),
      onFinal: vi.fn(),
      onError: vi.fn(),
    })
    expect(typeof provider.start).toBe("function")
    expect(typeof provider.stop).toBe("function")
  })

  it("configures recognition on start", async () => {
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "hu",
      onPartial: vi.fn(),
      onFinal: vi.fn(),
      onError: vi.fn(),
    })

    await provider.start()
    expect(mockRecognition.continuous).toBe(true)
    expect(mockRecognition.interimResults).toBe(true)
    expect(mockRecognition.lang).toBe("hu")
    expect(mockRecognition.start).toHaveBeenCalled()
  })

  it("uses first language from array", async () => {
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: ["hu", "en"],
      onPartial: vi.fn(),
      onFinal: vi.fn(),
      onError: vi.fn(),
    })

    await provider.start()
    expect(mockRecognition.lang).toBe("hu")
  })

  it("calls onPartial for interim results", async () => {
    const onPartial = vi.fn()
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "en",
      onPartial,
      onFinal: vi.fn(),
      onError: vi.fn(),
    })

    await provider.start()
    mockRecognition.onresult!({
      resultIndex: 0,
      results: {
        length: 1,
        0: { isFinal: false, length: 1, 0: { transcript: "hello", confidence: 0.9 } },
      },
    })
    expect(onPartial).toHaveBeenCalledWith("hello")
  })

  it("calls onFinal for final results", async () => {
    const onFinal = vi.fn()
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "en",
      onPartial: vi.fn(),
      onFinal,
      onError: vi.fn(),
    })

    await provider.start()
    mockRecognition.onresult!({
      resultIndex: 0,
      results: {
        length: 1,
        0: { isFinal: true, length: 1, 0: { transcript: "hello world", confidence: 0.95 } },
      },
    })
    expect(onFinal).toHaveBeenCalledWith("hello world")
  })

  it("stops recognition on stop", async () => {
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "en",
      onPartial: vi.fn(),
      onFinal: vi.fn(),
      onError: vi.fn(),
    })

    await provider.start()
    await provider.stop()
    expect(mockRecognition.stop).toHaveBeenCalled()
  })

  it("calls onError when SpeechRecognition not available", async () => {
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition
    delete (globalThis as Record<string, unknown>).SpeechRecognition

    const onError = vi.fn()
    const provider = createWebSpeechProvider({
      sttKey: null,
      language: "en",
      onPartial: vi.fn(),
      onFinal: vi.fn(),
      onError,
    })

    await provider.start()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("not supported") }),
    )
  })
})
