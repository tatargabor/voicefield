## 1. Field Selector Redesign

- [x] 1.1 Replace the native `<select>` in phone-page.tsx with a horizontal pill/chip bar component (a `<div>` with `display: flex`, `gap`, `overflow-x: auto`)
- [x] 1.2 Style active pill (filled blue #2563eb background, white text, border-radius pill shape) and inactive pills (white background, #e5e7eb border, dark text)
- [x] 1.3 Add `onClick` handler on each pill to call `setActiveFieldId` and ensure the active pill updates visually on desktop `switch_field` commands
- [x] 1.4 Add momentum scrolling (`-webkit-overflow-scrolling: touch`, `scrollbar-width: none`) for overflow with many fields
- [x] 1.5 Keep the single-field badge as-is (no interaction needed for one field)

## 2. Mic Icon Unification

- [x] 2.1 Define the canonical mic SVG (Lucide-style: rounded body path, curved pickup arc, vertical stand line) — use the existing phone-page.tsx mic icon as the baseline
- [x] 2.2 Update mic icon SVG in `apps/example/app/components/form-demo.tsx` to match the canonical icon
- [x] 2.3 Update mic icon SVG in `apps/example/app/components/chat-demo.tsx` to match the canonical icon

## 3. Visual Polish

- [x] 3.1 Review and adjust spacing/padding in the paired state layout (mic button area, field selector, transcript box) for better visual hierarchy
- [x] 3.2 Ensure pill touch targets are at least 44px tall (mobile accessibility guideline)
- [x] 3.3 Verify the recording state (red background, pulse animation) still works correctly with the new pill bar

## 4. Testing

- [x] 4.1 Build all packages (`pnpm build`) and verify no type errors
- [x] 4.2 Run `pnpm test` and `pnpm lint` to catch regressions
- [x] 4.3 Test phone page manually in mobile viewport (multi-field and single-field scenarios)
