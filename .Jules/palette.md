## 2026-10-27 - [Toggle Button State Clarity]
**Learning:** Filter buttons using active classes for visual styling (e.g. `is-active`) lack semantic context for screen readers regarding their toggle state, unlike checkboxes or radio buttons.
**Action:** When implementing custom toggle buttons that filter content or change view states, always explicitly pair the active class with the `aria-pressed="true"`/`"false"` attribute and update it dynamically via JavaScript.
