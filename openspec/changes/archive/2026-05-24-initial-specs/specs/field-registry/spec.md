# field-registry (delta)

## ADDED Requirements

### Requirement: Field Registration

The system SHALL allow registering voice-enabled fields with an id, label, optional DOM element, and optional custom setter function.

#### Scenario: Register with DOM element
- **GIVEN** an input or textarea element
- **WHEN** registered with an id and label
- **THEN** the field is tracked and available for text injection via DOM manipulation

#### Scenario: Register with custom setter
- **GIVEN** a custom setter function `(value: string, isFinal: boolean) => void`
- **WHEN** registered with an id and label
- **THEN** the field is tracked and available for text injection via the setter

#### Scenario: First field becomes active
- **GIVEN** no fields are registered
- **WHEN** the first field is registered
- **THEN** it becomes the active field automatically

### Requirement: Field Unregistration
### Requirement: Active Field Switching

The system SHALL allow switching the active field, which determines where transcribed text is injected.

#### Scenario: Switch active field
- **GIVEN** multiple registered fields
- **WHEN** `setActiveField(id)` is called
- **THEN** the specified field becomes the active target for text injection

### Requirement: Text Injection — DOM Elements
### Requirement: Text Injection — Custom Setters

The system SHALL delegate text injection to custom setter functions when provided.

#### Scenario: Setter receives text
- **GIVEN** a field registered with a custom setter
- **WHEN** a transcript arrives
- **THEN** the setter is called with `(text, isFinal)`

### Requirement: Partial Text Cleanup
### Requirement: Field List Export

The system SHALL export the list of registered fields as `VoiceField[]` for transmission to the phone during pairing.

#### Scenario: Get fields
- **GIVEN** three registered fields
- **WHEN** `getFields()` is called
- **THEN** an array of `{ id, label }` objects is returned for all registered fields
