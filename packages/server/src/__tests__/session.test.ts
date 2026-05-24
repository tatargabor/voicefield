import { describe, it, expect } from "vitest"
import {
  createSession,
  findSessionByCode,
  findSessionById,
  findSessionByToken,
  pairSession,
  touchSession,
  endSession,
  addCommand,
  drainCommands,
  pushSSEEvent,
  getBufferedEventsSince,
} from "../session"

function makeFields() {
  return [{ id: "name", label: "Name" }]
}

describe("createSession", () => {
  it("returns a session with a 6-digit pairing code", () => {
    const session = createSession(makeFields(), "en")
    expect(session.pairingCode).toMatch(/^\d{6}$/)
  })

  it("returns a session with a hex secret", () => {
    const session = createSession(makeFields(), "en")
    expect(session.secret).toMatch(/^[0-9a-f]{64}$/)
  })

  it("creates session in 'created' state", () => {
    const session = createSession(makeFields(), "en")
    expect(session.state).toBe("created")
  })

  it("has no session token before pairing", () => {
    const session = createSession(makeFields(), "en")
    expect(session.sessionToken).toBeNull()
  })

  it("stores fields and language", () => {
    const fields = [
      { id: "name", label: "Name" },
      { id: "email", label: "Email" },
    ]
    const session = createSession(fields, "hu")
    expect(session.fields).toEqual(fields)
    expect(session.language).toBe("hu")
  })
})

describe("findSessionByCode", () => {
  it("finds an existing session by pairing code", () => {
    const session = createSession(makeFields(), "en")
    const found = findSessionByCode(session.pairingCode)
    expect(found?.id).toBe(session.id)
  })

  it("returns null for unknown code", () => {
    expect(findSessionByCode("000000")).toBeNull()
  })
})

describe("findSessionById", () => {
  it("finds a session by id", () => {
    const session = createSession(makeFields(), "en")
    expect(findSessionById(session.id)?.pairingCode).toBe(session.pairingCode)
  })

  it("returns null for unknown id", () => {
    expect(findSessionById("nonexistent")).toBeNull()
  })
})

describe("pairSession", () => {
  it("transitions session to paired state", () => {
    const session = createSession(makeFields(), "en")
    pairSession(session)
    expect(session.state).toBe("paired")
  })

  it("returns a base64url session token", () => {
    const session = createSession(makeFields(), "en")
    const token = pairSession(session)
    expect(token).toBeTruthy()
    expect(token.length).toBeGreaterThan(20)
  })

  it("makes the session findable by token", () => {
    const session = createSession(makeFields(), "en")
    const token = pairSession(session)
    expect(findSessionByToken(token)?.id).toBe(session.id)
  })

  it("removes the pairing code index after pairing", () => {
    const session = createSession(makeFields(), "en")
    const code = session.pairingCode
    pairSession(session)
    expect(findSessionByCode(code)).toBeNull()
  })

  it("throws if session is already paired", () => {
    const session = createSession(makeFields(), "en")
    pairSession(session)
    expect(() => pairSession(session)).toThrow("Session already paired")
  })
})

describe("touchSession", () => {
  it("transitions paired session to active", () => {
    const session = createSession(makeFields(), "en")
    pairSession(session)
    touchSession(session)
    expect(session.state).toBe("active")
  })

  it("extends the session expiry", () => {
    const session = createSession(makeFields(), "en")
    pairSession(session)
    const expiryBefore = session.expiresAt
    touchSession(session)
    expect(session.expiresAt).toBeGreaterThanOrEqual(expiryBefore)
  })
})

describe("endSession", () => {
  it("sets state to expired", () => {
    const session = createSession(makeFields(), "en")
    pairSession(session)
    endSession(session)
    expect(session.state).toBe("expired")
  })

  it("makes session unfindable by id", () => {
    const session = createSession(makeFields(), "en")
    endSession(session)
    expect(findSessionById(session.id)).toBeNull()
  })
})

describe("commands", () => {
  it("adds and drains commands", () => {
    const session = createSession(makeFields(), "en")
    addCommand(session, { type: "switch_field", fieldId: "email" })
    addCommand(session, { type: "switch_field", fieldId: "name" })
    const commands = drainCommands(session)
    expect(commands).toHaveLength(2)
    expect(commands[0]).toEqual({ type: "switch_field", fieldId: "email" })
  })

  it("clears commands after drain", () => {
    const session = createSession(makeFields(), "en")
    addCommand(session, { type: "switch_field", fieldId: "email" })
    drainCommands(session)
    expect(drainCommands(session)).toHaveLength(0)
  })
})

describe("SSE event buffer", () => {
  it("buffers events with incrementing ids", () => {
    const session = createSession(makeFields(), "en")
    pushSSEEvent(session, { type: "paired" })
    pushSSEEvent(session, { type: "session_ended" })
    const events = getBufferedEventsSince(session, 0)
    expect(events).toHaveLength(2)
    expect(events[0].id).toBe(1)
    expect(events[1].id).toBe(2)
  })

  it("filters events by lastEventId", () => {
    const session = createSession(makeFields(), "en")
    pushSSEEvent(session, { type: "paired" })
    pushSSEEvent(session, { type: "session_ended" })
    const events = getBufferedEventsSince(session, 1)
    expect(events).toHaveLength(1)
    expect(events[0].data.type).toBe("session_ended")
  })
})
