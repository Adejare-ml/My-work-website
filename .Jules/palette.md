## 2023-10-07 - Add Disabled and Busy States for Buttons
**Learning:** The form submit button changed its label to "sending…" but its appearance did not visibly change and it could still be hovered over with the standard cursor, which could lead to multiple form submissions due to user anxiety about whether the button worked.
**Action:** Add `.btn:disabled` and `.btn[aria-busy="true"]` styles with reduced opacity, a `not-allowed` cursor, and remove hover transforms to signal inactivity across the app.
