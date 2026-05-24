## Context

The phone page (`packages/react/src/phone-page.tsx`) is a self-contained 648-line React component using inline styles and a `<style>` tag for animations. No external CSS framework. The UI has two main states: `code_entry` (pairing form) and `paired` (recording interface with field selector, mic button, transcript box).

Current issues:
- **Field selector**: Plain native `<select>` element — looks like a system dropdown, not a polished mobile UI
- **Mic icon**: Phone page uses a custom SVG mic, but desktop example app buttons (`form-demo.tsx`, `chat-demo.tsx`) use a different mic icon with different proportions — visual inconsistency

## Goals / Non-Goals

**Goals:**
- Replace native `<select>` with a custom pill/chip-based field selector that shows all options simultaneously
- Unify the mic icon SVG across phone page and desktop example components
- Improve visual polish of the paired state (spacing, hierarchy, touch targets)

**Non-Goals:**
- Changing the `code_entry` state design (pairing flow works fine)
- Adding new functionality or state management changes
- Introducing CSS framework dependencies (Tailwind, etc.)
- Changing the color palette or animation system
- Redesigning the desktop QR popup

## Decisions

### Field selector: Pill/chip bar instead of dropdown

Replace the native `<select>` with a horizontal scrollable row of pill-shaped buttons. The active field gets a filled blue background; inactive fields get an outlined style. Each pill shows the field label and a small mic icon.

**Why not a custom dropdown/modal?** Pills show all options at once — no extra tap needed. Phone forms rarely have more than 3-5 fields, so a scrollable row works well. If there are many fields, horizontal scroll handles overflow naturally.

**Why not a bottom sheet?** Adds complexity (overlay management, animations) for minimal benefit with typical field counts.

### Mic icon: Standardize on Lucide-style mic SVG

Use a single consistent mic icon definition. The current phone page icon is close to Lucide's `Mic` icon but the desktop buttons use a slightly different path. Standardize on the phone page's existing mic SVG (which is cleaner) and propagate it to the desktop example components.

### Styling approach: Keep inline styles + CSS-in-component

No external dependencies. Continue using the existing pattern of a styles object (`s`) plus a `<style>` tag for animations. This keeps the component self-contained and zero-dep.

## Risks / Trade-offs

- **Many fields overflow**: If a form has 10+ fields, the pill bar scrolls horizontally. This is fine for typical use (2-5 fields) but less discoverable than a dropdown for extreme cases. → Mitigation: Add `overflow-x: auto` with `-webkit-overflow-scrolling: touch` for smooth momentum scroll.
- **Icon change in example app**: Desktop example buttons change appearance slightly. → Mitigation: The example app is a demo, not a public-facing product — minor visual change is acceptable.
