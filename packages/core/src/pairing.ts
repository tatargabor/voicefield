export function formatPairingCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`
}

export function normalizePairingCode(input: string): string {
  return input.replace(/\s/g, "").slice(0, 6)
}

export function isValidPairingCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

export function buildQRUrl(
  phoneUrl: string,
  serverUrl: string,
  code: string,
  secret: string,
  origin?: string
): string {
  const base = phoneUrl || origin || (typeof window !== "undefined" ? window.location.origin : "http://localhost")
  const url = new URL("/mic", base)
  const serverBase = serverUrl.startsWith("/") && origin ? origin + serverUrl : serverUrl
  url.searchParams.set("server", serverBase)
  url.searchParams.set("code", code)
  url.searchParams.set("secret", secret)
  return url.toString()
}

export function parseQRUrl(
  url: string
): { server: string; code: string; secret: string | null } | null {
  try {
    const parsed = new URL(url)
    const server = parsed.searchParams.get("server")
    const code = parsed.searchParams.get("code")
    if (!server || !code || !isValidPairingCode(code)) return null
    return {
      server,
      code,
      secret: parsed.searchParams.get("secret"),
    }
  } catch {
    return null
  }
}
