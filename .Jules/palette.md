## 2026-10-09 - Added disabled and loading states for buttons
**Learning:** The project adds `disabled` and `aria-busy="true"` to the submit button via JS but lacks corresponding CSS to visually show this state. This is an accessibility and UX gap (users click submit and see no visual change that the form is processing).
**Action:** Add CSS for `:disabled` and `[aria-busy="true"]` to `.btn` and `.btn-primary` to reflect loading and disabled states.
