import { describe, it, expect } from "vitest"
import {
  formatPairingCode,
  normalizePairingCode,
  isValidPairingCode,
  buildQRUrl,
  parseQRUrl,
} from "../pairing"

describe("formatPairingCode", () => {
  it("inserts a space after the third digit", () => {
    expect(formatPairingCode("123456")).toBe("123 456")
  })

  it("handles short input without error", () => {
    expect(formatPairingCode("12")).toBe("12 ")
  })
})

describe("normalizePairingCode", () => {
  it("strips whitespace", () => {
    expect(normalizePairingCode("123 456")).toBe("123456")
  })

  it("strips tabs and newlines", () => {
    expect(normalizePairingCode("12\t34\n56")).toBe("123456")
  })

  it("truncates to 6 characters", () => {
    expect(normalizePairingCode("12345678")).toBe("123456")
  })
})

describe("isValidPairingCode", () => {
  it("returns true for a 6-digit string", () => {
    expect(isValidPairingCode("123456")).toBe(true)
  })

  it("returns true for code with leading zeros", () => {
    expect(isValidPairingCode("000001")).toBe(true)
  })

  it("returns false for 5 digits", () => {
    expect(isValidPairingCode("12345")).toBe(false)
  })

  it("returns false for 7 digits", () => {
    expect(isValidPairingCode("1234567")).toBe(false)
  })

  it("returns false for alphabetic input", () => {
    expect(isValidPairingCode("abcdef")).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isValidPairingCode("")).toBe(false)
  })
})

describe("buildQRUrl", () => {
  it("builds a URL with server, code, and secret params", () => {
    const url = buildQRUrl("https://voicefield.dev", "/api/voicefield", "123456", "abc123")
    const parsed = new URL(url)
    expect(parsed.origin).toBe("https://voicefield.dev")
    expect(parsed.pathname).toBe("/mic")
    expect(parsed.searchParams.get("server")).toBe("/api/voicefield")
    expect(parsed.searchParams.get("code")).toBe("123456")
    expect(parsed.searchParams.get("secret")).toBe("abc123")
  })

  it("resolves relative serverUrl using origin", () => {
    const url = buildQRUrl("", "/api/voicefield", "123456", "sec", "https://example.com")
    const parsed = new URL(url)
    expect(parsed.searchParams.get("server")).toBe("https://example.com/api/voicefield")
  })

  it("uses phoneUrl as base when provided", () => {
    const url = buildQRUrl("https://phone.example.com", "/api", "123456", "sec")
    expect(new URL(url).origin).toBe("https://phone.example.com")
  })
})

describe("parseQRUrl", () => {
  it("parses a valid QR URL", () => {
    const result = parseQRUrl(
      "https://voicefield.dev/mic?server=https://example.com/api&code=123456&secret=abc",
    )
    expect(result).toEqual({
      server: "https://example.com/api",
      code: "123456",
      secret: "abc",
    })
  })

  it("returns null for invalid URL", () => {
    expect(parseQRUrl("not a url")).toBeNull()
  })

  it("returns null when code is missing", () => {
    expect(parseQRUrl("https://example.com/mic?server=x")).toBeNull()
  })

  it("returns null when code is invalid", () => {
    expect(parseQRUrl("https://example.com/mic?server=x&code=abc")).toBeNull()
  })

  it("returns null when server is missing", () => {
    expect(parseQRUrl("https://example.com/mic?code=123456")).toBeNull()
  })

  it("handles missing secret gracefully", () => {
    const result = parseQRUrl("https://example.com/mic?server=x&code=123456")
    expect(result).toEqual({ server: "x", code: "123456", secret: null })
  })
})
