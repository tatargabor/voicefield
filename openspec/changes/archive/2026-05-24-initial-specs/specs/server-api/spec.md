# server-api (delta)

## ADDED Requirements

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
