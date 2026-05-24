# pairing (delta)

## MODIFIED Requirements

### Requirement: Phone Pairing Flow

#### Scenario: Successful pairing with QR (code + secret)
- **GIVEN** a session in `created` state with code and secret
- **WHEN** the phone sends POST /pair with matching code and secret
- **THEN** the session transitions to `paired`, a session token is returned, along with `sttProvider` name, `sttKey` (or null for keyless providers), `sttKeyExpiresAt` (or null), fields, language, and config

#### Scenario: Pairing without STT key configured
- **GIVEN** a session where the server has no `generateSttKey`
- **WHEN** the phone pairs
- **THEN** the response includes `sttProvider: "web-speech"`, `sttKey: null`, `sttKeyExpiresAt: null`

#### Scenario: Pairing with STT key configured
- **GIVEN** a session where the server has `generateSttKey`
- **WHEN** the phone pairs
- **THEN** the response includes `sttProvider: "soniox"`, `sttKey: "<key>"`, `sttKeyExpiresAt: <timestamp>`
