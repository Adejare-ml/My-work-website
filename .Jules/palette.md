## 2024-03-22 - Tooltips & Toggle Arrays
**Learning:** Tooltips that appear only on `:hover` cause WCAG keyboard navigation violations; arrays of visually active/inactive filters need proper structural grouping and explicit toggle state announcements since screen readers won’t inherently describe CSS classes alone.
**Action:** Always map interactive tooltips to `:focus-visible` alongside `:hover` and leverage `role="group"` with explicit `aria-pressed="true|false"` management for toggles.
