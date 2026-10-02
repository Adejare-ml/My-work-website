## 2024-10-02 - Accessible Filter Toggles
**Learning:** Filter buttons using `.is-active` classes for visual state leave screen readers unaware of the toggle state. Relying solely on CSS classes for UI state hides critical context from assistive technologies.
**Action:** Always pair visual active state classes (e.g., `.is-active`) with `aria-pressed="true"|"false"` on toggle buttons to keep accessible and visual states synchronized.
