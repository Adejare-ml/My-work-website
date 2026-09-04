## 2024-05-18 - [Keyboard Accessibility for Tooltips]
**Learning:** Custom interactive elements like .pipeline-card that reveal content (.pipeline-card-tooltip) on hover are often inaccessible to keyboard users because they lack `tabindex="0"` and focus states.
**Action:** Ensure custom interactive elements have a `tabindex="0"` if they act as buttons or reveal information on focus, and implement `:focus-visible` styles so tooltips become visible when focused using the keyboard.
