# Field Registry

## Purpose

Manages the set of voice-enabled form fields on the desktop. Tracks which fields are registered, which is active, and handles injecting transcribed text into DOM elements or custom setter functions — including partial (in-progress) and final (committed) text.

## Requirements

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

The system SHALL allow unregistering fields by id.

#### Scenario: Unregister active field
- **GIVEN** the active field is unregistered
- **WHEN** other fields remain
- **THEN** the next field in the registry becomes active

#### Scenario: Unregister non-active field
- **GIVEN** a non-active field is unregistered
- **WHEN** the active field still exists
- **THEN** the active field remains unchanged

### Requirement: Active Field Switching

The system SHALL allow switching the active field, which determines where transcribed text is injected.

#### Scenario: Switch active field
- **GIVEN** multiple registered fields
- **WHEN** `setActiveField(id)` is called
- **THEN** the specified field becomes the active target for text injection

### Requirement: Text Injection — DOM Elements

The system SHALL inject transcribed text into DOM input/textarea elements, handling both partial and final text correctly.

#### Scenario: Partial text injection
- **GIVEN** a registered DOM element with existing value "Hello "
- **WHEN** a partial transcript `"world"` arrives (isFinal=false)
- **THEN** the element displays "Hello world" and the base text "Hello " is stored in `data-voicefield-base`

#### Scenario: Consecutive partials
- **GIVEN** a registered DOM element showing partial text "Hello world"
- **WHEN** a new partial `"world today"` arrives
- **THEN** the element reverts to base text and shows "Hello world today" (partials replace, not accumulate)

#### Scenario: Final text injection
- **GIVEN** a registered DOM element
- **WHEN** a final transcript `"world"` arrives (isFinal=true)
- **THEN** the text is appended to the element's value with a space separator, and `data-voicefield-base` is cleared

#### Scenario: Input event fired
- **GIVEN** text is injected into a DOM element
- **WHEN** the value changes
- **THEN** an `input` event is fired on the element for React/form reactivity

### Requirement: Text Injection — Custom Setters

The system SHALL delegate text injection to custom setter functions when provided.

#### Scenario: Setter receives text
- **GIVEN** a field registered with a custom setter
- **WHEN** a transcript arrives
- **THEN** the setter is called with `(text, isFinal)`

### Requirement: Partial Text Cleanup

The system SHALL provide methods to clear or finalize partial text.

#### Scenario: Clear partial
- **GIVEN** a DOM element displaying partial text with a stored base
- **WHEN** `clearPartial(fieldId)` is called
- **THEN** the element reverts to its base text and `data-voicefield-base` is removed

#### Scenario: Finalize partial
- **GIVEN** a DOM element with `data-voicefield-base` set
- **WHEN** `finalizePartial(fieldId)` is called
- **THEN** `data-voicefield-base` is removed (current display text is kept)

### Requirement: Field List Export

The system SHALL export the list of registered fields as `VoiceField[]` for transmission to the phone during pairing.

#### Scenario: Get fields
- **GIVEN** three registered fields
- **WHEN** `getFields()` is called
- **THEN** an array of `{ id, label }` objects is returned for all registered fields
