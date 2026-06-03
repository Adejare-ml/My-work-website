# Adejare Adelugba — Portfolio Website

[![Live](https://img.shields.io/badge/Live-my--work--website.pages.dev-brightgreen?style=flat-square)](https://my-work-website.pages.dev)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange?style=flat-square)](https://pages.cloudflare.com)

Personal portfolio site for **Adejare Adelugba** — ML Engineer & Data Scientist based in Abuja, Nigeria.

---

## Live Site

**[my-work-website.pages.dev](https://my-work-website.pages.dev)**

---

## Pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Hero, case studies, skills radar, certifications |
| About | `/about.html` | Bio, timeline, stats |
| Projects | `/projects.html` | Full project cards with engineering details |
| Contact | `/contact.html` | Contact form (Google Apps Script backend) |

---

## Project Structure

```
my-work-website/
│
├── index.html              ← Home page
├── about.html              ← About / timeline
├── projects.html           ← Full project showcase
├── contact.html            ← Contact form
├── 404.html                ← Custom 404
│
├── style.css               ← All styles (shared across pages)
├── script.js               ← All JS (neural canvas, radar chart,
│                              scroll reveal, counters, GitHub API,
│                              contact form, copy buttons, nav)
│
├── favicon.svg             ← Site favicon (inline SVG, "A" logo)
├── Profile_pic.png         ← Hero + About photo
│
├── Adejare_Adelugba_Machine learning_engineer.pdf  ← Downloadable CV
│
├── _headers                ← Cloudflare Pages security headers
│
└── backend/
    └── projects.json       ← Static project data (future use)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS (glassmorphism design system, v9 dark theme) |
| Scripting | Vanilla JS (ES5/ES6, no framework, no build step) |
| Icons | Font Awesome 6.4 via CDN |
| Fonts | Plus Jakarta Sans + JetBrains Mono via Google Fonts |
| Canvas | HTML5 Canvas — interactive neural network background |
| Charts | SVG radar chart (hand-drawn in JS, no library) |
| Contact | Google Apps Script webhook |
| Deployment | Cloudflare Pages (auto-deploy on push to `main`) |

---

## Key Features

- **Neural network canvas** — interactive background, mouse-reactive nodes
- **SVG radar chart** — competency radar, animates on scroll
- **Animated counters** — metrics count up when scrolled into view
- **Scroll reveal** — staggered entrance animations via IntersectionObserver
- **GitHub API integration** — fetches and renders public repos live
- **Contact form** — POST to Google Apps Script, no server needed
- **Responsive** — breakpoints at 900px, 768px, 480px, 360px
- **`prefers-reduced-motion`** — all animations respect the OS setting

---

## Key Metrics on Site

| Metric | Project |
|---|---|
| **87.1% ROC-AUC** | Multimodal Breast Cancer Detection (thesis) |
| **99.9% Accuracy** | 36-state Nigerian Electoral Data Pipeline |
| **90% Time Reduction** | TETFund Report Automation |
| **500k+ Records** | Electoral data scraped and validated |

---

## Local Development

No build step required. Open any HTML file directly in a browser, or use a simple static server:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

---

## Deployment

Auto-deployed via **Cloudflare Pages** on every push to `main`.

- Build command: *(none — static files)*
- Output directory: `/` (root)
- Security headers: `_headers` file

---

## Contact

**Adejare Adelugba**  
adelugbaadejare03@gmail.com  
[GitHub](https://github.com/Adejare-ml) · [LinkedIn](https://linkedin.com/in/danieljare)
