# e2e-testing Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: Playwright configuration
The project SHALL use Playwright for e2e tests, configured in apps/example with a webServer that starts the Next.js dev server.

#### Scenario: E2E test execution
- **WHEN** developer runs `pnpm e2e` from apps/example
- **THEN** Playwright starts the Next.js dev server and runs all e2e tests

### Requirement: Session lifecycle e2e test
An e2e test SHALL verify the full session lifecycle: session creation, QR display, and SSE connection.

#### Scenario: Session creation via UI
- **WHEN** the example app loads and the voicefield button is clicked
- **THEN** a QR popup appears containing a valid pairing URL

### Requirement: Pairing flow e2e test
An e2e test SHALL verify that a phone client can pair with a desktop session via the API.

#### Scenario: API-level pairing
- **WHEN** a session is created and a pair request is sent with the correct code and secret
- **THEN** the server responds with a sessionToken and the session state becomes paired

### Requirement: Transcript relay e2e test
An e2e test SHALL verify that transcripts sent by a paired phone arrive at the desktop via SSE.

#### Scenario: Transcript delivery
- **WHEN** a paired phone POSTs a transcript to the server
- **THEN** the desktop SSE stream receives the transcript text

