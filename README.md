# Adejare Adelugba — Portfolio Website


[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange?style=flat-square)](https://pages.cloudflare.com)

Personal portfolio site for **Adejare Adelugba** — AI / Machine Learning Engineer based in Abuja, Nigeria.

---

## Live Site

**[(https://adelugba-adejare.pages.dev/)](https://adelugba-adejare.pages.dev/)**

---

## Pages

| Page | Route | Description |
|---|---|---|
| Home | `/` | Animated hero, results, case studies, experience |
| About | `/about` | Bio, experience, skills, certifications |
| Projects | `/projects` | Full project cards with engineering details |
| Contact | `/contact` | Contact form (Google Apps Script backend) |

---

## Project Structure

```
my-work-website/
├── index.html      ← Home: name, a plane-flight story of the path so far, three projects, contact line
├── about.html      ← The story: degree, IT placement, internships, current role; skills, certifications
├── projects.html   ← Four flagship projects, decision log, all projects (filterable)
├── project-*.html  ← One page per flagship project: figures, why, how, decisions, results
├── contact.html    ← Contact form (Google Apps Script backend)
├── 404.html
├── assets/
│   ├── site.css    ← All styles
│   ├── site.js     ← Hero animation, pipeline diagrams, filters, contact form
│   └── ambient-grid.js ← Desktop starfield background (WebGL, off on phones and reduced motion)
├── Adejare_Adelugba_AI_ML_Engineer_CV.pdf
├── _headers, robots.txt, sitemap.xml
└── redesign/       ← Older design prototypes (noindex, not linked)
```

## Motion rules

- Motion moves graphics around text that is already on the page. Text is never faded in, dimmed or held back.
- The hero diagram's HTML already holds its finished frame, so visitors without JavaScript, or with reduced motion turned on, see the complete result.
- Animations run only while they are on screen, and the hero has a pause button.
- Scroll effects use CSS scroll-driven animations where supported; other browsers simply see the static design.

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS, scroll-driven animations, cross-document view transitions |
| Scripting | Vanilla JS, no framework, no build step |
| Fonts | Newsreader, Hanken Grotesk, JetBrains Mono (Google Fonts) |
| Contact | Google Apps Script webhook |
| Deployment | Cloudflare Pages |

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
