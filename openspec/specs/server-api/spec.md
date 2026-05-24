# Server API

## Purpose

Defines the HTTP API surface exposed by `createVoicefieldHandler`. All routes are served under a Next.js catch-all route (`[...voicefield]`). Covers routing, authentication, CORS, error handling, and the handler factory pattern.

## Requirements

### Requirement: Handler Factory

The system SHALL provide a `createVoicefieldHandler` factory function that returns `{ GET, POST, OPTIONS }` route handlers compatible with Next.js App Router.

#### Scenario: Basic setup
- **GIVEN** a Next.js catch-all route file
- **WHEN** `createVoicefieldHandler(config)` is called
- **THEN** GET, POST, and OPTIONS handlers are returned, ready for export

#### Scenario: STT key configuration
- **GIVEN** a `generateSTTKey` function in config
- **WHEN** a phone pairs
- **THEN** the function is called to generate a temporary Soniox API key

#### Scenario: No STT configured
- **GIVEN** no `generateSTTKey` in config
- **WHEN** a session is created
- **THEN** POST /session returns 503 Service Unavailable

### Requirement: Route Dispatch

The handler SHALL dispatch requests based on method + path segments.

| Method | Path | Handler |
|--------|------|---------|
| POST | `/session` | Create session |
| POST | `/pair` | Phone pairing |
| POST | `/transcript` | Submit transcript |
| GET | `/transcript` | SSE subscription |
| POST | `/session/end` | End session |
| POST | `/command` | Desktop command |
| POST | `/refresh-key` | Refresh STT key |
| GET | `/status` | Phone status poll |
| GET | `/network-info` | LAN IP discovery |
| OPTIONS | `*` | CORS preflight |

#### Scenario: Unknown route
- **GIVEN** a request to an unknown path
- **WHEN** dispatched
- **THEN** a 404 response is returned

### Requirement: Bearer Token Authentication

Routes requiring phone authentication SHALL validate the `Authorization: Bearer {token}` header against the session store.

#### Scenario: Valid token
- **GIVEN** a request with a valid bearer token
- **WHEN** the token matches a non-expired session
- **THEN** the request proceeds

#### Scenario: Missing token
- **GIVEN** a request without an Authorization header
- **WHEN** a protected route is accessed
- **THEN** a 401 response is returned

#### Scenario: Expired session token
- **GIVEN** a request with a token for an expired session
- **WHEN** a protected route is accessed
- **THEN** a 401 response is returned

**Protected routes**: POST /transcript, POST /refresh-key, GET /status

### Requirement: CORS Handling

The handler SHALL support configurable CORS with proper preflight responses.

#### Scenario: Wildcard origins
- **GIVEN** `cors: { origins: ["*"] }` in config
- **WHEN** any origin sends a request
- **THEN** the response includes `Access-Control-Allow-Origin: {request origin}`

#### Scenario: Specific origins
- **GIVEN** `cors: { origins: ["https://voicefield.dev"] }` in config
- **WHEN** a request comes from `https://voicefield.dev`
- **THEN** the response includes `Access-Control-Allow-Origin: https://voicefield.dev`

#### Scenario: Disallowed origin
- **GIVEN** specific origins configured
- **WHEN** a request comes from an unlisted origin
- **THEN** the CORS origin header is not set

#### Scenario: Preflight
- **GIVEN** an OPTIONS request
- **WHEN** received on any path
- **THEN** a 204 response is returned with CORS headers including `Access-Control-Allow-Methods: GET, POST, OPTIONS` and `Access-Control-Allow-Headers: Content-Type, Authorization` and `Access-Control-Max-Age: 86400`

### Requirement: Network Info Endpoint

The handler SHALL provide a GET /network-info endpoint that returns the server's LAN IP addresses.

#### Scenario: LAN IP detection
- **GIVEN** the server is running on a machine with network interfaces
- **WHEN** GET /network-info is called
- **THEN** the response includes `{ lan: ["http://192.168.x.x:PORT/path"], localhost: "http://localhost:PORT/path" }`

#### Scenario: HTTPS proxy detection
- **GIVEN** the server is behind a reverse proxy with `x-forwarded-proto: https` and `x-forwarded-port: 443`
- **WHEN** GET /network-info is called
- **THEN** the response uses the forwarded protocol and port

### Requirement: Error Responses

The handler SHALL return consistent JSON error responses.

#### Scenario: Validation error
- **GIVEN** a request with invalid/missing required fields
- **WHEN** processed
- **THEN** a 400 response with `{ error: "descriptive message" }` is returned

#### Scenario: Auth error
- **GIVEN** an unauthorized request
- **WHEN** processed
- **THEN** a 401 response with `{ error: "Unauthorized" }` is returned

#### Scenario: Not found
- **GIVEN** a request referencing a non-existent session
- **WHEN** processed
- **THEN** a 404 response with `{ error: "Session not found" }` is returned

#### Scenario: Server error
- **GIVEN** an internal error (e.g., STT key generation fails)
- **WHEN** processed
- **THEN** a 500 response with `{ error: "descriptive message" }` is returned
