# server-api (delta)

## MODIFIED Requirements

### Requirement: Handler Factory

#### Scenario: STT key configuration
- **GIVEN** a `generateSttKey` function in config
- **WHEN** a phone pairs
- **THEN** the function is called to generate a temporary STT API key

#### Scenario: No STT configured
- **GIVEN** no `generateSttKey` in config
- **WHEN** a session is created
- **THEN** session creation succeeds (no 503). The server will return `sttProvider: "web-speech"` and `sttKey: null` on pairing.

## RENAMED Requirements

- FROM: `generateSTTKey`
- TO: `generateSttKey` (in `VoicefieldServerConfig`)
