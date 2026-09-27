## 2024-05-24 - Toggle Button State Accessibility
**Learning:** For interactive elements like filter buttons that function as toggles (e.g., active/inactive state), relying solely on visual cues like a CSS class (`.is-active`) leaves screen reader users unaware of the current state.
**Action:** Use `aria-pressed="true"` on the currently active toggle button and `aria-pressed="false"` on the inactive ones. Ensure these attributes are dynamically updated in JavaScript when the state changes.
