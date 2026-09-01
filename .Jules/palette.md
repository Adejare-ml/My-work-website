## 2026-09-01 - Pipeline Card Tooltip Keyboard Accessibility
**Learning:** The pipeline architecture diagrams use custom interactive cards with hover tooltips for technical specs, but these were inaccessible to keyboard users because the cards weren't focusable and the CSS only triggered on hover.
**Action:** Always ensure interactive elements with custom hover states (like data viz nodes or diagram tooltips) are keyboard focusable (`tabindex="0"`), use `:focus-visible` in CSS, and have proper ARIA bindings (`aria-describedby` mapping to `role="tooltip"`).
