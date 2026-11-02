## 2025-05-18 - Prevent layout shift on loading buttons
**Learning:** Rewriting button text during async loading causes layout shifts and can remove nested icons. A CSS pseudo-element spinner can preserve the button label and width.
**Action:** Keep the original text in the DOM, visually hide it while loading, and use a centered pseudo-element spinner with an explicit theme border color.

## 2026-10-26 - Give abbreviated controls clear accessible names
**Learning:** Short or icon-only button text may not explain the action when announced out of context.
**Action:** Add concise `aria-label` values that describe the action while retaining the visible button text.

## 2026-10-26 - Hide decorative arrow text in labeled controls
**Learning:** Adding an `aria-label` to a control that contains a decorative text character (like '↓' or '→') does not always prevent the screen reader from reading the inner text depending on its mode. An abbreviated control like "CV ↓" is confusing to screen readers.
**Action:** Always wrap decorative text characters within a control in `<span aria-hidden="true">` to ensure they are ignored by assistive technologies, while using a clear `aria-label` (e.g., `aria-label="Download CV"`) for the control itself.
