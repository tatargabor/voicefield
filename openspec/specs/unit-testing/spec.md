# unit-testing Specification

## Purpose
TBD - created by archiving change dx-modernization. Update Purpose after archive.
## Requirements
### Requirement: Vitest workspace configuration
The project SHALL use Vitest as the unit test runner with a workspace config at the monorepo root that includes packages/core and packages/server.

#### Scenario: Running tests from root
- **WHEN** developer runs `pnpm test` from the monorepo root
- **THEN** Vitest executes tests across all configured workspace packages

#### Scenario: Running tests for a single package
- **WHEN** developer runs `pnpm test` from within `packages/core`
- **THEN** only tests in that package are executed

### Requirement: Core package test coverage
The packages/core package SHALL have unit tests covering pairing utilities (formatPairingCode, normalizePairingCode, isValidPairingCode, buildQRUrl, parseQRUrl).

#### Scenario: Pairing code validation
- **WHEN** a 6-digit numeric string is passed to isValidPairingCode
- **THEN** the function returns true

#### Scenario: Pairing code formatting
- **WHEN** "123456" is passed to formatPairingCode
- **THEN** it returns "123-456"

#### Scenario: QR URL construction
- **WHEN** buildQRUrl is called with a server URL and pairing code
- **THEN** it returns a well-formed URL containing both parameters

### Requirement: Server package test coverage
The packages/server package SHALL have unit tests covering session lifecycle (create, pair, end) and request authentication.

#### Scenario: Session creation
- **WHEN** createSession is called
- **THEN** it returns a session with a valid pairingCode and secret

#### Scenario: Session pairing
- **WHEN** pairSession is called with correct code and secret
- **THEN** the session transitions to paired state and returns a sessionToken

#### Scenario: Invalid pairing attempt
- **WHEN** pairSession is called with an incorrect code
- **THEN** the pairing fails and no token is issued

