## 2025-05-18 - Prevent layout shift on loading buttons
**Learning:** Re-writing the DOM text Content (e.g. `submitBtn.textContent = 'Sending…'`) during loading states causes annoying layout shifts and can destroy nested elements like SVGs or icons.
**Action:** Use CSS pseudo-elements for the loading spinner. Set `color: transparent !important` on the button and its children while loading, and place an absolutely positioned `::after` element with a spinner in the center. Ensure you explicitly set the spinner border color using CSS variables, as `currentColor` will evaluate to transparent.
