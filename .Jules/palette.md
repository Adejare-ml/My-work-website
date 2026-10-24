## YYYY-MM-DD - Flight Replay Animation
**Learning:** Found an interactive animation button `data-flight-replay` ("↻ replay") on the home page (`index.html`) that lacks an `aria-label` or description of what it replays, making it confusing for screen reader users. The button controls a "my path so far" timeline animation. Adding an `aria-label="Replay timeline animation"` provides necessary context.
**Action:** Add `aria-label="Replay timeline animation"` to the `.flight-replay` button.
## YYYY-MM-DD - Write Another Message
**Learning:** Found a button `write another` in `contact.html` that shows after a message is sent. It lacks an `aria-label` but the text itself ("write another") might be ok if read out of context. "Write another message" would be clearer.
**Action:** Let's look for more.
