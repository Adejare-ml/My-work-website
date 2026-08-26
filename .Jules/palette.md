## 2026-08-26 - Add aria-pressed to filter buttons
**Learning:** Found that custom filter buttons acting as toggle states (e.g. in projects.html) relied entirely on visual styling (.is-active) to convey state. Screen readers had no context for which category was active.
**Action:** Always verify toggle button patterns in this codebase for aria-pressed or aria-expanded. When adding interactive filters, coordinate static aria-pressed="true"/"false" in HTML with dynamic updates in the associated vanilla JS (like assets/site.js).
