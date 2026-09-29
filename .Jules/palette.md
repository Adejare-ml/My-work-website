## 2024-05-24 - Grouping Filter Buttons
**Learning:** When implementing custom filter tabs or buttons that act as mutually exclusive toggles, adding `role="group"` to their container and managing the `aria-pressed` state on each button communicates their relationship and current active state properly to screen readers.
**Action:** Ensure any custom toggle button groups utilize `role="group"` on the wrapper and dynamically update `aria-pressed="true/false"` on the individual buttons via JavaScript.
