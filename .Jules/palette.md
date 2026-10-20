## 2023-10-20 - CSS Pseudo-element Loading Spinner
**Learning:** Using `color: transparent !important;` to hide button text during an `aria-busy="true"` state allows for a clean CSS-only loading spinner (via `::after`) without shifting the layout or requiring DOM manipulation, but it means `currentColor` becomes transparent and cannot be used for the spinner border.
**Action:** Explicitly set border colors for pseudo-element spinners using context-appropriate CSS variables (e.g., `var(--ink)` or `var(--bg)`) instead of relying on `currentColor`.
