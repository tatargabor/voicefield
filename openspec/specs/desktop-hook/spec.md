# Desktop Hook

## Purpose

The `useVoicefield` React hook provides the desktop-side integration point. It manages the full session lifecycle — creation, QR display, SSE subscription, text injection into fields, and session teardown. Also handles LAN auto-detection for local development.

## Requirements

### Requirement: Session Lifecycle Management

The hook SHALL manage the full session lifecycle from creation to teardown.

#### Scenario: Show QR creates session
- **GIVEN** no active session
- **WHEN** `showQR()` is called
- **THEN** a new session is created via POST /session, the QR popup becomes visible, and SSE subscription starts

#### Scenario: Hide QR keeps session
- **GIVEN** an active session with visible QR
- **WHEN** `hideQR()` is called
- **THEN** the QR popup hides but the session remains active

#### Scenario: End session
- **GIVEN** an active session
- **WHEN** `endSession()` is called
- **THEN** POST /session/end is sent, SSE connection is closed, and all session state is reset

### Requirement: SSE Event Handling

The hook SHALL subscribe to SSE events and update state accordingly.

#### Scenario: Paired event
- **GIVEN** SSE is connected
- **WHEN** a `paired` event is received
- **THEN** `isPaired` becomes true and `sessionState` updates

#### Scenario: Transcript event
- **GIVEN** SSE is connected and a field is registered
- **WHEN** a `transcript` event is received
- **THEN** the text is injected into the target field via the field registry

#### Scenario: Recording state events
- **GIVEN** SSE is connected
- **WHEN** `recording_start` or `recording_stop` events are received
- **THEN** `isRecording` updates accordingly

#### Scenario: Session ended event
- **GIVEN** SSE is connected
- **WHEN** a `session_ended` event is received
- **THEN** the session state resets and SSE connection closes

#### Scenario: Field switched event
- **GIVEN** SSE is connected
- **WHEN** a `field_switched` event is received
- **THEN** the `activeFieldId` updates to the new field

### Requirement: QR Session Rotation

The hook SHALL rotate the session if the QR is displayed for too long without pairing.

#### Scenario: QR timeout
- **GIVEN** QR is visible and 5 minutes pass without pairing
- **WHEN** the timeout fires
- **THEN** the current session is ended and a new one is created with a fresh QR code

### Requirement: Field Management

The hook SHALL provide `register` and `unregister` methods that delegate to the FieldRegistry.

#### Scenario: Register field
- **GIVEN** the hook is active
- **WHEN** `register(id, label, element, setter)` is called
- **THEN** the field is added to the internal registry

#### Scenario: Unregister field
- **GIVEN** a registered field
- **WHEN** `unregister(id)` is called
- **THEN** the field is removed from the registry

### Requirement: Field Switching via Desktop

The hook SHALL allow the desktop to switch the active field on the phone.

#### Scenario: Switch field
- **GIVEN** a paired session with multiple fields
- **WHEN** `switchField(fieldId)` is called
- **THEN** POST /command is sent with `{ type: "switch_field", fieldId }` and the local activeFieldId updates

### Requirement: LAN Auto-Detection

The hook SHALL auto-detect the LAN IP when running on a private/local network, so the QR code points to an address reachable by the phone.

#### Scenario: Local development
- **GIVEN** the desktop origin is localhost or a private IP
- **WHEN** a session is created
- **THEN** the hook fetches GET /network-info to discover the LAN IP and uses it for the QR code URL

#### Scenario: Production
- **GIVEN** the desktop origin is a public domain
- **WHEN** a session is created
- **THEN** the hook uses the current origin as-is for the QR code URL

### Requirement: Exposed State

The hook SHALL expose the following state to the consumer:

| State | Type | Description |
|-------|------|-------------|
| `sessionId` | `string \| null` | Current session ID |
| `pairingCode` | `string \| null` | Formatted 6-digit code |
| `secret` | `string \| null` | 256-bit hex secret |
| `sessionState` | `SessionState \| "disconnected" \| null` | Current state |
| `isPaired` | `boolean` | Whether phone is paired |
| `isRecording` | `boolean` | Whether phone is recording |
| `isQRVisible` | `boolean` | Whether QR popup is showing |
| `fields` | `VoiceField[]` | Registered fields |
| `activeFieldId` | `string \| null` | Currently active field |
| `serverUrl` | `string` | Resolved API URL |
| `phoneUrl` | `string` | Resolved phone page URL |
