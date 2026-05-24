# transcript-relay (delta)

## ADDED Requirements

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
### Requirement: Event Buffering

The system SHALL buffer the last 60 seconds of events per session to support reconnection.

#### Scenario: Buffer retention
- **GIVEN** events from the last 90 seconds
- **WHEN** a client reconnects
- **THEN** only events from the last 60 seconds are available for replay; older events are pruned

### Requirement: SSE Event Types
### Requirement: Command Piggyback

The system SHALL deliver pending desktop commands to the phone as part of the transcript response, avoiding the need for a separate polling request for each transcript.

#### Scenario: Commands returned with transcript
- **GIVEN** a desktop has queued a `switch_field` command
- **WHEN** the phone sends a transcript
- **THEN** the response includes `{ commands: [{ type: "switch_field", fieldId: "..." }] }` and the commands are drained from the queue
