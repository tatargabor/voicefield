# session-management (delta)

## ADDED Requirements

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
### Requirement: Sliding TTL

The system SHALL reset the session's expiry timer on every activity (transcript, status poll, command). The sliding window is 30 minutes.

#### Scenario: Activity extends session
- **GIVEN** a session with 5 minutes remaining
- **WHEN** a transcript is received
- **THEN** the expiry resets to 30 minutes from now

### Requirement: Hard Maximum Lifetime
### Requirement: Expired Session Cleanup

The system SHALL periodically clean up expired sessions from the in-memory store. Cleanup runs every 60 seconds.

#### Scenario: Cleanup removes expired sessions
- **GIVEN** sessions that have expired
- **WHEN** the cleanup timer fires
- **THEN** expired sessions are removed from the store and their code index entries are deleted

### Requirement: Explicit Session End
