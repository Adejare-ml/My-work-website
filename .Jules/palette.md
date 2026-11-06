## 2025-05-18 - Prevent layout shift on loading buttons
**Learning:** Rewriting button text during async loading causes layout shifts and can remove nested icons. A CSS pseudo-element spinner can preserve the button label and width.
**Action:** Keep the original text in the DOM, visually hide it while loading, and use a centered pseudo-element spinner with an explicit theme border color.

## 2026-10-26 - Give abbreviated controls clear accessible names
**Learning:** Short or icon-only button text may not explain the action when announced out of context.
**Action:** Add concise `aria-label` values that describe the action while retaining the visible button text.

## 2026-11-06 - Delay instant prototypes for realistic state testing
**Learning:** Purely client-side prototype forms change state too quickly to test loading animations.
**Action:** Artificially delay client-side logic with `setTimeout` to ensure busy states (and their CSS) render correctly and remain visually verifiable.
