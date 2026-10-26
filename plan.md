1. **Refactor button loading state in `assets/site.js`**
   - Remove JavaScript DOM manipulation for button text (`submitBtn.textContent = 'Sending…'`) and rely purely on CSS for loading feedback.
2. **Improve disabled and loading button states in `assets/site.css`**
   - Add `.btn:disabled { opacity: 0.6; cursor: not-allowed; }` for clarity on disabled actions.
   - Refine `.btn:hover` and `.btn:active` rules with `:not(:disabled):not([aria-busy="true"])` to prevent hover effects on disabled/loading buttons.
   - Update `.btn[aria-busy="true"]` to `color: transparent !important;` (and its children) to hide text while preserving button width.
   - Update `.btn[aria-busy="true"]::after` (or `::before`) to position absolute in the center, and use explicit `border-color` (e.g., `var(--text-1)` or `var(--bg)`) since `currentColor` will be transparent.
3. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit changes**
   - Commit and push to a new branch for PR review.
