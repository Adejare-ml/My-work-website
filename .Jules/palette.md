## 2024-05-18 - Keyboard Focus for CSS Tooltips
**Learning:** Pure CSS tooltips that show on `.card:hover` exclude sighted keyboard users because non-interactive `div` or `span` elements do not receive keyboard focus. A screen reader might read the tooltip text if it is adjacent, but keyboard-only users will not see it.
**Action:** Always add `tabindex="0"` to non-interactive elements containing hover tooltips, and add `:focus-visible` to the hover CSS rules (e.g. `.card:hover .tooltip, .card:focus-visible .tooltip`) to ensure they open on focus.
