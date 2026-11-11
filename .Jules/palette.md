## 2025-05-18 - Prevent layout shift on loading buttons
**Learning:** Rewriting button text during async loading causes layout shifts and can remove nested icons. A CSS pseudo-element spinner can preserve the button label and width.
**Action:** Keep the original text in the DOM, visually hide it while loading, and use a centered pseudo-element spinner with an explicit theme border color.

## 2026-10-26 - Give abbreviated controls clear accessible names
**Learning:** Short or icon-only button text may not explain the action when announced out of context.
**Action:** Add concise `aria-label` values that describe the action while retaining the visible button text.

## 2026-10-31 - Add context to generic 'copy' buttons
**Learning:** A button with just the text "copy" (or "COPY") is ambiguous to screen reader users navigating out of context.
**Action:** Add an `aria-label` attribute (e.g., `aria-label="Copy email address"`) to explicitly describe what is being copied.
