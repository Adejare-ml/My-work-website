## 2025-05-18 - Prevent layout shift on loading buttons
**Learning:** Rewriting button text during async loading causes layout shifts and can remove nested icons. A CSS pseudo-element spinner can preserve the button label and width.
**Action:** Keep the original text in the DOM, visually hide it while loading, and use a centered pseudo-element spinner with an explicit theme border color.

## 2026-10-26 - Give abbreviated controls clear accessible names
**Learning:** Short or icon-only button text may not explain the action when announced out of context.
**Action:** Add concise `aria-label` values that describe the action while retaining the visible button text.

## 2026-10-27 - Simulate network latency for static loading states
**Learning:** When building static prototypes or purely client-side validation logic without a real backend, form submission events execute instantaneously. This hides any CSS `[aria-busy="true"]` visual loading states (like spinners).
**Action:** Use a `setTimeout` block (e.g. 800ms) within the submission event to artificially delay the success state transition, ensuring the loading UI is visible and accessible for testing.
