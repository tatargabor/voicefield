# Pairing

## Purpose

Handles the cryptographic pairing flow between desktop and phone. The desktop generates a QR code containing a server URL, pairing code, and secret. The phone scans the QR (or enters the code manually) and pairs with the session, receiving a bearer token for subsequent requests.

## Requirements

### Requirement: QR Code Generation

The system SHALL generate a QR code URL containing the phone page URL, server URL, 6-digit pairing code, and 256-bit secret.

#### Scenario: QR URL format
- **GIVEN** a session with code `123456`, secret `abcdef...`, server at `/api/voice`, and phone page at `https://voicefield.dev`
- **WHEN** the QR URL is built
- **THEN** the URL is `https://voicefield.dev/mic?server=/api/voice&code=123456&secret=abcdef...` with the desktop origin prepended to the server path

#### Scenario: LAN mode QR
- **GIVEN** the desktop is running on a private/local network
- **WHEN** the QR URL is built
- **THEN** the system auto-detects the LAN IP via `/network-info` and uses `http://LAN_IP:PORT` as the origin

### Requirement: Pairing Code Utilities

The system SHALL provide utilities to format, normalize, and validate 6-digit pairing codes.

#### Scenario: Format for display
- **GIVEN** a raw code `"123456"`
- **WHEN** formatted for display
- **THEN** the result is `"123 456"`

#### Scenario: Normalize input
- **GIVEN** user input `"1 2 3 4 5 6"`
- **WHEN** normalized
- **THEN** the result is `"123456"`

#### Scenario: Validate code
- **GIVEN** a string input
- **WHEN** validated
- **THEN** it passes if and only if it is exactly 6 digits

### Requirement: Phone Pairing Flow

The system SHALL allow a phone to pair with a session using the pairing code and optional secret.

#### Scenario: Successful pairing with QR (code + secret)
- **GIVEN** a session in `created` state with code and secret
- **WHEN** the phone sends POST /pair with matching code and secret
- **THEN** the session transitions to `paired`, a session token is returned, along with STT temp key, fields, language, and config

#### Scenario: Successful pairing with manual code (no secret)
- **GIVEN** a session in `created` state
- **WHEN** the phone sends POST /pair with matching code but no secret
- **THEN** the pairing succeeds (secret is optional for manual entry)

#### Scenario: Invalid pairing code
- **GIVEN** no session with the provided code
- **WHEN** the phone sends POST /pair
- **THEN** a 400 error is returned

#### Scenario: Wrong secret
- **GIVEN** a session with a secret
- **WHEN** the phone sends POST /pair with incorrect secret
- **THEN** a 400 error is returned

#### Scenario: Pairing code expiry
- **GIVEN** a session in `created` state whose 5-minute pairing TTL has elapsed
- **WHEN** the phone attempts to pair
- **THEN** the session is not found (expired and cleaned up)

### Requirement: Single-Use Pairing

The system SHALL ensure a pairing code can only be used once. After successful pairing, the code is consumed.

#### Scenario: Second pairing attempt
- **GIVEN** a session already in `paired` state
- **WHEN** another phone tries to pair with the same code
- **THEN** the pairing is rejected (session already paired)

### Requirement: QR URL Parsing

The system SHALL provide a utility to parse QR URL parameters back into server, code, and secret values.

#### Scenario: Parse valid QR URL
- **GIVEN** a URL with `?server=...&code=...&secret=...` parameters
- **WHEN** parsed
- **THEN** the server, code, and secret values are extracted

#### Scenario: Parse invalid URL
- **GIVEN** a URL missing required parameters
- **WHEN** parsed
- **THEN** null is returned
