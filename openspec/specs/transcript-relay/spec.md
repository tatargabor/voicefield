# Transcript Relay

## Purpose

Bridges transcript data from phone to desktop in real-time. The phone POSTs transcript text (partial and final) to the relay server, which pushes it to the desktop via Server-Sent Events (SSE). Only text is relayed — no audio.

## Requirements

### Requirement: Transcript Submission

The system SHALL accept transcript text from the phone via authenticated POST requests.

#### Scenario: Phone sends transcript
- **GIVEN** a paired session with a valid bearer token
- **WHEN** the phone sends POST /transcript with `{ text, isFinal, fieldId }`
- **THEN** the server pushes an SSE event to all connected desktop clients and returns `{ ok: true }` with any pending commands

#### Scenario: Unauthorized transcript
- **GIVEN** an invalid or expired bearer token
- **WHEN** the phone sends POST /transcript
- **THEN** a 401 error is returned

### Requirement: Recording State Events

The system SHALL relay recording start/stop events from the phone to the desktop.

#### Scenario: Recording starts
- **GIVEN** a paired session
- **WHEN** the phone sends POST /transcript with `{ recordingState: "start" }`
- **THEN** a `recording_start` SSE event is pushed to the desktop

#### Scenario: Recording stops
- **GIVEN** a paired session
- **WHEN** the phone sends POST /transcript with `{ recordingState: "stop" }`
- **THEN** a `recording_stop` SSE event is pushed to the desktop

### Requirement: SSE Subscription

The system SHALL provide an SSE endpoint for the desktop to receive real-time events.

#### Scenario: Desktop subscribes
- **GIVEN** a valid sessionId
- **WHEN** the desktop connects to GET /transcript?sessionId=...
- **THEN** an SSE stream is opened with an initial `connected` event containing the sessionId

#### Scenario: Event delivery
- **GIVEN** an active SSE connection
- **WHEN** any event occurs (transcript, paired, recording_start, recording_stop, session_ended, field_switched)
- **THEN** the event is delivered as an SSE message with an incrementing `id` field

### Requirement: SSE Reconnection

The system SHALL support SSE reconnection using the `Last-Event-ID` header, replaying buffered events.

#### Scenario: Client reconnects
- **GIVEN** a desktop client that disconnected after receiving event id 5
- **WHEN** the client reconnects with `Last-Event-ID: 5`
- **THEN** all buffered events with id > 5 are replayed before new events

### Requirement: Event Buffering

The system SHALL buffer the last 60 seconds of events per session to support reconnection.

#### Scenario: Buffer retention
- **GIVEN** events from the last 90 seconds
- **WHEN** a client reconnects
- **THEN** only events from the last 60 seconds are available for replay; older events are pruned

### Requirement: SSE Event Types

The system SHALL support the following SSE event types:

| Type | Payload | Source |
|------|---------|--------|
| `transcript` | `{ text, isFinal, fieldId }` | Phone POST /transcript |
| `paired` | `{}` | Phone POST /pair |
| `recording_start` | `{}` | Phone POST /transcript (recordingState) |
| `recording_stop` | `{}` | Phone POST /transcript (recordingState) |
| `session_ended` | `{}` | Desktop POST /session/end |
| `field_switched` | `{ fieldId }` | Desktop POST /command |

### Requirement: Command Piggyback

The system SHALL deliver pending desktop commands to the phone as part of the transcript response, avoiding the need for a separate polling request for each transcript.

#### Scenario: Commands returned with transcript
- **GIVEN** a desktop has queued a `switch_field` command
- **WHEN** the phone sends a transcript
- **THEN** the response includes `{ commands: [{ type: "switch_field", fieldId: "..." }] }` and the commands are drained from the queue
