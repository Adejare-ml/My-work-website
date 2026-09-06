## 2026-09-06 - Keyboard-Accessible Interactive Tooltips
**Learning:** Interactive CSS-only tooltips are often inaccessible to keyboard users and screen readers unless explicitly wired with `tabindex="0"`, `role="tooltip"`, and `aria-describedby`. The visual hover state needs to be paired with `:focus-visible` to ensure keyboard users can trigger the tooltip.
**Action:** Always add `tabindex="0"` and `aria-describedby` to interactive elements with CSS tooltips, and map `:focus-visible` to the tooltip visibility class.
