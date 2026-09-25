
## 2026-09-25 - Keyboard-Focusable Hover Tooltips
**Learning:** Custom interactive elements (like pipeline cards) that rely exclusively on `:hover` to reveal critical contextual information (tooltips) break keyboard navigation, leaving screen reader and keyboard-only users unable to access the details.
**Action:** Add `tabindex="0"` to make the parent container focusable, and include `:focus-visible` along with `:hover` in CSS to ensure tooltips are revealed and style changes apply properly during keyboard navigation.
