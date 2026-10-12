## 2024-05-15 - [Disabled Button States]
**Learning:** The application disables the submit button and adds `aria-busy="true"` dynamically during form submission but the `.btn` class lacked visual indicators for these states.
**Action:** Always verify that interactive components have defined `:disabled` or `[aria-busy="true"]` styles with appropriate visual cues (e.g., `opacity` and `cursor: not-allowed`), and ensure hover/active states use `:not(:disabled):not([aria-busy="true"])` so interactions are suppressed cleanly without `!important` or `pointer-events: none` hacks.
