## 2024-10-24 - Project Filter Button Accessibility
**Learning:** Filter buttons that function as toggle switches need `aria-pressed` to communicate their state to screen readers. Relying only on visual classes (`is-active`) hides the active state from assistive technologies.
**Action:** Always pair visual active states (`is-active`) with semantic state attributes (`aria-pressed` or `aria-selected` depending on role) in JavaScript and initial HTML.
