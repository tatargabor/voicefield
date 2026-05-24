# desktop-hook (delta)

## ADDED Requirements

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
### Requirement: QR Session Rotation

The hook SHALL rotate the session if the QR is displayed for too long without pairing.

#### Scenario: QR timeout
- **GIVEN** QR is visible and 5 minutes pass without pairing
- **WHEN** the timeout fires
- **THEN** the current session is ended and a new one is created with a fresh QR code

### Requirement: Field Management
### Requirement: Field Switching via Desktop

The hook SHALL allow the desktop to switch the active field on the phone.

#### Scenario: Switch field
- **GIVEN** a paired session with multiple fields
- **WHEN** `switchField(fieldId)` is called
- **THEN** POST /command is sent with `{ type: "switch_field", fieldId }` and the local activeFieldId updates

### Requirement: LAN Auto-Detection
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
