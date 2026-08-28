## 2024-05-18 - [Add aria-pressed state to project filters]
**Learning:** Visually active toggle/filter buttons must also have programmatic aria-pressed states for screen readers to convey their active state.
**Action:** Ensure that custom filter or toggle button implementations always include aria-pressed="true" for the active element and aria-pressed="false" for inactive elements.
