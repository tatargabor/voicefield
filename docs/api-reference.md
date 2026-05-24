# API Reference

All endpoints are served by `createVoicefieldHandler()` under a catch-all route (e.g., `/api/voice/[...voicefield]`).

## Error Shape

All errors return JSON with this shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Error codes: `VALIDATION_ERROR`, `INVALID_CODE`, `NOT_CONFIGURED`, `STT_ERROR`.

---

## POST /session

Create a new voice session.

**Auth**: None

**Request body**:

```json
{
  "fields": [{ "id": "name", "label": "Name" }],
  "language": "en"
}
```

Both fields are optional. Defaults: one field `{ id: "default", label: "Default" }`, language `"en"`.

**Success response** (200):

```json
{
  "sessionId": "uuid-v4",
  "pairingCode": "123456",
  "secret": "64-char-hex-string",
  "expiresAt": 1700000000000
}
```

Session creation always succeeds, even without `generateSttKey` configured (the phone will use Web Speech API fallback).

---

## POST /pair

Pair a phone to a session using the pairing code and secret.

**Auth**: None

**Request body**:

```json
{
  "code": "123456",
  "secret": "64-char-hex-string"
}
```

**Success response** (200):

```json
{
  "sessionToken": "base64url-token",
  "sttProvider": "soniox",
  "sttKey": "temporary-stt-key",
  "sttKeyExpiresAt": 1700000000000,
  "fields": [{ "id": "name", "label": "Name" }],
  "language": "en",
  "config": {
    "maxRecordingDuration": 120,
    "idleTimeout": 30
  }
}
```

When no `generateSttKey` is configured on the server, `sttProvider` is `"web-speech"` and `sttKey`/`sttKeyExpiresAt` are `null`.

**Errors**:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid JSON or bad code format |
| 400 | `INVALID_CODE` | Code not found, expired, wrong secret, or already paired |
| 500 | `STT_ERROR` | `generateSttKey` threw an error |

---

## POST /transcript

Send a transcript or recording state change from the phone.

**Auth**: Bearer token (from pair response)

**Request body** (transcript):

```json
{
  "text": "hello world",
  "isFinal": true,
  "fieldId": "name"
}
```

**Request body** (recording state):

```json
{
  "recordingState": "start"
}
```

Valid values: `"start"`, `"stop"`.

**Success response** (200):

```json
{
  "ok": true,
  "commands": [{ "type": "switch_field", "fieldId": "email" }]
}
```

The `commands` array contains pending commands from the desktop (field switches). Empty if none.

**Errors**:

| Status | Code | When |
|--------|------|------|
| 401 | — | Missing or invalid Bearer token |
| 400 | `VALIDATION_ERROR` | Invalid JSON or missing text/isFinal |

---

## GET /transcript

SSE stream for the desktop to receive real-time events.

**Auth**: None (session ID is the auth — UUIDv4, not guessable)

**Query params**: `?sessionId=uuid-v4`

**Response**: `text/event-stream`

**Event types**:

```
data: {"type":"connected","sessionId":"..."}

data: {"type":"paired"}

data: {"type":"recording_start"}

data: {"type":"recording_stop"}

data: {"type":"transcript","text":"hello","isFinal":true,"fieldId":"name"}

data: {"type":"field_switched","fieldId":"email"}

data: {"type":"session_ended"}
```

Each event has an incrementing `id:` for reconnection via `Last-Event-ID` header.

**Errors**:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing sessionId |
| 404 | — | Session not found or expired |

---

## POST /session/end

End a session manually.

**Auth**: None (requires sessionId)

**Request body**:

```json
{
  "sessionId": "uuid-v4"
}
```

**Success response** (200):

```json
{
  "ok": true
}
```

**Errors**:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid JSON or missing sessionId |
| 404 | — | Session not found or already expired |

---

## POST /command

Send a command from the desktop to the phone (e.g., switch active field).

**Auth**: None (requires sessionId)

**Request body**:

```json
{
  "sessionId": "uuid-v4",
  "type": "switch_field",
  "fieldId": "email"
}
```

**Success response** (200):

```json
{
  "ok": true
}
```

**Errors**:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing sessionId, type, or fieldId |
| 404 | — | Session not found or not active |

---

## POST /refresh-key

Phone requests a fresh STT key (when the current one is about to expire).

**Auth**: Bearer token

**Success response** (200):

```json
{
  "sttKey": "new-temporary-key",
  "expiresAt": 1700000000000
}
```

**Errors**:

| Status | Code | When |
|--------|------|------|
| 401 | — | Missing or invalid Bearer token |
| 500 | `STT_ERROR` | `generateSttKey` threw an error |
| 503 | `NOT_CONFIGURED` | `generateSttKey` not provided |

---

## GET /status

Phone polls for session state and pending commands.

**Auth**: Bearer token

**Success response** (200):

```json
{
  "state": "active",
  "fields": [{ "id": "name", "label": "Name" }],
  "commands": [{ "type": "switch_field", "fieldId": "email" }]
}
```

Commands are drained on read — each command is returned only once.

**Errors**:

| Status | Code | When |
|--------|------|------|
| 401 | — | Missing or invalid Bearer token |

---

## GET /network-info

Returns LAN IP addresses for local development QR code generation.

**Auth**: None

**Success response** (200):

```json
{
  "lan": ["https://192.168.1.50:3000/api/voice"],
  "localhost": "https://localhost:3000/api/voice"
}
```
