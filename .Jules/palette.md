## 2024-05-18 - Add loading spinner to async submit button
**Learning:** Using JS to change `textContent` to "sending…" for async buttons changes the button's calculated width, which can cause layout shifts. Also, a spinning CSS indicator is a more standard and recognizable pattern than just changing text to "sending…".
**Action:** Use CSS pseudo-elements (`::after`) on `[aria-busy="true"]` states to render a loading spinner, and set `color: transparent !important;` to hide the original text while preserving the button's original width.
