## 2026-10-18 - Prevent Button Layout Shifts During Async Loading
**Learning:** For visual loading feedback on form elements, directly mutating DOM text (e.g. changing 'Send Message' to 'Sending...') causes jarring width shifts and layout recalculations.
**Action:** Utilize CSS pseudo-elements (e.g. `::after` loading rings) tied to the `[aria-busy="true"]` state. Hide the original text using `color: transparent !important;` to preserve the button's calculated layout dimensions and keep visual states stable.
