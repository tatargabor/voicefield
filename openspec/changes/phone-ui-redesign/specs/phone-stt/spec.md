## MODIFIED Requirements

### Requirement: Field Selection

The phone SHALL display a field selector when multiple fields are registered, and respond to field switch commands from the desktop. The field selector SHALL use a horizontal pill/chip bar instead of a native dropdown, showing all fields simultaneously with the active field visually highlighted.

#### Scenario: Multiple fields

- **WHEN** the session has multiple registered fields and the phone is in `paired` or `recording` state
- **THEN** a horizontal row of pill-shaped buttons is displayed, one per field
- **THEN** the active field's pill SHALL have a filled blue (#2563eb) background with white text
- **THEN** inactive field pills SHALL have a white background with a border (#e5e7eb) and dark text

#### Scenario: Field selection via pill tap

- **WHEN** the user taps an inactive field pill
- **THEN** that field becomes active and its pill transitions to the filled/active style
- **THEN** the previously active pill transitions to the inactive/outlined style

#### Scenario: Many fields overflow

- **WHEN** there are more fields than fit in a single row
- **THEN** the pill bar SHALL scroll horizontally with momentum scrolling enabled
- **THEN** no fields SHALL be hidden behind an extra interaction (no dropdown/modal)

#### Scenario: Single field

- **WHEN** the session has exactly one registered field
- **THEN** a single field badge is displayed (no selector interaction needed)

#### Scenario: Desktop switches field

- **GIVEN** the phone is polling GET /status
- **WHEN** a `switch_field` command is received
- **THEN** the phone switches to the specified field and the pill bar updates to reflect the new active field

## ADDED Requirements

### Requirement: Consistent Mic Icon

The microphone icon SVG SHALL be identical across the phone page mic button and the desktop example app field buttons. The canonical icon is a Lucide-style mic: a rounded-rect microphone body, a curved pickup arc below, and a vertical stand line.

#### Scenario: Phone mic button icon

- **WHEN** the phone is in `paired` state (not recording)
- **THEN** the mic button displays the canonical mic SVG icon in white on blue (#2563eb) background

#### Scenario: Desktop field button icon

- **WHEN** a voicefield-enabled field renders its mic button in the example app
- **THEN** the button displays the same canonical mic SVG icon as the phone page
