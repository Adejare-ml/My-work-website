# Redesign — two concepts

Built from the Claude Design project
[`80092eaa`](https://claude.ai/design/p/80092eaa-06e1-42f5-92ab-3d7d47f12b36).
Nothing in the existing site (`../index.html`, `../assets/site.css`,
`../assets/site.js`, …) was touched.

The design project holds **two mutually exclusive visual systems**. Both are
built here so you can compare them side by side.

| | Concept | Entry point |
|---|---|---|
| **A** | **terminal-editorial** — Newsreader serif + JetBrains Mono, `~/adejare.ml_` wordmark, code block on offset 3D planes, `[ EYEBROW ]` brackets, `// comment` labels, cards with hover glow | [`index.html`](index.html) |
| **B** | **masthead** — Bodoni Moda display, centred `ADEJARE ADELUGBA` masthead rule, VOL. 05 dateline, edge-to-edge ruled grid, layered italic ampersand, radius 0 | [`masthead/index.html`](masthead/index.html) |

Each concept is self-contained: 4 pages + a token spec sheet, one stylesheet,
one script. They share the palette (periwinkle `#A7B5F2` on `#1C1D21`) and
nothing else.

```
redesign/
  index.html  about.html  projects.html  contact.html  tokens.html
  assets/site.css  assets/site.js
  masthead/
    index.html  about.html  projects.html  contact.html  tokens.html
    assets/site.css  assets/site.js
```

## What was ported, and how

The design files are `.dc.html` — inline styles, `style-hover=` / `style-focus=`
pseudo-attributes, `{{binding}}` placeholders, and a React `DCLogic` class per
page. None of that runs outside the Design Canvas, so:

- **Inline styles → token-driven CSS.** Every value in `tokens.html` is a real
  custom property (`--accent`, `--t-flow`, `--ease`, …) and the classes are
  named after the spec sheet. `style-hover` / `style-focus` became `:hover` /
  `:focus` rules.
- **`DCLogic` → plain JS** in `assets/site.js` — no build step, no modules, so
  the pages also open straight off the filesystem. This covers the experience
  and "what didn't work" disclosures, the contact form's validation, the sent
  confirmation, and copy-to-clipboard.
- **`reveal.js` ported verbatim.** Concept A uses `initFlow` (`data-flow` =
  `left|right|up`, ±48px / 36px travel, 90ms stagger, 700ms, hero 900ms);
  concept B uses `initReveals` (`data-reveal`, translateY 16px, 85ms stagger,
  450ms, hero 700ms). Both animate each element exactly once.
- **Scroll parallax kept.** A: the two planes behind the code block drift
  +10/+5px over the first 360px of scroll. B: the ampersand's extrusion slices
  separate over the first 320px.
- **`<image-slot>` → a real `<img>`** pointing at `../profile-840.webp`.
- **`support.js` and `image-slot.js` were not ported** — they are Design Canvas
  runtime scaffolding (a React renderer and a drag-and-drop image placeholder),
  not site code.

Accessibility additions beyond the design: skip links, `aria-current` on nav,
real `<button>` disclosures with `aria-expanded`/`aria-controls`, `role="alert"`
on the form error banner, focus moved to the confirmation heading on send.

Under `prefers-reduced-motion: reduce` the reveal script bails before hiding
anything, so all content renders static and visible — same for browsers without
`IntersectionObserver`.

## Known gaps

- **The contact form does not send.** It validates and shows the confirmation
  panel client-side only, exactly as the design prototype did. Point the submit
  handler in `assets/site.js` at a real endpoint (Formspree, a Worker, the
  existing `../backend/`) before shipping.
- **Three project links are placeholders.** *TETFund Automation*, *Polling Unit
  Scraper*, and *Corporate Website* had no URL in the existing site, so they
  point at the GitHub profile. The other links use your real repos.
- **The featured case has no repo link** — the design didn't include one. The
  repo is
  `github.com/Adejare-ml/Breast_cancer_detention_using_muilt_modal_analysis`
  if you want it added.
- **Copy is the design's, not yours.** The bio, metrics, and dead-end write-ups
  come from the design project verbatim. Worth a read-through — e.g. the design
  claims "two pages, current" for the CV.

## Promoting a concept

Pick a winner, then copy its files up one level, rewriting the asset paths
(`../` → `./`, `assets/` stays). The old pages are in git history either way.
