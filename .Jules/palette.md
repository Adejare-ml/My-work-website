## 2026-10-04 - Adding Accessible Filter States
**Learning:** Custom filter tabs styled as buttons lack native stateful accessibility out of the box, unlike checkboxes or radio buttons, rendering visual active states invisible to screen reader users.
**Action:** Ensure custom tab/filter systems implement the `role="group"` wrapper and explicitly toggle `aria-pressed` states via JavaScript when the corresponding `is-active` visual classes change.
