## 2024-05-24 - Form inputs missing explicitly linked labels
**Learning:** Labels wrapping inputs without `for`/`id` linking can cause issues for some older screen readers. The `error-banner` role is alert but it's hidden initially. And the copy button text is literally "copy" with no context of what is copied.
**Action:** Enhance contact form inputs to have explicitly `for`/`id` paired labels. Update the copy button to have an `aria-label="copy email address"`. Add an `aria-describedby` when errors occur if possible.
