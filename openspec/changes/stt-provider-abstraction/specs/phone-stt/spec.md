# phone-stt (delta)

## MODIFIED Requirements

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
