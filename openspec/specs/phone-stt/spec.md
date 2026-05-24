# Phone STT

## Purpose

The phone-side speech-to-text client. Runs entirely in the phone's browser using a pluggable STT provider — audio never leaves the device. Manages recording lifecycle, silence detection, transcript submission, STT key refresh, and provider selection.

## Requirements

### Requirement: Client-Side STT

The system SHALL perform speech-to-text processing entirely on the phone's browser using the configured STT provider. No audio data SHALL be sent to the voicefield relay server.

#### Scenario: Audio processing
- **GIVEN** the phone is recording
- **WHEN** the user speaks
- **THEN** audio is processed by the selected STT provider client-side, producing partial and final transcript segments

### Requirement: Provider Selection

The phone page SHALL select the STT provider based on the `sttProvider` field returned in the pairing response.

#### Scenario: Soniox provider selected
- **GIVEN** the pair response contains `sttProvider: "soniox"` and a valid `sttKey`
- **WHEN** recording starts
- **THEN** the Soniox provider factory is used

#### Scenario: Web Speech provider selected
- **GIVEN** the pair response contains `sttProvider: "web-speech"` and `sttKey: null`
- **WHEN** recording starts
- **THEN** the Web Speech API provider factory is used

#### Scenario: Unknown provider
- **GIVEN** the pair response contains an unrecognized `sttProvider` value
- **WHEN** recording starts
- **THEN** an error is displayed to the user

### Requirement: Phone Page State Machine

The phone page SHALL implement the following states: `code_entry` → `paired` → `recording` → (back to `paired`), with `error` reachable from any state.

#### Scenario: Initial state
- **GIVEN** the phone page loads without QR parameters
- **WHEN** the page renders
- **THEN** the state is `code_entry` with a pairing code input field

#### Scenario: QR auto-pair
- **GIVEN** the phone page loads with `?server=...&code=...&secret=...` URL parameters
- **WHEN** the page renders
- **THEN** the system auto-pairs and transitions directly to `paired` state

#### Scenario: Manual pairing
- **GIVEN** the phone page is in `code_entry` state
- **WHEN** the user enters a valid 6-digit code and submits
- **THEN** the system pairs and transitions to `paired` state

#### Scenario: Start recording
- **GIVEN** the phone is in `paired` state
- **WHEN** the user taps the mic button
- **THEN** the state transitions to `recording`, a `recording_start` event is sent, and STT begins

#### Scenario: Stop recording
- **GIVEN** the phone is in `recording` state
- **WHEN** the user taps the mic button again
- **THEN** the state transitions to `paired`, a `recording_stop` event is sent, and STT stops

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

The phone SHALL send transcript segments to the relay server as they are produced.

#### Scenario: Partial transcript
- **GIVEN** the phone is recording and the STT provider produces a partial result
- **WHEN** the partial text is received via `onPartial` callback
- **THEN** it is sent via POST /transcript with `isFinal: false` and the current fieldId

#### Scenario: Final transcript
- **GIVEN** the phone is recording and the STT provider produces a final result
- **WHEN** the final text is received via `onFinal` callback
- **THEN** it is sent via POST /transcript with `isFinal: true` and the current fieldId

### Requirement: STT Key Refresh

The phone SHALL proactively refresh its temporary STT API key before it expires, when using a provider that requires one.

#### Scenario: Key approaching expiry
- **GIVEN** the phone has a temporary STT key with known expiry
- **WHEN** the key is within 5 minutes of expiring
- **THEN** the phone calls POST /refresh-key to obtain a new key

#### Scenario: No key needed
- **GIVEN** the provider does not require an API key (e.g., web-speech)
- **WHEN** the session is active
- **THEN** no key refresh is attempted

### Requirement: Field Selection

The phone SHALL display a field selector when multiple fields are registered, and respond to field switch commands from the desktop. The field selector SHALL use a horizontal pill/chip bar instead of a native dropdown, showing all fields simultaneously with the active field visually highlighted.

#### Scenario: Multiple fields

- **WHEN** the session has multiple registered fields and the phone is in `paired` or `recording` state
- **THEN** a horizontal row of pill-shaped buttons is displayed, one per field
- **THEN** the active field's pill SHALL have a filled blue (#2563eb) background with white text
- **THEN** inactive field pills SHALL have a white background with a border (#e5e7eb) and dark text

#### Scenario: Field selection via pill tap

- **WHEN** the user taps an inactive field pill
- **THEN** that field becomes active and its pill transitions to the filled/active style
- **THEN** the previously active pill transitions to the inactive/outlined style

#### Scenario: Many fields overflow

- **WHEN** there are more fields than fit in a single row
- **THEN** the pill bar SHALL scroll horizontally with momentum scrolling enabled
- **THEN** no fields SHALL be hidden behind an extra interaction (no dropdown/modal)

#### Scenario: Single field

- **WHEN** the session has exactly one registered field
- **THEN** a single field badge is displayed (no selector interaction needed)

#### Scenario: Desktop switches field

- **GIVEN** the phone is polling GET /status
- **WHEN** a `switch_field` command is received
- **THEN** the phone switches to the specified field and the pill bar updates to reflect the new active field

### Requirement: Consistent Mic Icon

The microphone icon SVG SHALL be identical across the phone page mic button and the desktop example app field buttons. The canonical icon is a Lucide-style mic: a rounded-rect microphone body, a curved pickup arc below, and a vertical stand line.

#### Scenario: Phone mic button icon

- **WHEN** the phone is in `paired` state (not recording)
- **THEN** the mic button displays the canonical mic SVG icon in white on blue (#2563eb) background

#### Scenario: Desktop field button icon

- **WHEN** a voicefield-enabled field renders its mic button in the example app
- **THEN** the button displays the same canonical mic SVG icon as the phone page

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

The phone SHALL request a screen wake lock to prevent the screen from turning off during a session.

#### Scenario: Wake lock active
- **GIVEN** the phone is in `paired` or `recording` state
- **WHEN** the wake lock API is available
- **THEN** the screen stays on

### Requirement: Language Configuration

The phone SHALL pass configured language to the STT provider.

#### Scenario: Single language
- **GIVEN** language is configured as `"en"`
- **WHEN** STT is initialized via provider
- **THEN** the language is passed to the provider config

#### Scenario: Multiple languages
- **GIVEN** language is configured as `["en", "es"]`
- **WHEN** STT is initialized via provider
- **THEN** the languages are passed to the provider config
