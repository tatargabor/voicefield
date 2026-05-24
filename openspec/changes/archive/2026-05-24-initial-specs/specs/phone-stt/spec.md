# phone-stt (delta)

## ADDED Requirements

### Requirement: Client-Side STT

The system SHALL perform speech-to-text processing entirely on the phone's browser using the Soniox WebSocket SDK. No audio data SHALL be sent to the voicefield relay server.

#### Scenario: Audio processing
- **GIVEN** the phone is recording
- **WHEN** the user speaks
- **THEN** audio is processed by Soniox client-side, producing partial and final transcript segments

### Requirement: Phone Page State Machine
### Requirement: Recording Limits

The system SHALL enforce recording duration limits to prevent runaway sessions.

#### Scenario: Max recording duration
- **GIVEN** the phone is recording
- **WHEN** recording reaches the configured maxRecordingDuration (default 120 seconds)
- **THEN** recording stops automatically

#### Scenario: Idle timeout
- **GIVEN** the phone is recording
- **WHEN** no speech is detected for the configured idleTimeout (default 30 seconds)
- **THEN** recording stops automatically

### Requirement: Transcript Submission
### Requirement: STT Key Refresh

The phone SHALL proactively refresh its temporary STT API key before it expires.

#### Scenario: Key approaching expiry
- **GIVEN** the phone has a temporary Soniox key with known expiry
- **WHEN** the key is within 5 minutes of expiring
- **THEN** the phone calls POST /refresh-key to obtain a new key

### Requirement: Field Selection
### Requirement: Status Polling

The phone SHALL poll the server for session state and commands.

#### Scenario: Regular polling
- **GIVEN** the phone is paired
- **WHEN** the polling interval (5 seconds) elapses
- **THEN** the phone calls GET /status and processes any returned commands

#### Scenario: Session expired on poll
- **GIVEN** the phone is polling
- **WHEN** GET /status returns 401
- **THEN** the phone transitions to `error` state with a session expired message

### Requirement: Wake Lock
### Requirement: Language Configuration

The phone SHALL pass configured language hints to the Soniox STT engine.

#### Scenario: Single language
- **GIVEN** language is configured as `"en"`
- **WHEN** STT is initialized
- **THEN** `language_hints: ["en"]` is passed to Soniox

#### Scenario: Multiple languages
- **GIVEN** language is configured as `["en", "es"]`
- **WHEN** STT is initialized
- **THEN** `language_hints: ["en", "es"]` is passed to Soniox
