# Session Management

## Purpose

Manages the lifecycle of voicefield sessions — creation, state transitions, expiry, and cleanup. Sessions are ephemeral (in-memory), supporting the pairing→active→expired flow with configurable TTLs.

## Requirements

### Requirement: Session Creation

The system SHALL create a new session with a unique UUID, a random 6-digit pairing code, and a 256-bit (32-byte) cryptographic secret.

#### Scenario: New session is created
- **GIVEN** a client requests a new session with optional fields and language
- **WHEN** the session is created
- **THEN** the session has state `created`, a UUID id, a 6-digit pairing code, a 256-bit hex secret, and an expiry of 5 minutes (pairing TTL)

#### Scenario: Pairing code uniqueness
- **GIVEN** existing sessions in the store
- **WHEN** a new session is created
- **THEN** its pairing code SHALL NOT collide with any active session's code

### Requirement: Session State Machine

The system SHALL enforce the state transitions: `created` → `paired` → `active` → `expired`. No other transitions are valid.

#### Scenario: Created to paired
- **GIVEN** a session in `created` state
- **WHEN** a phone pairs successfully
- **THEN** the session transitions to `paired` and a 384-bit (48-byte) session token is generated

#### Scenario: Paired to active
- **GIVEN** a session in `paired` state
- **WHEN** any activity occurs (transcript, status poll, command)
- **THEN** the session transitions to `active`

#### Scenario: Any state to expired
- **GIVEN** a session in any state
- **WHEN** the sliding TTL (30 minutes) elapses without activity, OR the hard max lifetime (24 hours) is reached, OR the session is explicitly ended
- **THEN** the session transitions to `expired` and all SSE connections are closed

### Requirement: Sliding TTL

The system SHALL reset the session's expiry timer on every activity (transcript, status poll, command). The sliding window is 30 minutes.

#### Scenario: Activity extends session
- **GIVEN** a session with 5 minutes remaining
- **WHEN** a transcript is received
- **THEN** the expiry resets to 30 minutes from now

### Requirement: Hard Maximum Lifetime

The system SHALL enforce an absolute maximum session lifetime of 24 hours, regardless of activity.

#### Scenario: Session reaches hard max
- **GIVEN** a session that has been active for 24 hours with continuous activity
- **WHEN** the 24-hour mark is reached
- **THEN** the session expires

### Requirement: Expired Session Cleanup

The system SHALL periodically clean up expired sessions from the in-memory store. Cleanup runs every 60 seconds.

#### Scenario: Cleanup removes expired sessions
- **GIVEN** sessions that have expired
- **WHEN** the cleanup timer fires
- **THEN** expired sessions are removed from the store and their code index entries are deleted

### Requirement: Explicit Session End

The system SHALL support explicit session termination by either the desktop or phone.

#### Scenario: Desktop ends session
- **GIVEN** an active session
- **WHEN** the desktop sends POST /session/end with the sessionId
- **THEN** the session is marked expired, a `session_ended` SSE event is pushed, and all SSE connections are closed
