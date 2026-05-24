# STT Providers

## Purpose

Defines the pluggable STT provider system. Providers are factory functions that accept configuration and return controllable instances. Ships with Soniox (cloud) and Web Speech API (browser-native) providers, with a registry for lookup by name.

## Requirements

### Requirement: Provider Factory Interface

The system SHALL define an STT provider as a factory function that accepts configuration and returns a controllable instance.

#### Scenario: Factory signature
- **GIVEN** a provider factory (e.g., `createSonioxProvider`)
- **WHEN** called with `STTProviderConfig` containing `sttKey`, `language`, `onPartial`, `onFinal`, `onError`
- **THEN** it returns an `STTProviderInstance` with `start()` and `stop()` methods

#### Scenario: Start begins recognition
- **GIVEN** a provider instance
- **WHEN** `start()` is called
- **THEN** the provider requests microphone access and begins speech recognition, calling `onPartial` and `onFinal` callbacks as results arrive

#### Scenario: Stop ends recognition
- **GIVEN** a recording provider instance
- **WHEN** `stop()` is called
- **THEN** speech recognition stops and microphone is released

#### Scenario: Error handling
- **GIVEN** a provider instance encounters an error (mic denied, network failure, etc.)
- **WHEN** the error occurs
- **THEN** `onError` is called with the error and the provider stops

### Requirement: Provider Registry

The system SHALL maintain a registry mapping provider names to factory functions.

#### Scenario: Get built-in provider
- **GIVEN** the registry contains `"soniox"` and `"web-speech"` providers
- **WHEN** `getProvider("soniox")` is called
- **THEN** the Soniox factory function is returned

#### Scenario: Unknown provider
- **GIVEN** a request for an unregistered provider name
- **WHEN** `getProvider("unknown")` is called
- **THEN** an error is thrown

### Requirement: Soniox Provider

The system SHALL provide a built-in Soniox STT provider that dynamically imports `@soniox/client` and uses its real-time WebSocket streaming.

#### Scenario: Soniox recording
- **GIVEN** the soniox provider is selected and a valid `sttKey` is provided
- **WHEN** `start()` is called
- **THEN** `@soniox/client` is dynamically imported, a `SonioxClient` is created with the key, and `client.realtime.record()` begins streaming with the configured language hints

#### Scenario: Soniox partial results
- **GIVEN** the soniox provider is recording
- **WHEN** Soniox emits a result where not all tokens are final
- **THEN** `onPartial` is called with the concatenated token text

#### Scenario: Soniox final results
- **GIVEN** the soniox provider is recording
- **WHEN** Soniox emits a result where all tokens are final
- **THEN** `onFinal` is called with the concatenated token text

#### Scenario: Soniox client not installed
- **GIVEN** `@soniox/client` is not available (not installed)
- **WHEN** the soniox provider's `start()` is called
- **THEN** `onError` is called with a descriptive error about the missing dependency

### Requirement: Web Speech API Provider

The system SHALL provide a built-in Web Speech API provider that uses the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API.

#### Scenario: Web Speech recording
- **GIVEN** the web-speech provider is selected
- **WHEN** `start()` is called
- **THEN** a `SpeechRecognition` instance is created with `continuous: true`, `interimResults: true`, and the configured language

#### Scenario: Web Speech partial results
- **GIVEN** the web-speech provider is recording
- **WHEN** the `onresult` event fires with non-final results
- **THEN** `onPartial` is called with the interim transcript text

#### Scenario: Web Speech final results
- **GIVEN** the web-speech provider is recording
- **WHEN** the `onresult` event fires with a final result
- **THEN** `onFinal` is called with the final transcript text

#### Scenario: Web Speech not supported
- **GIVEN** the browser does not support `SpeechRecognition` or `webkitSpeechRecognition`
- **WHEN** the web-speech provider's `start()` is called
- **THEN** `onError` is called with a descriptive error about browser compatibility

#### Scenario: No API key needed
- **GIVEN** the web-speech provider is selected
- **WHEN** config has `sttKey: null`
- **THEN** the provider works without an API key (browser-native, no external service)

#### Scenario: Language configuration
- **GIVEN** the web-speech provider with language `"en"` or `["en", "hu"]`
- **WHEN** `start()` is called
- **THEN** the first language in the array (or the single language) is set as `recognition.lang`
