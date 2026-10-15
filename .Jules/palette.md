## 2026-10-15 - CSS-Driven Async Button Loading State
**Learning:** Hardcoding loading state text (e.g., 'sending...') in JavaScript modifies DOM structure unnecessarily and can conflict with internationalization or UI consistency.
**Action:** Use CSS pseudo-elements (e.g. `::after` loading rings) triggered by accessibility state attributes like `[aria-busy="true"]` for visual loading feedback instead of directly manipulating text nodes.
