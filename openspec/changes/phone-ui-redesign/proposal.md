## Why

The phone page UI (`packages/react/src/phone-page.tsx`) has several visual quality issues that make the product feel unpolished. The multi-field selector is a plain native `<select>` dropdown which looks out of place in a modern mobile UI. The microphone icon on the phone page doesn't match the mic icon used in the desktop example app's field buttons, creating visual inconsistency across the product.

## What Changes

- Replace the native `<select>` dropdown for multi-field selection with a custom pill/chip-based selector that shows all fields at once and highlights the active one
- Unify the microphone SVG icon across phone page and desktop field buttons so they match visually
- Polish the overall phone paired-state UI: improve spacing, visual hierarchy, and touch targets
- Keep the existing color palette (blue primary, red recording, green connected) and animation system

## Capabilities

### New Capabilities

_None — this is a visual polish change within existing capabilities._

### Modified Capabilities

- `phone-stt`: The phone page UI components (field selector, mic button) are being redesigned while preserving all existing behavior and state management

## Impact

- `packages/react/src/phone-page.tsx` — primary file being modified (field selector UI, mic icon SVG, layout styles)
- `apps/example/app/components/form-demo.tsx` — mic icon SVG updated to match unified icon
- `apps/example/app/components/chat-demo.tsx` — mic icon SVG updated to match unified icon
- No API changes, no new dependencies, no breaking changes
- Phone page is exported as `@voicefield/react/phone` — consumers get the update automatically
