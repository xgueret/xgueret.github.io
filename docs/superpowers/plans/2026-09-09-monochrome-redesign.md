# Monochrome Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current multi-page site with the "TiPunch Labs v5" monochrome one-page design (three.js backdrop, 3D project cards, custom cursor, split-text reveals) while keeping the bilingual blog at `/blog/` and `/en/blog/`.

**Architecture:** Astro 5 static site. The shell (`BaseLayout`) becomes black/monochrome and hosts the nav with the FR|EN switcher and the custom cursor. The two home pages compose one Astro component per mockup section plus a `SceneLayer` (canvas, loader, overlay, scroll cue) and load `src/scripts/home.ts`, which dynamically imports the three.js scene modules. Blog pages load only `src/scripts/blog.ts` (cursor + split-text). Semantic CSS variables (`--color-bg`, `--color-text`, `--color-border`, `--color-accent`…) keep their names and are remapped to the monochrome values so the article components (TOC, series, pagination) keep resolving.

**Tech Stack:** Astro 5, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, `three` 0.186 (+ `@types/three`), `lenis` 1.3, `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-09-monochrome-redesign-design.md`

## Global Constraints

- Package manager is **pnpm**. Never `npm`/`yarn`.
- **Never auto-commit.** Each task ends with a commit checkpoint: propose the message, run `git commit` only after the user's explicit OK.
- Deletions go through `trash`, never `rm -rf`.
- Language: English for code, comments, docs, commit messages. Site copy is FR and EN through `t(locale, key)`; every key exists in **both** `src/i18n/fr.ts` and `src/i18n/en.ts`.
- Absolute URLs come from `Astro.site` (`const site = Astro.site?.toString().replace(/\/$/, '') || '';`). Never hardcode a host.
- One `<h1>` per page. `check-html.py` enforces it.
- `post.id` includes `.md`: always `.replace(/\.md$/, '')` when building URLs.
- `PAGE_SIZE` stays inside `getStaticPaths()`.
- Never define `--color-white` in CSS.
- Mockup ids are kept verbatim (`tp-gl`, `tp-hero`, `tp-work`, `tp-work-hud`, `tp-idx-title`, `tp-idx-tag`, `tp-idx-num`, `tp-about`, `tp-blog`, `tp-cv`, `tp-contact`, `tp-detail`, `tp-detail-meta`, `tp-detail-close`, `tp-detail-title`, `tp-detail-desc`, `tp-detail-link`, `tp-scrollcue`, `tp-projects`, `tp-loader`, `tp-count`, `tp-nav`, `tp-main`, `tp-cursor`, `tp-scrim`, `tp-veil`, `tp-form`, `tp-form-msg`, `tp-logo`, `tp-logo-face`, `tp-featured`, `tp-featured-img`, `tp-portrait`).
- Scene constants (spec §3 decision 8): pastel `0.4`, bgLevel `1`, drift `1`, grain `0.075`, postFx `true`, cardBlur `1`. Accent `#a8cf3e`.
- Verification commands used throughout (there is no unit-test runner in this repo; these are the test cycle):

```bash
pnpm exec astro check
pnpm build
python3 scripts/check-articles.py
python3 scripts/check-html.py dist
node scripts/check-language-switcher.mjs
```

---

## File map

| Path | Responsibility |
|---|---|
| `src/styles/global.css` | Fonts, tokens, semantic variables, shell primitives (`.tp-label`, `.tp-link`, `.tp-h2`, `.tp-row`, split-text, loader/detail transitions, keyframes), prose overrides |
| `src/layouts/BaseLayout.astro` | Shell: head/SEO, nav, cursor element, `<main>`, footer line, per-page script |
| `src/components/SiteNav.astro` | Fixed nav: logo, 5 anchors, FR/EN switcher, hamburger |
| `src/components/LanguageSwitcher.astro` | FR / EN link pair (mono style) |
| `src/components/FooterLine.astro` | "Footage: Pexels" + copyright line |
| `src/components/home/SceneLayer.astro` | canvas, scrim, veil, loader, detail overlay, scroll cue |
| `src/components/home/HeroSection.astro` | Hero |
| `src/components/home/WorkSection.astro` | 340vh sticky HUD |
| `src/components/home/ProjectsFallbackGrid.astro` | hidden `#tp-projects` grid from the collection |
| `src/components/home/AboutSection.astro` | About |
| `src/components/home/BlogSection.astro` | Blog teaser + featured latest post |
| `src/components/home/CvSection.astro` | CV |
| `src/components/home/ContactSection.astro` | Contact form (Formspree) + socials |
| `src/lib/featured-projects.ts` | `getFeaturedProjects(locale)` → typed list for grid, HUD |
| `src/scripts/home.ts` | Home entry: capabilities → scene or fallback |
| `src/scripts/blog.ts` | Blog entry: cursor + split text |
| `src/scripts/ui/cursor.ts` | Custom cursor + pointer state |
| `src/scripts/ui/split-text.ts` | Character split + reveal |
| `src/scripts/scene/config.ts` | Frozen scene constants |
| `src/scripts/scene/capabilities.ts` | mobile / reduced / webgl detection |
| `src/scripts/scene/noise.ts` | value-noise fBm |
| `src/scripts/scene/backdrop.ts` | Video plate shader layer |
| `src/scripts/scene/motifs.ts` | Six canvas drawings |
| `src/scripts/scene/cards.ts` | Project data from DOM, card textures, card meshes |
| `src/scripts/scene/post.ts` | Grain / vignette pass |
| `src/scripts/scene/fallback.ts` | No-WebGL DOM path |
| `src/scripts/scene/index.ts` | `startScene()` orchestrator: renderer, scroll, loader, overlay, tick |
| `src/pages/index.astro`, `src/pages/en/index.astro` | One-page homes |
| `src/pages/blog/[...page].astro`, `[...slug].astro` + `en/blog/…` | Renamed blog routes |

---

### Task 1: Dependencies and static assets

**Files:**
- Modify: `package.json`
- Create: `public/images/logo-lime.png`, `public/images/logo-glass.png`, `public/videos/backdrop-1080.mp4`, `public/videos/backdrop-540.mp4`

**Interfaces:**
- Produces: the four asset paths above, used by `SiteNav` (`/images/logo-lime.png`) and `SceneLayer` (`data-video-hd="/videos/backdrop-1080.mp4"`, `data-video-sd="/videos/backdrop-540.mp4"`).

- [ ] **Step 1: Add and remove packages**

```bash
pnpm add three@^0.186.0 lenis@^1.3.0 @fontsource/space-grotesk@^5.3.0
pnpm add -D @types/three@^0.185.0
pnpm remove @fontsource/source-serif-4 @fontsource/geist-sans
```

- [ ] **Step 2: Copy the logo assets from the mockup folder**

```bash
cp "/home/xgueret/Téléchargements/Maquette trois.js monochrome Lusion(2)/assets/logo-lime.png" public/images/logo-lime.png
cp "/home/xgueret/Téléchargements/Maquette trois.js monochrome Lusion(2)/assets/logo-glass.png" public/images/logo-glass.png
```

- [ ] **Step 3: Download the "Gouttes d'encre" plate (Pexels 3960414) in two encodes**

```bash
curl -L -o public/videos/backdrop-1080.mp4 "https://videos.pexels.com/video-files/3960414/3960414-hd_1920_1080_30fps.mp4"
curl -L -o public/videos/backdrop-540.mp4  "https://videos.pexels.com/video-files/3960414/3960414-sd_960_540_30fps.mp4"
ls -la public/videos/
```

Expected: `backdrop-1080.mp4` ≈ 15.3 MB, `backdrop-540.mp4` ≈ 5.1 MB.

- [ ] **Step 4: Verify the install still type-checks**

Run: `pnpm exec astro check`
Expected: errors only about the two removed font packages in `src/styles/global.css` (fixed in Task 2). No other error.

- [ ] **Step 5: Commit checkpoint (ask the user first)**

```bash
git add package.json pnpm-lock.yaml public/images/logo-lime.png public/images/logo-glass.png public/videos/backdrop-1080.mp4 public/videos/backdrop-540.mp4
git commit -m "chore(deps): add three, lenis and Space Grotesk; add monochrome assets"
```

---

### Task 2: Design tokens and global stylesheet

**Files:**
- Modify: `src/styles/global.css` (full rewrite)
- Modify: `DESIGN.md` (frontmatter rewrite)
- Modify: `.impeccable/design.json` (rewrite)
- Delete: `tailwind.config.mjs` (Tailwind v4 via `@tailwindcss/vite` never reads it; `max-w-site` has no consumer)
- Modify: `public/site.webmanifest` (`background_color` and `theme_color` → `#000000`)

**Interfaces:**
- Produces CSS classes consumed by every later task: `.tp-label`, `.tp-label-sm`, `.tp-link`, `.tp-h2`, `.tp-row`, `.tp-char`/`.tp-in`, `.tp-field`, `.tp-button`; semantic variables `--color-bg`, `--color-bg-alt`, `--color-bg-section`, `--color-text`, `--color-text-muted`, `--color-text-light`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-primary`, `--color-primary-dark`, `--navbar-height`.

- [ ] **Step 1: Rewrite `src/styles/global.css`**

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

/* Display + body */
@import '@fontsource/space-grotesk/300.css';
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/700.css';

/* Labels, HUD, nav, buttons, code */
@import '@fontsource/jetbrains-mono/300.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';

@theme {
  /* Monochrome system — see DESIGN.md */
  --color-tp-black: #000;
  --color-tp-white: #fff;
  --color-tp-lime: #a8cf3e;
  --color-tp-line-18: rgba(255, 255, 255, 0.18);
  --color-tp-line-22: rgba(255, 255, 255, 0.22);
  --color-tp-line-30: rgba(255, 255, 255, 0.3);
  --color-tp-line-35: rgba(255, 255, 255, 0.35);
  --color-tp-line-50: rgba(255, 255, 255, 0.5);

  --font-sans: 'Space Grotesk', Helvetica, Arial, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --z-skip-link: 110;
}

@layer base {
  :root {
    /* Semantic aliases: the article components (TOC, series, pagination)
       resolve these names, so they are remapped rather than renamed. */
    --color-bg: #000;
    --color-bg-alt: #0a0a0a;
    --color-bg-section: #0a0a0a;
    --color-text: #fff;
    --color-text-muted: rgba(255, 255, 255, 0.82);
    --color-text-light: rgba(255, 255, 255, 0.62);
    --color-border: rgba(255, 255, 255, 0.18);
    --color-accent: #a8cf3e;
    --color-accent-hover: #c4e26a;
    --color-primary: #fff;
    --color-primary-dark: #000;
    --navbar-height: 90px;
  }

  html {
    background: #000;
    color: #fff;
  }

  body {
    font-family: var(--font-sans);
    background: #000;
    color: #fff;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
  }

  ::selection {
    background: #fff;
    color: #000;
  }

  a {
    color: #fff;
    text-decoration: none;
  }

  a:hover {
    opacity: 0.8;
  }

  code, pre, kbd, samp {
    font-family: var(--font-mono);
  }

  /* The custom cursor replaces the system one only on fine pointers. */
  html.tp-cursor,
  html.tp-cursor a,
  html.tp-cursor button,
  html.tp-cursor input,
  html.tp-cursor textarea,
  html.tp-cursor label {
    cursor: none;
  }

  :focus-visible {
    outline: 1px solid #a8cf3e;
    outline-offset: 3px;
  }
}

/* ---- Typographic primitives (mockup values) ---------------------------- */
.tp-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.tp-label-sm {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.tp-h2 {
  margin: 0;
  font-size: clamp(2rem, 5.6vw, 4.6rem);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  line-height: 0.9;
}

.tp-link {
  display: inline-flex;
  align-items: baseline;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  padding-bottom: 8px;
  transition: border-color 0.3s ease;
}

.tp-link:hover {
  opacity: 1;
  border-bottom-color: #a8cf3e;
}

.tp-row {
  display: grid;
  grid-template-columns: minmax(110px, 160px) 1fr;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.tp-row:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.tp-row-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.74;
}

.tp-field {
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 300;
  padding: 10px 2px;
  outline: none;
  transition: border-color 0.3s ease;
}

.tp-field:focus {
  border-bottom-color: #fff;
}

.tp-button {
  background: #fff;
  color: #000;
  border: 1px solid #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 15px 34px;
  transition: background 0.3s ease, color 0.3s ease;
}

.tp-button:hover {
  background: #000;
  color: #fff;
}

.tp-social {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transition: border-color 0.3s ease;
}

.tp-social:hover {
  opacity: 1;
  border-color: #fff;
}

/* Grayscale artwork that holds its colour on hover (featured post, portrait). */
.tp-mono-img {
  filter: grayscale(1) contrast(1.12) brightness(0.92);
  transition: filter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.tp-mono-hover:hover .tp-mono-img,
.tp-mono-img.tp-mono-self:hover {
  filter: grayscale(0) contrast(1) brightness(1);
}

/* ---- Motion ------------------------------------------------------------ */
.tp-char {
  display: inline-block;
  opacity: 0;
  filter: blur(14px);
  transform: translateY(0.3em) scale(1.14);
  transition:
    opacity 0.75s cubic-bezier(0.22, 1, 0.28, 1),
    filter 0.75s cubic-bezier(0.22, 1, 0.28, 1),
    transform 0.95s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity, filter;
}

.tp-in .tp-char {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0) scale(1);
}

#tp-loader {
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

#tp-detail {
  transition:
    opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

#tp-logo:hover #tp-logo-face {
  transform: rotate(-22deg) translateY(-2px);
}

@keyframes tpLine {
  0% { transform: scaleY(0); transform-origin: top; }
  45% { transform: scaleY(1); transform-origin: top; }
  55% { transform: scaleY(1); transform-origin: bottom; }
  100% { transform: scaleY(0); transform-origin: bottom; }
}

@keyframes tpBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

@media (hover: none) {
  #tp-cursor { display: none !important; }
}

/* ---- Blog pages: CSS grain stands in for the WebGL pass ---------------- */
.tp-grain::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  opacity: 0.06;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---- Prose (articles) -------------------------------------------------- */
.prose {
  --tw-prose-body: rgba(255, 255, 255, 0.82);
  --tw-prose-headings: #fff;
  --tw-prose-lead: rgba(255, 255, 255, 0.82);
  --tw-prose-links: #a8cf3e;
  --tw-prose-bold: #fff;
  --tw-prose-counters: rgba(255, 255, 255, 0.5);
  --tw-prose-bullets: rgba(255, 255, 255, 0.5);
  --tw-prose-hr: rgba(255, 255, 255, 0.18);
  --tw-prose-quotes: #fff;
  --tw-prose-quote-borders: #a8cf3e;
  --tw-prose-captions: rgba(255, 255, 255, 0.62);
  --tw-prose-code: #fff;
  --tw-prose-pre-code: #e6e6e6;
  --tw-prose-pre-bg: #0a0a0a;
  --tw-prose-th-borders: rgba(255, 255, 255, 0.18);
  --tw-prose-td-borders: rgba(255, 255, 255, 0.18);
  font-weight: 300;
}

.prose h2 {
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.prose pre,
.prose pre.astro-code {
  background-color: #0a0a0a !important;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0;
}

.prose :not(pre) > code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15em 0.4em;
  border-radius: 0;
  font-weight: 400;
}

.prose :not(pre) > code::before,
.prose :not(pre) > code::after {
  content: none;
}

.prose img {
  border-radius: 0;
}

/* Wide Markdown tables scroll within their own box instead of stretching the
   page past the viewport (source of horizontal overflow on mobile). */
.prose :where(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

/* Inline code must wrap rather than push the page wider than the viewport.
   Code blocks (pre code) are excluded — they keep one line and scroll. */
.prose :not(pre) > code {
  overflow-wrap: break-word;
  word-break: break-word;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Rewrite the `DESIGN.md` frontmatter and body**

Replace the whole file with:

```markdown
---
name: TiPunch Labs — Xavier GUERET
description: Monochrome one-page portfolio and blog, black ground, white type, one lime accent
colors:
  black: "#000000"
  white: "#ffffff"
  lime: "#a8cf3e"
  line-18: "rgba(255,255,255,0.18)"
  line-22: "rgba(255,255,255,0.22)"
  line-30: "rgba(255,255,255,0.30)"
  line-35: "rgba(255,255,255,0.35)"
  line-50: "rgba(255,255,255,0.50)"
  surface: "#0a0a0a"
typography:
  display:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.9rem, min(7.6vw, 9vh), 6.4rem)"
    fontWeight: 500
    lineHeight: 0.94
    letterSpacing: "0.005em"
    textTransform: uppercase
  headline:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(2rem, 5.6vw, 4.6rem)"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "0.01em"
    textTransform: uppercase
  title:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.15rem, 1.9vw, 1.6rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.005em"
  body:
    fontFamily: "'Space Grotesk', Helvetica, Arial, sans-serif"
    fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)"
    fontWeight: 300
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.3em"
    textTransform: uppercase
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
rounded:
  sm: "0"
  md: "0"
  lg: "0"
---

# Design system

Monochrome system ported from the "TiPunch Labs v5" mockup. Pure black ground,
white type, a single lime accent, hairline rules in white alpha. Space Grotesk
carries display and body; JetBrains Mono carries labels, HUD, navigation,
buttons and code. No border radius anywhere. Motion: split-text blur reveals,
custom cursor, Lenis smooth scroll, three.js backdrop and cards on home pages.

`src/styles/global.css` is the implementation; this file and
`.impeccable/design.json` are the contract. Change a token in all three.
```

- [ ] **Step 3: Rewrite `.impeccable/design.json`**

```json
{
  "schemaVersion": 2,
  "generatedAt": "2026-09-09T00:00:00Z",
  "title": "Design System: TiPunch Labs — Xavier GUERET",
  "extensions": {
    "colorMeta": {
      "black": { "role": "neutral", "displayName": "Black", "canonical": "#000000" },
      "white": { "role": "neutral", "displayName": "White", "canonical": "#ffffff" },
      "lime": { "role": "accent", "displayName": "Lime", "canonical": "#a8cf3e" },
      "surface": { "role": "neutral", "displayName": "Surface", "canonical": "#0a0a0a" },
      "line-18": { "role": "border", "displayName": "Line 18", "canonical": "rgba(255,255,255,0.18)" },
      "line-22": { "role": "border", "displayName": "Line 22", "canonical": "rgba(255,255,255,0.22)" },
      "line-30": { "role": "border", "displayName": "Line 30", "canonical": "rgba(255,255,255,0.30)" },
      "line-35": { "role": "border", "displayName": "Line 35", "canonical": "rgba(255,255,255,0.35)" },
      "line-50": { "role": "border", "displayName": "Line 50", "canonical": "rgba(255,255,255,0.50)" }
    },
    "typography": {
      "display": "Space Grotesk 500 uppercase",
      "body": "Space Grotesk 300",
      "label": "JetBrains Mono 11px tracking .3em uppercase"
    }
  }
}
```

- [ ] **Step 4: Update the manifest colours and delete the dead Tailwind config**

```bash
sed -i 's/"background_color": "#fbf4ed"/"background_color": "#000000"/; s/"theme_color": "#fbf4ed"/"theme_color": "#000000"/' public/site.webmanifest
trash tailwind.config.mjs
```

- [ ] **Step 5: Build**

Run: `pnpm exec astro check && pnpm build`
Expected: both pass (the old pages still render, now on the black tokens). Open `pnpm preview` at `/posts/` and confirm the page is black with white text in Space Grotesk.

- [ ] **Step 6: Commit checkpoint (ask the user first)**

```bash
git add src/styles/global.css DESIGN.md .impeccable/design.json public/site.webmanifest tailwind.config.mjs
git commit -m "feat(design): switch tokens and fonts to the monochrome system"
```

---

### Task 3: Rename blog routes to `/blog` and add redirects

**Files:**
- Rename: `src/pages/posts/[...page].astro` → `src/pages/blog/[...page].astro`; `src/pages/posts/[...slug].astro` → `src/pages/blog/[...slug].astro`; same under `src/pages/en/posts/` → `src/pages/en/blog/`
- Modify: `astro.config.mjs`, `src/utils/series.ts:44`, `src/layouts/PostLayout.astro` (breadcrumb + back link), `src/components/Navbar.astro`, `src/components/ArticlesGrid.astro:105`, `src/components/CategoriesCloud.astro:144`, `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/categories/[...path].astro`, `src/pages/en/categories/[...path].astro`, `src/content/posts/fr/kandidat.md:144`, `public/llms.txt`, `public/llms-full.txt`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: blog listing at `${localePrefix(locale)}/blog/`, article at `${localePrefix(locale)}/blog/<slug>/`. Every later task links to these.

- [ ] **Step 1: Move the route files**

```bash
git mv src/pages/posts src/pages/blog
git mv src/pages/en/posts src/pages/en/blog
```

- [ ] **Step 2: Replace every internal `/posts/` reference in source**

```bash
grep -rl "/posts/" src --include='*.astro' --include='*.ts' | grep -v "content/posts" | xargs sed -i 's#/posts/#/blog/#g'
sed -i 's#(/posts/homelab/)#(/blog/homelab/)#' src/content/posts/fr/kandidat.md
grep -rn "/posts/" src --include='*.astro' --include='*.ts'
```

Expected: the last grep prints nothing. The pattern also hits an eventual `/images/posts/` literal in a component, so run `grep -rn "images/blog" src` — if it prints anything, revert those with `grep -rl "images/blog" src | xargs sed -i 's#/images/blog/#/images/posts/#g'`.

- [ ] **Step 3: Fix the two listing `baseUrl` props and the breadcrumb name**

In `src/pages/blog/[...page].astro` and `src/pages/en/blog/[...page].astro` the `Pagination` `baseUrl` was rewritten by the sed to `/blog/` — confirm with `grep -n baseUrl src/pages/blog/*.astro src/pages/en/blog/*.astro`. In `src/layouts/PostLayout.astro` the breadcrumb item 2 now reads `item: \`${site}${localePrefix(locale)}/blog/\``; change its `name` to `locale === 'fr' ? 'Blog' : 'Blog'` → simply `name: 'Blog'`.

- [ ] **Step 4: Add the redirects to `astro.config.mjs`**

```js
export default defineConfig({
  site: 'https://xgueret.github.io',
  redirects: {
    '/posts': '/blog',
    '/posts/[...slug]': '/blog/[...slug]',
    '/en/posts': '/en/blog',
    '/en/posts/[...slug]': '/en/blog/[...slug]',
  },
  vite: {
```

(keep the rest of the file unchanged).

- [ ] **Step 5: Update `llms.txt`, `llms-full.txt` and the Lighthouse URLs**

```bash
sed -i 's#/posts/#/blog/#g' public/llms.txt public/llms-full.txt
sed -i 's#--collect.url=/posts/#--collect.url=/blog/#' .github/workflows/ci.yml
```

- [ ] **Step 6: Build and verify the redirect pages exist**

```bash
pnpm exec astro check && pnpm build
ls dist/blog/homelab/index.html dist/en/blog/homelab/index.html dist/blog/2/index.html
grep -l "http-equiv=\"refresh\"" dist/posts/index.html dist/posts/homelab/index.html dist/en/posts/homelab/index.html
grep -o 'url=[^"]*' dist/posts/homelab/index.html
python3 scripts/check-html.py dist
node scripts/check-language-switcher.mjs
```

Expected: the three `ls` paths exist; the three redirect files contain a meta refresh; the `grep -o` prints `url=/blog/homelab`; both scripts pass. If `dist/posts/2/index.html` is missing, add `'/posts/2': '/blog/2'` and `'/en/posts/2': '/en/blog/2'` to `redirects` (paginated URLs are the only ones the rest pattern may not cover).

- [ ] **Step 7: Commit checkpoint (ask the user first)**

```bash
git add -A src/pages/blog src/pages/en/blog src/pages/posts src/pages/en/posts astro.config.mjs src public .github/workflows/ci.yml
git commit -m "feat(blog): move the blog to /blog and redirect the old /posts URLs"
```

---

### Task 4: Translation keys for the new design

**Files:**
- Modify: `src/i18n/fr.ts`, `src/i18n/en.ts`

**Interfaces:**
- Produces the keys listed below, consumed by Tasks 6–10 via `t(locale, key)`. Dead keys are removed in Task 11, not here (pages still using them are deleted there).

- [ ] **Step 1: Replace the hero block and append the new blocks in `src/i18n/fr.ts`**

Replace the `// Hero` block (`author` … `heroCtaSecondary`) with:

```ts
  // Hero
  author: 'Xavier GUERET',
  brand: 'Tipunchlabs',
  heroEyebrow: 'Xavier Gueret — Ingénieur DevOps',
  heroHeadline1: 'Construire,',
  heroHeadline2: 'déployer,',
  heroHeadline3: 'automatiser.',
  heroQuoteLabel: 'Un jour, quelqu\'un a dit',
  heroQuote: '« Automatiser, c\'est la clé pour un développement chill : moins de stress, plus de flow, et des déploiements qui se font les doigts dans le code ! »',
  heroP1: 'Alors depuis, je suis la voie de l\'apprentissage de Kubernetes, Python, Ansible, Terraform… en quête de la maîtrise ultime pour automatiser tout ce qui bouge et garder l\'esprit zen.',
  heroP2: 'De retour en Guadeloupe, mon île natale, où le code se déploie au rythme des Alizés.',
```

Then, before the closing `} as const;`, append:

```ts
  // Shell
  about: 'À propos',
  blog: 'Blog',
  loaderTagline: 'Tipunchlabs — atelier d\'infrastructure',
  scrollCue: 'Défiler pour explorer',
  footerFootage: 'Footage: Pexels',
  menuOpen: 'Ouvrir le menu',
  menuClose: 'Fermer le menu',

  // Work (projects HUD + overlay)
  workLabel: 'Projets & expériences',
  workScroll: 'Défiler ↓',
  projectOpenSource: 'Open source',
  projectWebsite: 'Site web',
  detailClose: 'Fermer ✕',
  detailView: 'Voir le projet ↗',

  // About
  aboutLabel: '01 — À propos',
  aboutTitle1: 'Comment',
  aboutTitle2: 'je travaille',
  aboutP1: 'Je viens du développement Java. Ce sont les environnements Linux, OpenShift et Kubernetes qui m\'ont poussé vers le DevOps : moins écrire l\'application, plus construire le terrain sur lequel elle tourne.',
  aboutP2: 'Mon homelab me sert de terrain d\'essai : tout ce que je déploie chez un client, je l\'ai d\'abord cassé et reconstruit chez moi.',
  aboutRow1Label: 'Reproductible',
  aboutRow1Text: 'Terraform et Ansible plutôt qu\'une configuration faite à la main une seule fois.',
  aboutRow2Label: 'Documenté',
  aboutRow2Text: 'Un dépôt qu\'on peut reprendre six mois plus tard sans venir me demander.',
  aboutRow3Label: 'Automatisé',
  aboutRow3Text: 'Ce qui se répète part en CI/CD : le déploiement manuel est un incident en attente.',

  // Blog section + listing
  blogLabel: '02 — Le Blog',
  blogEyebrow: 'Le Blog',
  blogTitle1: 'Notes',
  blogTitle2: 'd\'atelier',
  blogIntro: 'Ce que j\'apprends en construisant : Kubernetes, Terraform, Ansible, homelab et automatisation — écrit au fil des chantiers, erreurs comprises.',
  blogReadAll: 'Lire les articles',
  blogFeatured: 'Article du moment',
  blogReadArticle: 'Lire l\'article',
  minShort: 'min',

  // CV section
  cvLabel: '03 — CV',
  cvTagline: 'Ingénieur DevOps basé en Guadeloupe, issu du développement Java.',
  cvDownload: 'Télécharger le CV (PDF) ↓',
  cvProfileLabel: 'Profil',
  cvProfileP1: 'Évolution vers le DevOps par la gestion d\'environnements Linux, le déploiement d\'applications sur OpenShift et Kubernetes, et la mise en place d\'infrastructures reproductibles avec Ansible et Terraform.',
  cvProfileP2: 'Concevoir des environnements stables, documentés et faciles à maintenir — et continuer à approfondir la conteneurisation, le CI/CD, les pratiques Cloud-Native et l\'IA appliquée (LLM, agents, MCP).',
  cvStackLabel: 'Stack',
  cvStackAutomation: 'Automatisation',
  cvStackCi: 'CI / CD',
  cvStackContainers: 'Conteneurisation',
  cvStackScripting: 'Scriptage',
  cvStackAi: 'IA & LLM',
  cvCertsLabel: 'Certifications',

  // Contact section
  contactLabel: '04 — Contact',
  contactHeadline: 'Disponible',
```

- [ ] **Step 2: Same in `src/i18n/en.ts`**

Replace the `// Hero` block with:

```ts
  // Hero
  author: 'Xavier GUERET',
  brand: 'Tipunchlabs',
  heroEyebrow: 'Xavier Gueret — DevOps Engineer',
  heroHeadline1: 'Build,',
  heroHeadline2: 'deploy,',
  heroHeadline3: 'automate.',
  heroQuoteLabel: 'One day, someone said',
  heroQuote: '“Automation is the key to chill development: less stress, more flow, and deployments that happen with your fingers in the code!”',
  heroP1: 'Ever since, I have been walking the path of Kubernetes, Python, Ansible, Terraform… in search of the ultimate mastery to automate everything that moves and keep a zen mind.',
  heroP2: 'Back in Guadeloupe, my native island, where code ships to the rhythm of the trade winds.',
```

Append before `} as const;`:

```ts
  // Shell
  about: 'About',
  blog: 'Blog',
  loaderTagline: 'Tipunchlabs — infrastructure workshop',
  scrollCue: 'Scroll to explore',
  footerFootage: 'Footage: Pexels',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',

  // Work (projects HUD + overlay)
  workLabel: 'Projects & experiments',
  workScroll: 'Scroll ↓',
  projectOpenSource: 'Open source',
  projectWebsite: 'Website',
  detailClose: 'Close ✕',
  detailView: 'View the project ↗',

  // About
  aboutLabel: '01 — About',
  aboutTitle1: 'How',
  aboutTitle2: 'I work',
  aboutP1: 'I come from Java development. Linux, OpenShift and Kubernetes environments pushed me towards DevOps: writing less of the application, building more of the ground it runs on.',
  aboutP2: 'My homelab is my proving ground: everything I deploy for a client, I have first broken and rebuilt at home.',
  aboutRow1Label: 'Reproducible',
  aboutRow1Text: 'Terraform and Ansible rather than a configuration done by hand, once.',
  aboutRow2Label: 'Documented',
  aboutRow2Text: 'A repository someone can pick up six months later without asking me.',
  aboutRow3Label: 'Automated',
  aboutRow3Text: 'Whatever repeats goes to CI/CD: a manual deployment is an incident waiting to happen.',

  // Blog section + listing
  blogLabel: '02 — The Blog',
  blogEyebrow: 'The Blog',
  blogTitle1: 'Workshop',
  blogTitle2: 'notes',
  blogIntro: 'What I learn by building: Kubernetes, Terraform, Ansible, homelab and automation — written as the work happens, mistakes included.',
  blogReadAll: 'Read the articles',
  blogFeatured: 'Featured article',
  blogReadArticle: 'Read the article',
  minShort: 'min',

  // CV section
  cvLabel: '03 — Resume',
  cvTagline: 'DevOps engineer based in Guadeloupe, with a Java development background.',
  cvDownload: 'Download the resume (PDF) ↓',
  cvProfileLabel: 'Profile',
  cvProfileP1: 'Moved into DevOps through managing Linux environments, deploying applications on OpenShift and Kubernetes, and building reproducible infrastructure with Ansible and Terraform.',
  cvProfileP2: 'Designing stable, documented, easy-to-maintain environments — and keeping on deepening containers, CI/CD, Cloud-Native practices and applied AI (LLMs, agents, MCP).',
  cvStackLabel: 'Stack',
  cvStackAutomation: 'Automation',
  cvStackCi: 'CI / CD',
  cvStackContainers: 'Containers',
  cvStackScripting: 'Scripting',
  cvStackAi: 'AI & LLM',
  cvCertsLabel: 'Certifications',

  // Contact section
  contactLabel: '04 — Contact',
  contactHeadline: 'Available',
```

- [ ] **Step 3: Verify both files expose the same keys**

```bash
diff <(grep -oE '^  [a-zA-Z0-9]+:' src/i18n/fr.ts | sort) <(grep -oE '^  [a-zA-Z0-9]+:' src/i18n/en.ts | sort) && echo "keys in sync"
pnpm exec astro check
```

Expected: `keys in sync` and `astro check` passes (the `Hero.astro` component still references `heroDescription` — if `astro check` reports it, keep a temporary `heroDescription: ''` in both files; it is deleted with `Hero.astro` in Task 11).

- [ ] **Step 4: Commit checkpoint (ask the user first)**

```bash
git add src/i18n/fr.ts src/i18n/en.ts
git commit -m "feat(i18n): add the monochrome one-page copy in FR and EN"
```

---

### Task 5: Projects schema and featured entries

**Files:**
- Modify: `src/content/config.ts` (projects schema)
- Modify: `src/content/projects/{fr,en}/{ckad-dojo,homelab,vagrant-k8s-cluster,good-points,hugo-site-manager,adelineguillotgueret}.md`
- Create: `src/lib/featured-projects.ts`

**Interfaces:**
- Produces `getFeaturedProjects(locale: Locale): Promise<FeaturedProject[]>` with
  `interface FeaturedProject { index: number; title: string; plateTag: string; year: string; description: string; url: string; motif: Motif }` and `type Motif = 'rings' | 'rack' | 'graph' | 'columns' | 'terminal' | 'wireframe'`. Consumed by `ProjectsFallbackGrid` and `WorkSection` (Task 7).

- [ ] **Step 1: Extend the projects schema in `src/content/config.ts`**

```ts
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['github', 'websites']),
    tags: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    url: z.string().url().optional(),
    order: z.number().default(0),
    // Home-page 3D plates: only featured entries are rendered anywhere.
    featured: z.boolean().default(false),
    motif: z.enum(['rings', 'rack', 'graph', 'columns', 'terminal', 'wireframe']).optional(),
    plateTag: z.string().optional(),
  }),
});
```

- [ ] **Step 2: Flag the six featured projects (FR and EN, same values)**

Add these three lines to the frontmatter of each listed file and set `order` as shown. Descriptions stay as they are.

| File (in both `fr/` and `en/`) | `order` | `motif` | `plateTag` |
|---|---|---|---|
| `ckad-dojo.md` | 1 | `rings` | `Kubernetes / Python` |
| `homelab.md` | 2 | `rack` | `Terraform / Ansible` |
| `vagrant-k8s-cluster.md` | 3 | `graph` | `Kubernetes / Vagrant` |
| `good-points.md` | 4 | `columns` | `React / Firebase` |
| `hugo-site-manager.md` | 5 | `terminal` | `Go / CLI` |
| `adelineguillotgueret.md` | 6 | `wireframe` | `HTML / CSS / JS` |

Example for `src/content/projects/fr/homelab.md`:

```yaml
---
title: "homelab"
description: "Monorepo Infrastructure as Code pour piloter un homelab complet — Proxmox, Docker, Kubernetes — avec Terraform et Ansible."
category: "github"
tags: ["Proxmox", "Ansible", "Terraform", "Docker", "Kubernetes", "IaC"]
github: "https://github.com/TiPunchLabs/homelab"
order: 2
featured: true
motif: "rack"
plateTag: "Terraform / Ansible"
---
```

- [ ] **Step 3: Create `src/lib/featured-projects.ts`**

```ts
import { getCollection } from 'astro:content';
import { t, type Locale } from '../i18n';

export type Motif = 'rings' | 'rack' | 'graph' | 'columns' | 'terminal' | 'wireframe';

export interface FeaturedProject {
  index: number;
  title: string;
  plateTag: string;
  year: string;
  description: string;
  url: string;
  motif: Motif;
}

/**
 * The projects drawn as 3D plates on the home page, in plate order.
 * `year` is the mockup's second caption line ("Open source" / "Site web").
 */
export async function getFeaturedProjects(locale: Locale): Promise<FeaturedProject[]> {
  const entries = await getCollection(
    'projects',
    ({ id, data }) => id.startsWith(`${locale}/`) && data.featured
  );

  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry, i) => ({
      index: i + 1,
      title: entry.data.title,
      plateTag: entry.data.plateTag ?? entry.data.tags.slice(0, 2).join(' / '),
      year: t(locale, entry.data.category === 'github' ? 'projectOpenSource' : 'projectWebsite'),
      description: entry.data.description,
      url: entry.data.github ?? entry.data.url ?? '',
      motif: entry.data.motif ?? 'rings',
    }));
}
```

- [ ] **Step 4: Verify**

```bash
pnpm exec astro check
node -e "
const fs=require('fs');
for (const l of ['fr','en']) for (const f of ['ckad-dojo','homelab','vagrant-k8s-cluster','good-points','hugo-site-manager','adelineguillotgueret']) {
  const s=fs.readFileSync('src/content/projects/'+l+'/'+f+'.md','utf8');
  if(!/featured: true/.test(s)||!/motif:/.test(s)||!/plateTag:/.test(s)) { console.error('missing fields in', l, f); process.exit(1); }
}
console.log('12 featured entries ok');
"
```

Expected: `astro check` passes, `12 featured entries ok`.

- [ ] **Step 5: Commit checkpoint (ask the user first)**

```bash
git add src/content/config.ts src/content/projects src/lib/featured-projects.ts
git commit -m "feat(projects): flag the six featured plates with motif and plate tag"
```

---

### Task 6: The shell — layout, nav, language switcher, footer line

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (rewrite; the spec's "SiteLayout" keeps the `BaseLayout` name so `PostLayout` and every page keep importing it)
- Create: `src/components/SiteNav.astro`, `src/components/FooterLine.astro`
- Modify: `src/components/LanguageSwitcher.astro` (rewrite)
- Create: `src/scripts/blog.ts` (entry loaded by non-home pages; its modules are written in Task 8 — until then it is a two-line stub, see Step 5)

**Interfaces:**
- `BaseLayout` props: existing ones plus `home?: boolean` (default `false`). When `home` is true: no top padding on `<main>`, nav anchors are local (`#tp-work`), `html` has no `scroll-smooth`, and the layout does **not** load `blog.ts` (the page loads `home.ts` itself).
- `SiteNav` props: `{ locale: Locale; home: boolean }`.
- `FooterLine` props: `{ locale: Locale; footage?: boolean }`.
- `LanguageSwitcher` props unchanged: `{ locale: Locale; currentPath: string }`. The alternate link keeps `href` as its **first** attribute and an `aria-label` from `switchToEn`/`switchToFr` — `scripts/check-language-switcher.mjs` matches on that.

- [ ] **Step 1: Rewrite `src/components/LanguageSwitcher.astro`**

```astro
---
import { type Locale, t, getAlternateLocale, localizedPath } from '../i18n';

interface Props {
  locale: Locale;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;
const altLocale = getAlternateLocale(locale);
const altPath = localizedPath(altLocale, currentPath);
const altLabel = t(locale, altLocale === 'en' ? 'switchToEn' : 'switchToFr');
const order: Locale[] = ['fr', 'en'];
---

<div class="tp-label flex items-center gap-3" style="letter-spacing:.24em;">
  {order.map((l, i) => (
    <>
      {i > 0 && <span aria-hidden="true" style="opacity:.35;">|</span>}
      {l === locale ? (
        <span aria-current="true">{l.toUpperCase()}</span>
      ) : (
        <a href={altPath} aria-label={altLabel} data-cursor="link" class="tp-alt transition-opacity">{l.toUpperCase()}</a>
      )}
    </>
  ))}
</div>

<style>
  .tp-alt { opacity: 0.6; }
  .tp-alt:hover { opacity: 1; }
</style>
```

- [ ] **Step 2: Create `src/components/SiteNav.astro`**

```astro
---
import { type Locale, t, localePrefix } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher.astro';

interface Props {
  locale: Locale;
  home: boolean;
}

const { locale, home } = Astro.props;
const prefix = localePrefix(locale);
const currentPath = Astro.url.pathname;
// On the home page anchors are local; elsewhere they point back to the home.
const base = home ? '' : `${prefix}/`;

const links = [
  { href: `${base}#tp-work`, label: t(locale, 'projects') },
  { href: `${base}#tp-about`, label: t(locale, 'about') },
  { href: `${base}#tp-blog`, label: t(locale, 'blog') },
  { href: `${base}#tp-cv`, label: t(locale, 'cv') },
  { href: `${base}#tp-contact`, label: t(locale, 'contact') },
];
---

<nav
  id="tp-nav"
  aria-label={t(locale, 'mainNavigation')}
  class="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between"
  style="padding:24px 28px; transition:opacity .5s cubic-bezier(.16,1,.3,1);"
>
  <a
    id="tp-logo"
    href={home ? '#tp-hero' : `${prefix}/`}
    data-cursor="link"
    aria-label={t(locale, 'brand')}
    class="flex items-center flex-none overflow-hidden"
    style="width:42px; height:42px;"
  >
    <img
      id="tp-logo-face"
      src="/images/logo-lime.png"
      alt={t(locale, 'brand')}
      width="42"
      height="42"
      class="block flex-none object-contain"
      style="width:42px; height:42px; transition:transform .6s cubic-bezier(.34,1.56,.64,1);"
    />
  </a>

  <div id="tp-nav-links" class="tp-label items-center" style="display:flex; gap:28px; letter-spacing:.24em;">
    {links.map((l) => (
      <a href={l.href} data-cursor="link">{l.label}</a>
    ))}
    <LanguageSwitcher locale={locale} currentPath={currentPath} />
  </div>

  <button
    id="tp-menu-toggle"
    type="button"
    aria-expanded="false"
    aria-controls="tp-menu"
    aria-label={t(locale, 'menuOpen')}
    data-cursor="link"
    class="tp-label bg-transparent text-white border border-[rgba(255,255,255,.4)]"
    style="display:none; padding:8px 14px; letter-spacing:.24em;"
  >
    Menu
  </button>
</nav>

<div
  id="tp-menu"
  hidden
  class="fixed inset-0 z-[59] bg-black flex flex-col justify-center"
  style="padding:96px 28px 48px; gap:28px;"
>
  {links.map((l) => (
    <a href={l.href} data-cursor="link" class="uppercase" style="font-size:clamp(1.6rem,8vw,3rem); font-weight:500; line-height:1;">{l.label}</a>
  ))}
  <div style="margin-top:12px;">
    <LanguageSwitcher locale={locale} currentPath={currentPath} />
  </div>
</div>

<style>
  @media (max-width: 820px) {
    #tp-nav-links { display: none !important; }
    #tp-menu-toggle { display: inline-flex !important; }
  }
</style>

<script>
  const toggle = document.getElementById('tp-menu-toggle');
  const menu = document.getElementById('tp-menu');
  const openLabel = toggle?.getAttribute('aria-label') ?? '';
  const closeLabel = document.documentElement.lang === 'fr' ? 'Fermer le menu' : 'Close menu';

  function setOpen(open: boolean): void {
    if (!toggle || !menu) return;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? closeLabel : openLabel);
    toggle.textContent = open ? '✕' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggle?.addEventListener('click', () => setOpen(menu?.hidden ?? true));
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
</script>
```

- [ ] **Step 3: Create `src/components/FooterLine.astro`**

```astro
---
import { type Locale, t } from '../i18n';

interface Props {
  locale: Locale;
  footage?: boolean;
}

const { locale, footage = false } = Astro.props;
const year = new Date().getUTCFullYear();
const copyright = `© ${year} ${t(locale, 'brand')}`;
---

<div class="tp-label flex flex-wrap" style="gap:32px; letter-spacing:.24em;">
  {footage && <span style="opacity:.62;">{t(locale, 'footerFootage')}</span>}
  <span style="opacity:.62; margin-left:auto;">{copyright}</span>
</div>
```

- [ ] **Step 4: Rewrite `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import SiteNav from '../components/SiteNav.astro';
import FooterLine from '../components/FooterLine.astro';
import SEO from '../components/SEO.astro';
import { type Locale, t } from '../i18n';

interface Props {
  title: string;
  description?: string;
  locale: Locale;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
  home?: boolean;
}

const {
  title, description, locale, canonicalUrl, ogImage, ogType,
  publishedTime, modifiedTime, authorName, tags, jsonLd, home = false,
} = Astro.props;

const siteTitle = t(locale, 'siteTitle');
const homeTitle = t(locale, 'homeTitle');
// Homepage keeps its own full name-bearing title; sub-pages get the brand suffix.
const fullTitle = title === siteTitle || title === homeTitle ? title : `${title} · ${siteTitle}`;
const desc = description || t(locale, 'siteDescription');
---

<!doctype html>
<html lang={locale} class:list={[!home && 'scroll-smooth']}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png" />
    <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#000000" />
    <meta name="generator" content={Astro.generator} />
    <SEO
      title={fullTitle}
      description={desc}
      locale={locale}
      canonicalUrl={canonicalUrl}
      ogImage={ogImage}
      ogType={ogType}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      authorName={authorName}
      tags={tags}
    />
    {jsonLd && (
      <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
    )}
  </head>
  <body class:list={['min-h-dvh flex flex-col bg-black text-white', !home && 'tp-grain']}>
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[var(--z-skip-link)] focus:px-4 focus:py-2 focus:bg-white focus:text-black tp-label">
      {t(locale, 'skipToContent')}
    </a>

    <div
      id="tp-cursor"
      aria-hidden="true"
      class="fixed top-0 left-0 rounded-full bg-white pointer-events-none z-[90]"
      style="width:14px; height:14px; mix-blend-mode:difference; transform:translate(-50%,-50%); opacity:0; will-change:transform;"
    ></div>

    <SiteNav locale={locale} home={home} />

    <main id="main-content" class:list={['flex-1 relative z-10', !home && 'pt-[var(--navbar-height)]']}>
      <slot />
    </main>

    {!home && (
      <footer class="relative z-10" style="padding:48px 28px 32px;">
        <FooterLine locale={locale} />
      </footer>
    )}

    {!home && <script>import '../scripts/blog';</script>}
  </body>
</html>
```

- [ ] **Step 5: Create the temporary `src/scripts/blog.ts` stub (replaced in Task 8)**

```ts
// Filled in Task 8: custom cursor + split-text reveals for blog pages.
export {};
```

- [ ] **Step 6: Build and check**

```bash
pnpm exec astro check && pnpm build && python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
```

Expected: all pass. `pnpm preview`: on `/blog/` the nav shows the logo, five mono links, `FR | EN`; below 820px the links collapse into a `Menu` button that opens a full-screen list; the language link on `/blog/` goes to `/en/blog/`.

- [ ] **Step 7: Commit checkpoint (ask the user first)**

```bash
git add src/layouts/BaseLayout.astro src/components/SiteNav.astro src/components/FooterLine.astro src/components/LanguageSwitcher.astro src/scripts/blog.ts
git commit -m "feat(shell): monochrome layout with mono nav, FR/EN switcher and hamburger"
```

---

### Task 7: Home page — sections, scene layer, FR and EN pages

**Files:**
- Create: `src/components/home/SceneLayer.astro`, `HeroSection.astro`, `WorkSection.astro`, `ProjectsFallbackGrid.astro`, `AboutSection.astro`, `BlogSection.astro`, `CvSection.astro`, `ContactSection.astro`
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro` (rewrite)
- Create: `src/scripts/home.ts` stub (replaced in Task 8)

**Interfaces:**
- Consumes: `getFeaturedProjects(locale)` (Task 5), classes from Task 2, keys from Task 4, `BaseLayout` `home` prop (Task 6).
- Produces the DOM contract read by the scene script (Task 8): `#tp-gl[data-video-hd][data-video-sd]`, `#tp-projects article[data-project][data-title][data-tag][data-year][data-desc][data-url][data-motif]`, the HUD ids, `[data-split]` elements, `#tp-detail*`, `#tp-loader`/`#tp-count`, `#tp-scrollcue`, `#tp-veil`, `#tp-main`.

- [ ] **Step 1: Create `src/components/home/SceneLayer.astro`**

```astro
---
import { type Locale, t } from '../../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
---

<canvas
  id="tp-gl"
  data-video-hd="/videos/backdrop-1080.mp4"
  data-video-sd="/videos/backdrop-540.mp4"
  aria-hidden="true"
  class="fixed inset-0 block w-full h-full z-0"
></canvas>

<div
  id="tp-scrim"
  aria-hidden="true"
  class="fixed inset-0 z-[5] pointer-events-none"
  style="background:linear-gradient(100deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,.7) 40%, rgba(0,0,0,.34) 70%, rgba(0,0,0,.06) 100%);"
></div>

<div
  id="tp-veil"
  aria-hidden="true"
  class="fixed inset-0 z-[6] pointer-events-none bg-black"
  style="opacity:0; transition:opacity .45s linear;"
></div>

<div
  id="tp-loader"
  aria-hidden="true"
  class="fixed inset-0 z-[100] bg-black flex items-end justify-between"
  style="padding:32px 28px;"
>
  <div class="tp-label" style="letter-spacing:.28em; opacity:.8;">{t(locale, 'loaderTagline')}</div>
  <div id="tp-count" class="font-mono" style="font-size:clamp(3rem,12vw,9rem); line-height:.8; font-weight:300; letter-spacing:-.02em;">000</div>
</div>

<div
  id="tp-detail"
  role="dialog"
  aria-modal="true"
  aria-hidden="true"
  aria-labelledby="tp-detail-title"
  class="fixed inset-0 z-[70] flex flex-col justify-end"
  style="padding:28px; opacity:0; transform:translateY(24px); pointer-events:none; background:linear-gradient(180deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.35) 22%, rgba(0,0,0,.6) 62%, rgba(0,0,0,.96) 100%);"
>
  <div class="tp-label absolute flex justify-between items-start" style="top:24px; left:28px; right:28px; letter-spacing:.28em;">
    <span id="tp-detail-meta">01</span>
    <button
      id="tp-detail-close"
      type="button"
      data-cursor="link"
      class="tp-label bg-transparent text-white"
      style="border:1px solid rgba(255,255,255,.4); letter-spacing:.28em; padding:8px 16px;"
    >{t(locale, 'detailClose')}</button>
  </div>
  <div style="max-width:820px;">
    <h2 id="tp-detail-title" class="tp-h2" style="margin:0 0 18px; font-size:clamp(2rem,6vw,4.6rem); line-height:.95;">—</h2>
    <p id="tp-detail-desc" style="margin:0; font-size:clamp(1rem,1.6vw,1.35rem); line-height:1.5; font-weight:300; max-width:60ch; opacity:.8; text-wrap:pretty;">—</p>
    <a id="tp-detail-link" href="#" target="_blank" rel="noopener" data-cursor="link" class="tp-link" style="margin-top:26px; padding-bottom:6px;">{t(locale, 'detailView')}</a>
  </div>
</div>

<div
  id="tp-scrollcue"
  aria-hidden="true"
  class="tp-label-sm fixed z-[60] flex items-center"
  style="left:28px; bottom:28px; gap:14px; mix-blend-mode:difference; transition:opacity .5s ease; letter-spacing:.3em;"
>
  <span class="block bg-white" style="width:1px; height:48px; animation:tpLine 2.4s cubic-bezier(.7,0,.3,1) infinite;"></span>
  <span style="opacity:.82;">{t(locale, 'scrollCue')}</span>
</div>
```

- [ ] **Step 2: Create `src/components/home/HeroSection.astro`**

```astro
---
import { type Locale, t } from '../../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const meta = ['16°14′N 61°32′W', 'UTC−4', 'Infra as code'];
---

<section
  id="tp-hero"
  class="flex flex-col justify-between pointer-events-none"
  style="min-height:100vh; box-sizing:border-box; gap:clamp(10px,1.6vh,24px); padding:clamp(64px,10vh,104px) 28px clamp(84px,14vh,104px);"
>
  <div>
    <div class="tp-label flex flex-wrap items-baseline" style="gap:10px 22px; margin-bottom:clamp(10px,2vh,22px);">
      <span style="color:#a8cf3e;" data-split="1">{t(locale, 'brand')}</span>
      <span style="opacity:.82;" data-split="1">{t(locale, 'heroEyebrow')}</span>
    </div>
    <h1
      class="uppercase"
      style="margin:0; font-weight:500; font-size:clamp(1.9rem,min(7.6vw,9vh),6.4rem); line-height:.94; letter-spacing:.005em; text-wrap:balance; max-width:20ch;"
      data-split="1"
    >{t(locale, 'heroHeadline1')}<br />{t(locale, 'heroHeadline2')}<br /><span style="color:#a8cf3e;">{t(locale, 'heroHeadline3')}</span></h1>
  </div>
  <div class="flex flex-col" style="gap:clamp(10px,1.8vh,20px); max-width:52ch;">
    <div class="flex flex-col" style="gap:12px;">
      <span class="tp-label-sm" style="letter-spacing:.3em; opacity:.72;">{t(locale, 'heroQuoteLabel')}</span>
      <p style="margin:0; font-size:clamp(.9rem,1.15vw,1.05rem); line-height:1.55; font-weight:300; text-wrap:pretty; border-left:1px solid rgba(255,255,255,.35); padding-left:20px;" data-split="1">{t(locale, 'heroQuote')}</p>
    </div>
    <div class="flex flex-col" style="gap:14px;">
      <p style="margin:0; font-size:clamp(.85rem,1.1vw,1.02rem); line-height:1.55; font-weight:300; opacity:.9; text-wrap:pretty;" data-split="1">{t(locale, 'heroP1')}</p>
      <p style="margin:0; font-size:clamp(.85rem,1.1vw,1.02rem); line-height:1.55; font-weight:300; opacity:.82; text-wrap:pretty;" data-split="1">{t(locale, 'heroP2')}</p>
      <div class="tp-label-sm flex flex-wrap" style="gap:8px 20px; margin-top:4px; letter-spacing:.26em; opacity:.58;">
        {meta.map((m) => <span>{m}</span>)}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Create `src/components/home/WorkSection.astro` and `ProjectsFallbackGrid.astro`**

`WorkSection.astro`:

```astro
---
import { type Locale, t } from '../../i18n';
import type { FeaturedProject } from '../../lib/featured-projects';

interface Props {
  locale: Locale;
  projects: FeaturedProject[];
}

const { locale, projects } = Astro.props;
const first = projects[0];
const total = String(projects.length).padStart(2, '0');
const firstTag = first ? `${first.plateTag} — ${first.year}` : '';
---

<section id="tp-work" data-screen-label="Work" class="relative" style="height:340vh;">
  <div
    id="tp-work-hud"
    class="sticky top-0 flex flex-col justify-between pointer-events-none"
    style="height:100vh; box-sizing:border-box; padding:96px 28px 32px;"
  >
    <div class="tp-label flex justify-between items-start">
      <span data-split="1">{t(locale, 'workLabel')}</span>
      <span style="opacity:.8;">{t(locale, 'workScroll')}</span>
    </div>
    <div class="flex items-end justify-between" style="gap:24px;">
      <div>
        <div id="tp-idx-title" class="uppercase" style="font-size:clamp(1.3rem,3.6vw,2.6rem); font-weight:400; letter-spacing:.02em; line-height:1; overflow-wrap:anywhere;">{first?.title ?? ''}</div>
        <div id="tp-idx-tag" class="tp-label" style="letter-spacing:.24em; opacity:.8; margin-top:12px;">{firstTag}</div>
      </div>
      <div id="tp-idx-num" class="font-mono" style="font-size:clamp(2rem,6vw,4.5rem); font-weight:300; line-height:.8;">01<span style="opacity:.35; font-size:.4em;">/{total}</span></div>
    </div>
  </div>
</section>
```

`ProjectsFallbackGrid.astro`:

```astro
---
import { type Locale, t } from '../../i18n';
import type { FeaturedProject } from '../../lib/featured-projects';

interface Props {
  locale: Locale;
  projects: FeaturedProject[];
}

const { locale, projects } = Astro.props;
---

{/* Read by the scene script for the 3D plates; shown as-is when WebGL is missing. */}
<div id="tp-projects" class="relative z-10" style="display:none; padding:120px 28px;">
  <div class="tp-label" style="opacity:.8; margin-bottom:40px;">{t(locale, 'workLabel')}</div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:2px;">
    {projects.map((p) => (
      <article
        data-project={p.index}
        data-title={p.title}
        data-tag={p.plateTag}
        data-year={p.year}
        data-desc={p.description}
        data-url={p.url}
        data-motif={p.motif}
        class="flex flex-col justify-between"
        style="border:1px solid rgba(255,255,255,.18); padding:28px; min-height:220px;"
      >
        <span class="font-mono" style="font-size:11px; letter-spacing:.24em; opacity:.74;">{String(p.index).padStart(2, '0')}</span>
        <div>
          <h3 class="uppercase" style="margin:0 0 8px; font-size:1.5rem; font-weight:500; letter-spacing:.02em;">
            <a href={p.url} target="_blank" rel="noopener" data-cursor="link">{p.title}</a>
          </h3>
          <p class="tp-label" style="margin:0; letter-spacing:.2em; opacity:.74;">{`${p.plateTag} — ${p.year}`}</p>
        </div>
      </article>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Create `src/components/home/AboutSection.astro`**

```astro
---
import { type Locale, t } from '../../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const rows = [
  { label: t(locale, 'aboutRow1Label'), text: t(locale, 'aboutRow1Text') },
  { label: t(locale, 'aboutRow2Label'), text: t(locale, 'aboutRow2Text') },
  { label: t(locale, 'aboutRow3Label'), text: t(locale, 'aboutRow3Text') },
];
---

<section id="tp-about" data-screen-label="About" class="flex items-center" style="min-height:80vh; padding:110px 28px;">
  <div class="flex flex-wrap w-full" style="gap:44px 56px; max-width:1400px;">
    <img
      id="tp-portrait"
      src="/images/moi.png"
      alt="Xavier Gueret"
      width="300"
      height="400"
      loading="lazy"
      class="tp-mono-img tp-mono-self block w-full object-cover self-start"
      style="flex:0 1 240px; min-width:0; max-width:300px; aspect-ratio:3/4; object-position:50% 22%;"
    />
    <div class="flex flex-col" style="flex:1 1 320px; min-width:0; gap:22px;">
      <div class="tp-label" style="opacity:.8;" data-split="1">{t(locale, 'aboutLabel')}</div>
      <h2 class="tp-h2" data-split="1">{t(locale, 'aboutTitle1')}<br />{t(locale, 'aboutTitle2')}</h2>
    </div>
    <div class="flex flex-col" style="flex:2 1 520px; min-width:0; gap:34px;">
      <div class="flex flex-col" style="gap:16px; max-width:62ch;">
        <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; text-wrap:pretty;" data-split="1">{t(locale, 'aboutP1')}</p>
        <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; opacity:.86; text-wrap:pretty;" data-split="1">{t(locale, 'aboutP2')}</p>
      </div>
      <div class="flex flex-col" style="gap:2px;">
        {rows.map((r) => (
          <div class="tp-row">
            <span class="tp-row-label">{r.label}</span>
            <span style="font-size:.95rem; line-height:1.5; font-weight:300;">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 5: Create `src/components/home/BlogSection.astro`**

```astro
---
import { type Locale, t, localePrefix, formatDate } from '../../i18n';

interface FeaturedPost {
  title: string;
  href: string;
  image?: string;
  imageAlt: string;
  description?: string;
  date: Date;
  readingMinutes: number;
}

interface Props {
  locale: Locale;
  post?: FeaturedPost;
}

const { locale, post } = Astro.props;
const blogHref = `${localePrefix(locale)}/blog/`;
const postMeta = post ? `${formatDate(post.date, locale)} · ${post.readingMinutes} ${t(locale, 'minShort')}` : '';
---

<section id="tp-blog" data-screen-label="Blog" class="flex items-center" style="min-height:70vh; padding:110px 28px;">
  <div class="flex flex-wrap items-end w-full" style="gap:44px 56px; max-width:1400px;">
    <div class="flex flex-col" style="flex:1 1 360px; min-width:0; gap:22px;">
      <div class="tp-label" style="opacity:.8;" data-split="1">{t(locale, 'blogLabel')}</div>
      <h2 class="tp-h2" data-split="1">{t(locale, 'blogTitle1')}<br />{t(locale, 'blogTitle2')}</h2>
    </div>
    <div class="flex flex-col" style="flex:1 1 340px; min-width:0; gap:26px; max-width:52ch;">
      <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; opacity:.9; text-wrap:pretty;" data-split="1">{t(locale, 'blogIntro')}</p>
      <a href={blogHref} data-cursor="link" class="tp-link self-start">
        <span>{t(locale, 'blogReadAll')}</span>
        <span style="color:#a8cf3e;">↗</span>
      </a>
    </div>

    {post && (
      <a
        id="tp-featured"
        href={post.href}
        data-cursor="link"
        class="tp-mono-hover flex flex-wrap items-stretch"
        style="flex:1 1 100%; border:1px solid rgba(255,255,255,.2); transition:border-color .3s ease;"
      >
        {post.image && (
          <img
            id="tp-featured-img"
            src={post.image}
            alt={post.imageAlt}
            loading="lazy"
            class="tp-mono-img block w-full object-cover self-stretch"
            style="flex:1 1 320px; min-width:0; min-height:240px; max-height:360px;"
          />
        )}
        <div class="flex flex-col" style="flex:1 1 360px; min-width:0; gap:16px; padding:clamp(22px,3vw,34px);">
          <div class="tp-label-sm flex flex-wrap" style="gap:8px 18px; letter-spacing:.26em;">
            <span style="color:#a8cf3e;">{t(locale, 'blogFeatured')}</span>
            <span style="opacity:.6;">{postMeta}</span>
          </div>
          <h3 style="margin:0; font-size:clamp(1.15rem,1.9vw,1.6rem); font-weight:500; line-height:1.2; letter-spacing:.005em; text-wrap:pretty;">{post.title}</h3>
          {post.description && (
            <p style="margin:0; font-size:.95rem; line-height:1.55; font-weight:300; opacity:.82; text-wrap:pretty;">{post.description}</p>
          )}
          <span class="tp-label flex items-baseline" style="gap:12px; margin-top:2px; letter-spacing:.28em;">{t(locale, 'blogReadArticle')} <span style="color:#a8cf3e;">↗</span></span>
        </div>
      </a>
    )}
  </div>
</section>

<style>
  #tp-featured:hover { opacity: 1; border-color: #a8cf3e !important; }
</style>
```

- [ ] **Step 6: Create `src/components/home/CvSection.astro`**

```astro
---
import { type Locale, t } from '../../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const pdf = locale === 'fr' ? '/assets/cv.fr.pdf' : '/assets/cv.en.pdf';

const stack = [
  { label: t(locale, 'cvStackAutomation'), value: 'Terraform, Ansible' },
  { label: t(locale, 'cvStackCi'), value: 'Jenkins, GitLab CI, GitHub Actions' },
  { label: t(locale, 'cvStackContainers'), value: 'Docker, Kubernetes' },
  { label: t(locale, 'cvStackScripting'), value: 'Bash, Python' },
  { label: t(locale, 'cvStackAi'), value: 'Claude Code, Ollama, MCP' },
];

const certs = [
  {
    name: 'CKA — Certified Kubernetes Administrator',
    issuer: 'Linux Foundation · 2023 ↗',
    image: '/images/badges/cka.png',
    alt: 'Badge CKA',
    href: 'https://www.credly.com/badges/dfcc38d2-4c29-4da4-9483-d96de72a1f29/public_url',
  },
  {
    name: 'CKAD — Kubernetes Application Developer',
    issuer: 'Linux Foundation · 2026 ↗',
    image: '/images/badges/ckad.png',
    alt: 'Badge CKAD',
    href: 'https://www.credly.com/badges/d4b18a00-4c59-4a0f-a5fb-35e6b4b8236f/public_url',
  },
  {
    name: 'HashiCorp Certified — Terraform Associate',
    issuer: 'HashiCorp · 2023 ↗',
    image: '/images/badges/terraform-associate.png',
    alt: 'Badge Terraform Associate',
    href: 'https://www.credly.com/badges/a20c23e0-e453-433d-a100-e7056fab84be/public_url',
  },
];
---

<section id="tp-cv" data-screen-label="CV" class="flex items-center" style="min-height:100vh; padding:120px 28px;">
  <div class="flex flex-wrap w-full" style="gap:44px 56px; max-width:1400px;">
    <div class="flex flex-col" style="flex:1 1 300px; min-width:0; max-width:38ch; gap:22px;">
      <div class="tp-label" style="opacity:.8;" data-split="1">{t(locale, 'cvLabel')}</div>
      <p style="margin:0; font-size:clamp(1.1rem,2vw,1.7rem); line-height:1.25; font-weight:300; text-wrap:pretty; max-width:24ch;" data-split="1">{t(locale, 'cvTagline')}</p>
      <a href={pdf} target="_blank" rel="noopener" data-cursor="link" class="tp-link self-start" style="padding-bottom:6px;">{t(locale, 'cvDownload')}</a>
    </div>

    <div class="flex flex-col" style="flex:2 1 560px; min-width:0; gap:2px;">
      <div class="tp-row" style="grid-template-columns:minmax(90px,130px) 1fr; padding:22px 0;">
        <span class="tp-row-label">{t(locale, 'cvProfileLabel')}</span>
        <div class="flex flex-col" style="gap:10px;">
          <p style="margin:0; font-size:.95rem; line-height:1.55; font-weight:300; opacity:.9; max-width:60ch; text-wrap:pretty;">{t(locale, 'cvProfileP1')}</p>
          <p style="margin:0; font-size:.95rem; line-height:1.55; font-weight:300; opacity:.9; max-width:60ch; text-wrap:pretty;">{t(locale, 'cvProfileP2')}</p>
        </div>
      </div>

      <div class="tp-row" style="grid-template-columns:minmax(90px,130px) 1fr; padding:22px 0;">
        <span class="tp-row-label">{t(locale, 'cvStackLabel')}</span>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:18px 32px;">
          {stack.map((s) => (
            <div class="flex flex-col" style="gap:6px;">
              <span class="tp-label-sm" style="letter-spacing:.24em; opacity:.62;">{s.label}</span>
              <span style="font-size:.95rem; font-weight:300;">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div class="tp-row" style="grid-template-columns:minmax(90px,130px) 1fr; padding:22px 0;">
        <span class="tp-row-label">{t(locale, 'cvCertsLabel')}</span>
        <div class="flex flex-col" style="gap:16px;">
          {certs.map((c) => (
            <a href={c.href} target="_blank" rel="noopener" data-cursor="link" class="flex items-center" style="gap:16px;">
              <img src={c.image} alt={c.alt} width="56" height="56" loading="lazy" class="block flex-none object-contain" style="width:56px; height:56px;" />
              <div class="flex flex-col" style="gap:6px;">
                <span class="uppercase" style="font-size:1.02rem; font-weight:500; letter-spacing:.02em;">{c.name}</span>
                <span class="tp-label-sm" style="letter-spacing:.22em; opacity:.62;">{c.issuer}</span>
              </div>
            </a>
          ))}
          <span style="font-size:1.02rem; font-weight:400; opacity:.9;">Red Hat Ansible Specialist</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 7: Create `src/components/home/ContactSection.astro`**

```astro
---
import { type Locale, t } from '../../i18n';
import FooterLine from '../FooterLine.astro';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const fields = [
  { name: 'name', type: 'text', label: t(locale, 'contactName') },
  { name: 'email', type: 'email', label: t(locale, 'contactEmail') },
];
---

<section id="tp-contact" data-screen-label="Contact" class="flex flex-col justify-center" style="min-height:100vh; box-sizing:border-box; padding:120px 28px 40px;">
  <div class="flex flex-wrap w-full" style="gap:44px 56px; max-width:1400px;">
    <div class="flex flex-col" style="flex:1 1 360px; min-width:0; gap:24px;">
      <div class="tp-label" style="opacity:.8;" data-split="1">{t(locale, 'contactLabel')}</div>
      <h2 class="tp-h2" data-split="1">{t(locale, 'contactHeadline')}</h2>
      <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; opacity:.9; max-width:44ch; text-wrap:pretty;" data-split="1">{t(locale, 'contactDescription')}</p>
      <div class="flex flex-col" style="gap:16px; margin-top:8px;">
        <span class="tp-label-sm" style="opacity:.62;">{t(locale, 'contactOrSocial')}</span>
        <div class="flex flex-wrap" style="gap:14px;">
          <a href="https://www.linkedin.com/in/xavier-gueret-47bb3019b/" target="_blank" rel="noopener" data-cursor="link" class="tp-social">
            <span class="flex items-center justify-center flex-none" style="width:22px; height:22px; background:#0A66C2; border-radius:3px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </span>
            <span>LinkedIn</span>
          </a>
          <a href="https://github.com/xgueret/" target="_blank" rel="noopener" data-cursor="link" class="tp-social">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>

    <form
      id="tp-form"
      action="https://formspree.io/f/xjgegddj"
      method="POST"
      class="flex flex-col"
      style="flex:1 1 360px; min-width:0; gap:22px; max-width:560px;"
    >
      {fields.map((f) => (
        <label class="flex flex-col" style="gap:10px;">
          <span class="tp-label-sm" style="opacity:.74;">{f.label}</span>
          <input type={f.type} name={f.name} required data-cursor="link" class="tp-field" />
        </label>
      ))}
      <label class="flex flex-col" style="gap:10px;">
        <span class="tp-label-sm" style="opacity:.74;">{t(locale, 'contactMessage')}</span>
        <textarea name="message" rows="4" required data-cursor="link" class="tp-field" style="resize:vertical;"></textarea>
      </label>
      <button type="submit" data-cursor="link" class="tp-button self-start" style="margin-top:6px;">{t(locale, 'contactSend')}</button>
      <p
        id="tp-form-msg"
        role="status"
        aria-live="polite"
        data-success={t(locale, 'contactSuccess')}
        data-error={t(locale, 'contactError')}
        class="tp-label"
        style="margin:0; min-height:1.4em; letter-spacing:.18em; opacity:0; transition:opacity .4s ease;"
      ></p>
    </form>
  </div>

  <div style="margin-top:72px;">
    <FooterLine locale={locale} footage />
  </div>
</section>

<script>
  const form = document.getElementById('tp-form') as HTMLFormElement | null;
  const msg = document.getElementById('tp-form-msg');

  function show(kind: 'success' | 'error'): void {
    if (!msg) return;
    msg.textContent = msg.dataset[kind] ?? '';
    msg.style.opacity = '1';
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        show('success');
      } else {
        show('error');
      }
    } catch {
      show('error');
    }
  });
</script>
```

- [ ] **Step 8: Rewrite `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SceneLayer from '../components/home/SceneLayer.astro';
import HeroSection from '../components/home/HeroSection.astro';
import WorkSection from '../components/home/WorkSection.astro';
import ProjectsFallbackGrid from '../components/home/ProjectsFallbackGrid.astro';
import AboutSection from '../components/home/AboutSection.astro';
import BlogSection from '../components/home/BlogSection.astro';
import CvSection from '../components/home/CvSection.astro';
import ContactSection from '../components/home/ContactSection.astro';
import { t, localePrefix, type Locale } from '../i18n';
import { getCollection } from 'astro:content';
import { getReadingTime } from '../utils/readingTime';
import { personLd } from '../lib/person-ld';
import { getFeaturedProjects } from '../lib/featured-projects';

const locale: Locale = 'fr';
const site = Astro.site?.toString().replace(/\/$/, '') || '';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: 'Xavier GUERET', url: site, inLanguage: ['fr', 'en'] },
    personLd(site, locale),
  ],
};

const projects = await getFeaturedProjects(locale);

const posts = await getCollection('posts', ({ id, data }) => id.startsWith(`${locale}/`) && !data.draft && !data.archived);
const latest = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())[0];
const featuredPost = latest && {
  title: latest.data.title,
  href: `${localePrefix(locale)}/blog/${latest.id.replace(`${locale}/`, '').replace(/\.md$/, '')}/`,
  image: latest.data.image,
  imageAlt: latest.data.imageAlt ?? latest.data.title,
  description: latest.data.description,
  date: latest.data.date,
  readingMinutes: getReadingTime(latest.body ?? ''),
};
---

<BaseLayout title={t(locale, 'homeTitle')} locale={locale} jsonLd={jsonLd} home>
  <SceneLayer locale={locale} />
  <div id="tp-main" class="relative z-10" style="transition:opacity .55s cubic-bezier(.16,1,.3,1);">
    <HeroSection locale={locale} />
    <WorkSection locale={locale} projects={projects} />
    <AboutSection locale={locale} />
    <BlogSection locale={locale} post={featuredPost} />
    <CvSection locale={locale} />
    <ContactSection locale={locale} />
  </div>
  <ProjectsFallbackGrid locale={locale} projects={projects} />
  <script>import '../scripts/home';</script>
</BaseLayout>
```

The `<script>` sits inside the layout slot so it renders inside `<body>` (Astro 5 renders scripts where they appear).

- [ ] **Step 9: Rewrite `src/pages/en/index.astro`**

Identical to Step 8 with `const locale: Locale = 'en';`, every import path prefixed with one more `../` (`'../../layouts/BaseLayout.astro'`, `'../../components/home/…'`, `'../../i18n'`, `'../../utils/readingTime'`, `'../../lib/person-ld'`, `'../../lib/featured-projects'`) and the script `import '../../scripts/home';` (inside the layout slot as in Step 8).

- [ ] **Step 10: Create the temporary `src/scripts/home.ts` stub (replaced in Task 8)**

```ts
// Filled in Task 8: capabilities detection → three.js scene or DOM fallback.
export {};
```

- [ ] **Step 11: Build and check**

```bash
pnpm exec astro check && pnpm build && python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
grep -c 'data-project=' dist/index.html dist/en/index.html
grep -o '<h1' dist/index.html | wc -l
```

Expected: checks pass, `6` projects on each home, exactly `1` h1. In `pnpm preview`, `/` shows the loader stuck at `000` over the page (no script yet — expected until Task 8) — temporarily confirm the sections by running in the browser console: `document.getElementById('tp-loader').remove()`.

- [ ] **Step 12: Commit checkpoint (ask the user first)**

```bash
git add src/components/home src/pages/index.astro src/pages/en/index.astro src/scripts/home.ts
git commit -m "feat(home): one-page monochrome home composed from collections and i18n"
```

---

### Task 8: Motion and WebGL scripts

**Files:**
- Create: `src/scripts/ui/cursor.ts`, `src/scripts/ui/split-text.ts`, `src/scripts/scene/config.ts`, `src/scripts/scene/capabilities.ts`, `src/scripts/scene/noise.ts`, `src/scripts/scene/backdrop.ts`, `src/scripts/scene/motifs.ts`, `src/scripts/scene/cards.ts`, `src/scripts/scene/post.ts`, `src/scripts/scene/fallback.ts`, `src/scripts/scene/index.ts`
- Modify: `src/scripts/home.ts`, `src/scripts/blog.ts` (replace the stubs)

**Interfaces:**
- Consumes the DOM contract of Task 7.
- `initCursor(options?: { autoLoop?: boolean }): Cursor` — `Cursor.pointer` is `{ nx, ny, sx, sy, vel, domHover }` (normalized pointer, smoothed pointer, velocity, DOM hover flag); `Cursor.update()` advances inertia one frame; `Cursor.setBoost(on)` scales the dot when a 3D card is hovered.
- `initSplitText(): void`
- `detectCapabilities(): Capabilities` with `{ mobile, reduced, webgl }`.
- `startScene(caps: Capabilities): void`
- `fallbackDOM(): void`

- [ ] **Step 1: `src/scripts/ui/cursor.ts`**

```ts
export interface PointerState {
  nx: number;
  ny: number;
  sx: number;
  sy: number;
  vel: number;
  domHover: boolean;
}

export interface Cursor {
  pointer: PointerState;
  setBoost(on: boolean): void;
  update(): void;
  destroy(): void;
}

/**
 * Custom cursor dot with inertia. Also owns the normalized pointer state the
 * scene reads for parallax and raycasting, so both consumers see one source.
 */
export function initCursor(options: { autoLoop?: boolean } = {}): Cursor {
  const el = document.getElementById('tp-cursor');
  const pointer: PointerState = { nx: 0, ny: 0, sx: 0, sy: 0, vel: 0, domHover: false };
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let scale = 1;
  let boost = false;
  let raf = 0;

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.classList.add('tp-cursor');
  }

  const move = (e: PointerEvent): void => {
    tx = e.clientX;
    ty = e.clientY;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.vel = Math.min(1, pointer.vel + Math.hypot(nx - pointer.nx, ny - pointer.ny) * 3.2);
    pointer.nx = nx;
    pointer.ny = ny;
    if (el) el.style.opacity = '1';
  };

  const over = (e: PointerEvent): void => {
    const target = e.target as Element | null;
    pointer.domHover = !!(target && target.closest && target.closest('[data-cursor]'));
  };

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerover', over);

  const update = (): void => {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    const scaleT = pointer.domHover || boost ? 3.2 : 1;
    scale += (scaleT - scale) * 0.12;
    if (el) el.style.transform = `translate(${x - 7}px,${y - 7}px) scale(${scale.toFixed(3)})`;
    pointer.sx += (pointer.nx - pointer.sx) * 0.05;
    pointer.sy += (pointer.ny - pointer.sy) * 0.05;
    pointer.vel *= 0.92;
  };

  const loop = (): void => {
    raf = requestAnimationFrame(loop);
    update();
  };
  if (options.autoLoop) raf = requestAnimationFrame(loop);

  return {
    pointer,
    setBoost: (on) => { boost = on; },
    update,
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    },
  };
}
```

- [ ] **Step 2: `src/scripts/ui/split-text.ts`**

```ts
/**
 * Split every `[data-split]` element into per-character spans (words kept
 * unbreakable) and reveal them when the element enters the viewport. The
 * stagger reads left-to-right with a small per-character jitter, so a line
 * resolves out of a blur rather than marching in like a ticker.
 */
export function initSplitText(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-split]'));

  els.forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';

    const walk = (node: Node): void => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          (n.textContent ?? '').split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            const word = document.createElement('span');
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';
            part.split('').forEach((ch) => {
              const s = document.createElement('span');
              s.className = 'tp-char';
              s.textContent = ch;
              word.appendChild(s);
            });
            frag.appendChild(word);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);

    el.querySelectorAll<HTMLElement>('.tp-char').forEach((s, i) => {
      const d = i * 0.016 + (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.09;
      s.style.transitionDelay = `${d.toFixed(3)}s`;
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('tp-in');
      });
    },
    { threshold: 0.2 }
  );
  els.forEach((el) => io.observe(el));
  // Safety net: never leave copy invisible.
  window.setTimeout(() => els.forEach((el) => el.classList.add('tp-in')), 6000);
}
```

- [ ] **Step 3: `src/scripts/scene/config.ts`, `capabilities.ts`, `noise.ts`**

`config.ts`:

```ts
/** Frozen values of the mockup's tweak panel (spec §3, decision 8). */
export const SCENE = {
  pastel: 0.4,
  bgLevel: 1,
  drift: 1,
  grain: 0.075,
  postFx: true,
  cardBlur: 1,
} as const;

export const LIME = '#a8cf3e';

/** Card column: first plate depth and spacing along Z. */
export const CARD_FIRST_Z = -11;
export const CARD_GAP_Z = 7.5;
/** Camera flies from the hero (z 8) to just past the last card. */
export const CAMERA_START_Z = 8;
export const CAMERA_TRAVEL_Z = 58;
```

`capabilities.ts`:

```ts
export interface Capabilities {
  mobile: boolean;
  reduced: boolean;
  webgl: boolean;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/**
 * Touch-first devices get the light path. A narrow desktop window must not
 * latch it, so width alone never decides.
 */
export function detectCapabilities(): Capabilities {
  const mq = (q: string): boolean => window.matchMedia(q).matches;
  return {
    mobile: mq('(pointer: coarse)') || (mq('(max-width: 820px)') && mq('(hover: none)')),
    reduced: mq('(prefers-reduced-motion: reduce)'),
    webgl: hasWebGL(),
  };
}
```

`noise.ts`:

```ts
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function n1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

/** Three-octave value-noise fBm in [-1, 1], used for organic camera drift. */
export function fbm(x: number): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 3; i++) {
    v += a * (n1(x * f) - 0.5) * 2;
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}
```

- [ ] **Step 4: `src/scripts/scene/backdrop.ts`**

```ts
import {
  LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, VideoTexture,
} from 'three';

export interface Backdrop {
  scene: Scene;
  camera: OrthographicCamera;
  update(t: number, progress: number, sx: number, sy: number, textCover: number): void;
  dispose(): void;
}

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }';

const FRAG = `
uniform sampler2D uTex; uniform vec2 uFit; uniform vec2 uMouse;
uniform float uTime; uniform float uZoom; uniform float uLevel; uniform float uPastel;
varying vec2 vUv;
void main(){
  vec2 uv = (vUv - 0.5) * uFit / uZoom;
  uv += uMouse * 0.018;                                   // pointer parallax
  uv.x += sin(uv.y * 3.4 + uTime * 0.22) * 0.006;         // slow liquid drift
  uv.y += cos(uv.x * 3.0 + uTime * 0.18) * 0.005;
  vec3 rgb = texture2D(uTex, clamp(uv + 0.5, 0.001, 0.999)).rgb;
  float l = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - 0.5) * 1.26 + 0.44, 0.0, 1.0);           // monochrome, punchy
  l = pow(l, 1.5) * 0.72;                                 // hold it down under the type
  float h = 0.5 + 0.5 * sin(uTime * 0.07 + vUv.x * 2.1 + vUv.y * 1.4);
  vec3 hi = mix(vec3(0.70,0.99,0.84), vec3(1.00,0.82,0.70), h);
  vec3 lo = mix(vec3(0.60,0.64,1.00), vec3(0.72,0.90,1.00), h);
  vec3 col = vec3(l) * mix(lo, hi, smoothstep(0.12, 0.88, l));
  col = mix(vec3(l), col, clamp(uPastel, 0.0, 1.0));
  gl_FragColor = vec4(col * uLevel, 1.0);
}`;

/**
 * One piece of footage running behind the whole page: a fullscreen ortho quad
 * drawn before the 3D scene, graded to luminance with a slow pastel wash.
 * Sources are tried in order until one plays.
 */
export function createBackdrop(sources: string[], pastel: number, level: number): Backdrop {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';

  let ready = false;
  let failed = false;
  let si = 0;
  const load = (): void => { video.src = sources[si]; video.load(); };
  video.addEventListener('error', () => { if (++si < sources.length) load(); else failed = true; });
  video.addEventListener('loadeddata', () => { ready = true; video.play().catch(() => {}); });
  load();

  // Autoplay is often refused until the first gesture — retry once on input.
  const kick = (): void => { video.play().catch(() => {}); };
  (['pointerdown', 'wheel', 'keydown', 'touchstart'] as const).forEach((ev) =>
    window.addEventListener(ev, kick, { once: true, passive: true })
  );

  const tex = new VideoTexture(video);
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;

  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTex: { value: tex },
      uFit: { value: new Vector2(1, 1) },
      uTime: { value: 0 },
      uZoom: { value: 1 },
      uMouse: { value: new Vector2(0, 0) },
      uLevel: { value: 0 },
      uPastel: { value: pastel },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    scene,
    camera,
    update(t, progress, sx, sy, textCover) {
      const u = material.uniforms;
      const vw = video.videoWidth || 16;
      const vh = video.videoHeight || 9;
      const va = vw / vh;
      const sa = window.innerWidth / window.innerHeight;
      if (va > sa) u.uFit.value.set(sa / va, 1); else u.uFit.value.set(1, va / sa);
      u.uTime.value = t;
      u.uZoom.value = 1.06 + progress * 0.22;
      u.uMouse.value.set(-sx, -sy);
      const target = ready && !failed ? level * (1 - textCover * 0.45) : 0;
      u.uLevel.value += (target - u.uLevel.value) * 0.09;
    },
    dispose() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      material.dispose();
    },
  };
}
```

- [ ] **Step 5: `src/scripts/scene/motifs.ts`**

```ts
import { LIME } from './config';

export type Motif = 'rings' | 'rack' | 'graph' | 'columns' | 'terminal' | 'wireframe';

/**
 * One drawn identity per project, same typographic system so the six read as
 * a family. A single lime accent marks the subject of each drawing. The canvas
 * is 1024×640; `ink` is the plate's foreground, `inverted` means ink on white.
 */
export function drawMotif(x: CanvasRenderingContext2D, motif: Motif, ink: string, inverted: boolean): void {
  const A = LIME;
  const soft = inverted ? 'rgba(0,0,0,.34)' : 'rgba(255,255,255,.34)';
  const ground = inverted ? '#fff' : '#000';
  x.lineJoin = 'round';

  if (motif === 'rings') {                       // target / rings
    const cx = 700, cy = 262;
    x.strokeStyle = ink;
    [172, 130, 88].forEach((r, k) => { x.lineWidth = k === 0 ? 3 : 2; x.beginPath(); x.arc(cx, cy, r, 0, 6.2832); x.stroke(); });
    x.strokeStyle = soft; x.lineWidth = 2;
    for (let a = 0; a < 12; a++) {
      const t = (a * Math.PI) / 6;
      x.beginPath();
      x.moveTo(cx + Math.cos(t) * 176, cy + Math.sin(t) * 176);
      x.lineTo(cx + Math.cos(t) * 206, cy + Math.sin(t) * 206);
      x.stroke();
    }
    x.fillStyle = A; x.beginPath(); x.arc(cx, cy, 30, 0, 6.2832); x.fill();
    x.strokeStyle = ink; x.lineWidth = 2;
    x.beginPath(); x.moveTo(300, cy); x.lineTo(cx - 200, cy); x.stroke();
  } else if (motif === 'rack') {                 // racked modules on a bus
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(80, 300); x.lineTo(944, 300); x.stroke();
    const fill = [0, 3, 4, 7, 9];
    for (let k = 0; k < 12; k++) {
      const px = 80 + (k % 4) * 224, py = 176 + Math.floor(k / 4) * 92;
      x.lineWidth = 3;
      if (k === 6) { x.fillStyle = A; x.fillRect(px, py, 188, 62); }
      else if (fill.indexOf(k) > -1) { x.fillStyle = ink; x.fillRect(px, py, 188, 62); }
      else { x.strokeStyle = ink; x.strokeRect(px + 1.5, py + 1.5, 185, 59); }
      x.fillStyle = ground;
      if (fill.indexOf(k) > -1 || k === 6) for (let s = 0; s < 3; s++) x.fillRect(px + 16 + s * 22, py + 27, 12, 8);
    }
  } else if (motif === 'graph') {                // node graph
    const nodes: Array<[number, number]> = [[210, 200], [430, 160], [640, 230], [300, 340], [530, 370], [790, 330]];
    x.strokeStyle = soft; x.lineWidth = 2;
    ([[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [2, 4]] as Array<[number, number]>).forEach((e) => {
      x.beginPath(); x.moveTo(nodes[e[0]][0], nodes[e[0]][1]); x.lineTo(nodes[e[1]][0], nodes[e[1]][1]); x.stroke();
    });
    nodes.forEach((n, k) => {
      x.beginPath(); x.arc(n[0], n[1], k === 1 ? 40 : 30, 0, 6.2832);
      if (k === 1) { x.fillStyle = A; x.fill(); }
      else { x.fillStyle = ground; x.fill(); x.strokeStyle = ink; x.lineWidth = 3; x.stroke(); }
    });
  } else if (motif === 'columns') {              // stacked columns
    const cols = [3, 5, 4, 7, 9, 6];
    cols.forEach((n, k) => {
      for (let s = 0; s < n; s++) {
        const px = 120 + k * 132, py = 404 - s * 30;
        x.fillStyle = k === 4 && s === n - 1 ? A : (s % 2 ? soft : ink);
        x.fillRect(px, py, 96, 22);
      }
    });
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(96, 430); x.lineTo(944, 430); x.stroke();
  } else if (motif === 'terminal') {             // terminal
    x.font = '400 30px "JetBrains Mono", monospace';
    const rows = [520, 340, 610, 250, 430];
    rows.forEach((w, k) => {
      const py = 178 + k * 54;
      x.fillStyle = soft; x.fillText('$', 80, py + 24);
      x.fillStyle = k === 2 ? A : ink;
      x.fillRect(124, py + 6, w, 20);
    });
    x.fillStyle = ink; x.fillRect(124 + 430 + 12, 178 + 4 * 54 + 6, 22, 20);   // caret
  } else {                                       // page wireframe
    x.strokeStyle = ink; x.lineWidth = 3;
    x.strokeRect(80, 170, 420, 250);
    x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(80, 170); x.lineTo(500, 420); x.moveTo(500, 170); x.lineTo(80, 420); x.stroke();
    x.fillStyle = A; x.fillRect(560, 170, 120, 20);
    [340, 300, 360, 220].forEach((w, k) => { x.fillStyle = k % 2 ? soft : ink; x.fillRect(560, 216 + k * 40, w, 16); });
  }
}
```

- [ ] **Step 6: `src/scripts/scene/cards.ts`**

```ts
import {
  CanvasTexture, Group, LinearFilter, Mesh, PlaneGeometry, Scene, ShaderMaterial, Vector3,
} from 'three';
import { CARD_FIRST_Z, CARD_GAP_Z } from './config';
import { drawMotif, type Motif } from './motifs';

export interface ProjectData {
  title: string;
  tag: string;
  year: string;
  desc: string;
  url: string;
  motif: Motif;
}

export interface CardState {
  i: number;
  base: Vector3;
  rotY: number;
  hover: number;
  focus: number;
  f0: number;
  f1: number;
  ft?: number;
  data: ProjectData;
}

export type Card = Mesh<PlaneGeometry, ShaderMaterial> & { userData: CardState };

const VERT = `
uniform float uHover; uniform float uTime; varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  p.z += sin(uv.x*4.0 + uTime*1.4) * 0.10 * uHover;   // subtle mesh swell on hover
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`;

const FRAG = `
uniform sampler2D uTex; uniform float uTime; uniform float uHover; uniform float uVel; uniform float uBlur; uniform float uOpacity;
varying vec2 vUv;
vec4 blurTex(vec2 uv, float r){
  if(r < 0.001) return texture2D(uTex, uv);
  vec4 s = vec4(0.0); float w = 0.0;
  for(int i=-3;i<=3;i++){ for(int j=-2;j<=2;j++){
    vec2 o = vec2(float(i), float(j)) * r;
    float g = exp(-dot(o,o)/(2.0*r*r+1e-6));
    s += texture2D(uTex, uv+o) * g; w += g; } }
  return s / max(w, 0.0001);
}
void main(){
  vec2 uv = vUv;
  float amp = uHover * (0.010 + uVel * 0.075);          // liquid distortion while hovered
  uv.x += sin(uv.y*9.0 + uTime*2.1) * amp;
  uv.y += cos(uv.x*7.0 + uTime*1.7) * amp * 0.8;
  vec4 c = blurTex(uv, uBlur * 0.010);                  // depth-of-field
  float edge = min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y));
  float frame = smoothstep(0.0, 0.004, edge);
  c.rgb = mix(vec3(1.0), c.rgb, frame);
  c.rgb += uHover * 0.07;
  gl_FragColor = vec4(clamp(c.rgb,0.0,1.0), uOpacity);
}`;

const MOTIFS: Motif[] = ['rings', 'rack', 'graph', 'columns', 'terminal', 'wireframe'];

/** Read the plates from the server-rendered fallback grid. */
export function readProjects(): ProjectData[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#tp-projects [data-project]')).map((el) => {
    const motif = el.dataset.motif as Motif | undefined;
    return {
      title: el.dataset.title ?? '',
      tag: el.dataset.tag ?? '',
      year: el.dataset.year ?? '',
      desc: el.dataset.desc ?? '',
      url: el.dataset.url ?? '',
      motif: motif && MOTIFS.includes(motif) ? motif : 'rings',
    };
  });
}

/** Draw one plate: motif, caption band, index box, frame. */
export function makeCardTexture(index: number, title: string, tag: string, motif: Motif, inverted: boolean): CanvasTexture {
  const ground = inverted ? '#fff' : '#000';
  const ink = inverted ? '#000' : '#fff';
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 640;
  const x = c.getContext('2d');
  if (!x) throw new Error('2D canvas context unavailable');

  x.fillStyle = ground; x.fillRect(0, 0, c.width, c.height);
  drawMotif(x, motif, ink, inverted);
  // caption band + index box, always on the plate's own ground
  x.fillStyle = ground; x.fillRect(0, c.height - 196, c.width, 196);
  x.fillRect(0, 0, 300, 150);
  x.strokeStyle = ink; x.lineWidth = 6; x.strokeRect(3, 3, c.width - 6, c.height - 6);
  x.strokeStyle = inverted ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, c.height - 196); x.lineTo(c.width, c.height - 196); x.stroke();
  x.fillStyle = ink;
  let fs = 84;
  x.font = `500 ${fs}px "Space Grotesk", Helvetica, sans-serif`;
  while (x.measureText(title).width > c.width - 90 && fs > 30) {
    fs -= 4;
    x.font = `500 ${fs}px "Space Grotesk", Helvetica, sans-serif`;
  }
  x.fillText(title, 40, c.height - 100);
  x.font = '400 26px "JetBrains Mono", monospace';
  x.fillStyle = inverted ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.65)';
  x.fillText(tag.toUpperCase(), 42, c.height - 48);
  x.font = '300 104px "JetBrains Mono", monospace';
  x.fillStyle = ink;
  x.fillText(String(index).padStart(2, '0'), 34, 108);

  const tex = new CanvasTexture(c);
  tex.minFilter = LinearFilter;
  return tex;
}

/** Textured planes in a slightly offset column receding in depth. */
export function createCards(scene: Scene, data: ProjectData[]): Card[] {
  const geo = new PlaneGeometry(3.4, 2.12, 24, 16);
  const group = new Group();
  scene.add(group);

  return data.map((d, i) => {
    const inverted = i === 1 || i === 4;     // two ink-on-white plates for column rhythm
    const material = new ShaderMaterial({
      transparent: true,
      uniforms: {
        uTex: { value: makeCardTexture(i + 1, d.title, `${d.tag} / ${d.year}`, d.motif, inverted) },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uVel: { value: 0 },
        uBlur: { value: 0 },
        uOpacity: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
    const mesh = new Mesh(geo, material) as Card;
    const base = new Vector3(i % 2 ? 1.85 : -1.85, ((i % 3) - 1) * 0.55, CARD_FIRST_Z - i * CARD_GAP_Z);
    mesh.position.copy(base);
    mesh.rotation.y = (i % 2 ? -1 : 1) * 0.16;
    mesh.userData = { i, base, rotY: mesh.rotation.y, hover: 0, focus: 0, f0: 0, f1: 0, data: d };
    group.add(mesh);
    return mesh;
  });
}
```

- [ ] **Step 7: `src/scripts/scene/post.ts` and `fallback.ts`**

`post.ts`:

```ts
import {
  LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial,
  WebGLRenderTarget, type WebGLRenderer,
} from 'three';

export interface Post {
  render(drawLayers: () => void, t: number): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
}

const FRAG = `
uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVig;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main(){
  vec4 c = texture2D(tDiffuse, vUv);
  vec2 px = floor(gl_FragCoord.xy);
  float g = hash(px + floor(uTime*24.0)*13.7) - 0.5;      // animated film grain
  float d = hash(px*0.5) - 0.5;                            // static dither for print feel
  c.rgb += g*uGrain + d*0.016;
  float v = distance(vUv, vec2(0.5));
  c.rgb *= 1.0 - uVig * smoothstep(0.32, 0.95, v);         // discreet vignette
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0);
}`;

/** Render-target pass adding animated grain, static dither and a vignette. */
export function createPost(renderer: WebGLRenderer, grain: number): Post {
  const dpr = renderer.getPixelRatio();
  const rt = new WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr, {
    minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat,
  });
  const material = new ShaderMaterial({
    uniforms: { tDiffuse: { value: rt.texture }, uTime: { value: 0 }, uGrain: { value: grain }, uVig: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: FRAG,
  });
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  return {
    render(drawLayers, t) {
      material.uniforms.uTime.value = t;
      renderer.setRenderTarget(rt);
      drawLayers();
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);
    },
    resize(width, height, ratio) { rt.setSize(width * ratio, height * ratio); },
    dispose() { rt.dispose(); material.dispose(); },
  };
}
```

`fallback.ts`:

```ts
/**
 * No WebGL: hide the canvas layers, restore the system cursor and show the
 * project grid in place of the 3D column.
 */
export function fallbackDOM(): void {
  const hide = (id: string): void => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
  ['tp-gl', 'tp-work-hud', 'tp-scrollcue', 'tp-cursor', 'tp-loader', 'tp-scrim', 'tp-veil'].forEach(hide);

  const grid = document.getElementById('tp-projects');
  const work = document.getElementById('tp-work');
  if (grid) grid.style.display = 'block';
  if (work && grid) {
    work.style.height = 'auto';
    work.appendChild(grid);
  }
  document.documentElement.classList.remove('tp-cursor');
}
```

- [ ] **Step 8: `src/scripts/scene/index.ts` (orchestrator)**

```ts
import Lenis from 'lenis';
import {
  PerspectiveCamera, Raycaster, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { initCursor, type Cursor } from '../ui/cursor';
import { initSplitText } from '../ui/split-text';
import { createBackdrop, type Backdrop } from './backdrop';
import type { Capabilities } from './capabilities';
import { createCards, readProjects, type Card } from './cards';
import { CAMERA_START_Z, CAMERA_TRAVEL_Z, SCENE } from './config';
import { fbm } from './noise';
import { createPost, type Post } from './post';

const byId = (id: string): HTMLElement | null => document.getElementById(id);

interface State {
  progress: number;
  progressTarget: number;
  workP: number;
  workTarget: number;
  textCover: number;
  focused: Card | null;
  hovered: Card | null;
  lastIdx: number;
  last: number;
}

/** Eased 0→1 focus tween (expo.inOut, 0.8 s) driven by the frame loop. */
function setFocus(card: Card, to: number): void {
  const u = card.userData;
  u.f0 = u.focus;
  u.f1 = to;
  u.ft = performance.now() * 0.001;
}

/**
 * Boot the whole home-page experience: renderer, footage backdrop, project
 * plates, post-processing, smooth scroll, loader, overlay and the frame loop.
 * Everything not dependent on WebGL (cursor, split text) is initialized here
 * too so the page has exactly one owner of the pointer state.
 */
export function startScene(caps: Capabilities): void {
  const canvas = byId('tp-gl') as HTMLCanvasElement | null;
  if (!canvas) return;

  const cursor: Cursor = initCursor();
  const state: State = {
    progress: 0, progressTarget: 0, workP: 0, workTarget: 0, textCover: 0,
    focused: null, hovered: null, lastIdx: -1, last: 0,
  };

  // --- renderer, camera ---------------------------------------------------
  const renderer = new WebGLRenderer({
    canvas, antialias: !caps.mobile, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, caps.mobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.autoClear = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, CAMERA_START_Z);
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  // --- layers -------------------------------------------------------------
  const hd = canvas.dataset.videoHd ?? '';
  const sd = canvas.dataset.videoSd ?? '';
  const backdrop: Backdrop = createBackdrop(caps.mobile ? [sd, hd] : [hd, sd], SCENE.pastel, SCENE.bgLevel);
  const data = readProjects();
  const cards: Card[] = createCards(scene, data);
  const post: Post | null = SCENE.postFx && !caps.mobile ? createPost(renderer, SCENE.grain) : null;

  const onResize = (): void => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    post?.resize(w, h, renderer.getPixelRatio());
  };
  window.addEventListener('resize', onResize);

  // --- scroll -------------------------------------------------------------
  const setProgress = (): void => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    state.progressTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  let lenis: Lenis | null = null;
  if (!caps.reduced) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, lerp: 0.085 });
    lenis.on('scroll', setProgress);
  } else {
    window.addEventListener('scroll', setProgress, { passive: true });
  }
  setProgress();

  document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"], #tp-menu a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const el = document.querySelector<HTMLElement>(a.getAttribute('href') ?? '');
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: 0 });
      else window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    });
  });

  // --- overlay ------------------------------------------------------------
  const detail = byId('tp-detail');
  const main = byId('tp-main');
  const nav = byId('tp-nav');
  const cue = byId('tp-scrollcue');
  const closeBtn = byId('tp-detail-close');
  let lastFocus: HTMLElement | null = null;

  const openCard = (card: Card): void => {
    state.focused = card;
    lastFocus = document.activeElement as HTMLElement | null;
    const d = card.userData.data;
    const title = byId('tp-detail-title');
    const desc = byId('tp-detail-desc');
    const meta = byId('tp-detail-meta');
    const link = byId('tp-detail-link') as HTMLAnchorElement | null;
    if (title) title.textContent = d.title;
    if (desc) desc.textContent = d.desc;
    if (meta) meta.textContent = `${String(card.userData.i + 1).padStart(2, '0')} — ${d.tag} / ${d.year}`;
    if (link) {
      if (d.url) { link.href = d.url; link.style.display = 'inline-block'; } else { link.style.display = 'none'; }
    }
    if (detail) {
      detail.style.pointerEvents = 'auto';
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.setAttribute('aria-hidden', 'false');
    }
    lenis?.stop();
    setFocus(card, 1);
    if (main) main.style.opacity = '0';
    if (nav) nav.style.opacity = '0';
    if (cue) cue.style.opacity = '0';
    closeBtn?.focus();
  };

  const closeCard = (): void => {
    if (!state.focused) return;
    const card = state.focused;
    state.focused = null;
    if (detail) {
      detail.style.pointerEvents = 'none';
      detail.style.opacity = '0';
      detail.style.transform = 'translateY(24px)';
      detail.setAttribute('aria-hidden', 'true');
    }
    lenis?.start();
    setFocus(card, 0);
    if (main) main.style.opacity = '1';
    if (nav) nav.style.opacity = '1';
    lastFocus?.focus();
  };

  closeBtn?.addEventListener('click', closeCard);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });
  window.addEventListener('click', (e) => {
    if (state.focused) return;
    const target = e.target as Element | null;
    if (target?.closest && target.closest('a,button,form,input,textarea,label')) return;
    if (state.hovered) openCard(state.hovered);
  });

  // --- loader -------------------------------------------------------------
  const runLoader = (): void => {
    const count = byId('tp-count');
    const loader = byId('tp-loader');
    const start = performance.now();
    const dur = caps.reduced ? 300 : 1700;
    const step = (): void => {
      const k = Math.min(1, (performance.now() - start) / dur);
      if (count) count.textContent = String(Math.round(k * 100)).padStart(3, '0');
      if (k < 1) { requestAnimationFrame(step); return; }
      if (loader) {
        loader.style.opacity = '0';
        window.setTimeout(() => { loader.style.display = 'none'; }, 760);
      }
      initSplitText();
    };
    step();
  };

  // --- per-frame updates --------------------------------------------------
  const veil = byId('tp-veil');
  const work = byId('tp-work');
  const idxNum = byId('tp-idx-num');
  const idxTitle = byId('tp-idx-title');
  const idxTag = byId('tp-idx-tag');
  const total = String(cards.length).padStart(2, '0');
  const dir = new Vector3();
  const front = new Vector3();

  const updateCamera = (t: number): void => {
    const drift = SCENE.drift;
    const p = cursor.pointer;
    const baseZ = CAMERA_START_Z - state.workP * CAMERA_TRAVEL_Z;
    camera.position.x = p.sx * 1.15 + fbm(t * 0.07) * 0.55 * drift;
    camera.position.y = p.sy * 0.75 + fbm(t * 0.06 + 31.7) * 0.42 * drift;
    camera.position.z = baseZ + fbm(t * 0.05 + 77.3) * 0.30 * drift;
    camera.rotation.x = -p.sy * 0.055 + fbm(t * 0.045 + 12.1) * 0.018 * drift;
    camera.rotation.y = -p.sx * 0.075 + fbm(t * 0.04 + 5.4) * 0.022 * drift;
    camera.rotation.z = fbm(t * 0.03 + 90.2) * 0.012 * drift;
  };

  const updateCards = (t: number): void => {
    const p = cursor.pointer;
    pointer.set(p.nx, p.ny);
    raycaster.setFromCamera(pointer, camera);
    const hits = state.focused ? [] : raycaster.intersectObjects(cards, false);
    state.hovered = hits.length ? (hits[0].object as Card) : null;
    cursor.setBoost(!!state.hovered);

    const focal = camera.position.z - 6.5;
    // cards only exist inside the work range: fade in as it starts, out as it ends
    const w = state.workP;
    const appear = Math.min(1, Math.max(0, (w - 0.015) / 0.05)) * (1 - Math.min(1, Math.max(0, (w - 0.94) / 0.05)));
    let nearest = 0;
    let nearestD = 1e9;

    cards.forEach((m, i) => {
      const u = m.userData;
      const hov = state.hovered === m && !state.focused ? 1 : 0;
      u.hover += (hov - u.hover) * 0.10;
      const uni = m.material.uniforms;
      uni.uTime.value = t;
      uni.uHover.value = u.hover;
      uni.uVel.value += (p.vel - uni.uVel.value) * 0.2;

      // depth of field: sharpness peaks at the focal plane
      const dz = Math.abs(u.base.z - focal);
      const blur = Math.min(1, Math.max(0, (dz - 3.0) / 13)) * SCENE.cardBlur;
      uni.uBlur.value = blur * (1 - u.focus);
      m.visible = appear > 0.002 || u.focus > 0.002;

      if (u.ft !== undefined) {
        const k = Math.min(1, (t - u.ft) / 0.8);
        const e = k >= 1 ? 1 : (k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2);
        u.focus = u.f0 + (u.f1 - u.f0) * e;
      }
      const f = u.focus;
      if (f > 0.0001) {
        dir.set(0, 0, -1).applyQuaternion(camera.quaternion);
        front.copy(camera.position).addScaledVector(dir, 4.6);
        m.position.lerpVectors(u.base, front, f);
        m.quaternion.slerp(camera.quaternion, f);
        m.scale.setScalar(1 + (2.0 - 1) * f);
      } else {
        m.position.copy(u.base);
        m.rotation.set(0, u.rotY, 0);
        m.scale.setScalar(1 + 0.05 * u.hover);
      }
      const other = state.focused && state.focused !== m ? Math.max(0, 1 - state.focused.userData.focus) : 1;
      uni.uOpacity.value = other * Math.max(appear, u.focus);

      if (dz < nearestD) { nearestD = dz; nearest = i; }
    });

    if (state.lastIdx !== nearest) {
      state.lastIdx = nearest;
      const d = data[nearest];
      if (idxNum) idxNum.innerHTML = `${String(nearest + 1).padStart(2, '0')}<span style="opacity:.35;font-size:.4em">/${total}</span>`;
      if (idxTitle) idxTitle.textContent = d.title;
      if (idxTag) idxTag.textContent = `${d.tag} — ${d.year}`;
    }

    if (cue) cue.style.opacity = state.focused || state.progress > 0.05 ? '0' : '1';
  };

  const drawLayers = (): void => {
    renderer.clear();
    renderer.render(backdrop.scene, backdrop.camera);
    renderer.clearDepth();
    renderer.render(scene, camera);
  };

  const tick = (now: number): void => {
    requestAnimationFrame(tick);
    const t = now * 0.001;
    state.last = t;
    lenis?.raf(now);
    cursor.update();
    state.progress += (state.progressTarget - state.progress) * 0.08;

    // work-section-local progress: the card sweep is driven by #tp-work's own
    // scroll range, so the columns never bleed into About / CV / Contact.
    if (work) {
      const r = work.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const raw = span > 0 ? -r.top / span : (r.top < 0 ? 1 : 0);
      state.workTarget = Math.min(1, Math.max(0, raw));
    }
    state.workP += (state.workTarget - state.workP) * 0.09;

    // Text-section veil: copy-heavy sections get a black veil over the canvas.
    let cover = 0;
    ['tp-about', 'tp-blog', 'tp-cv', 'tp-contact'].forEach((id) => {
      const el = byId(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      cover += Math.max(0, vis) / window.innerHeight;
    });
    state.textCover = Math.min(1, cover);
    if (veil) veil.style.opacity = (state.textCover * 0.8).toFixed(2);

    updateCamera(t);
    updateCards(t);
    backdrop.update(t, state.progress, cursor.pointer.sx, cursor.pointer.sy, state.textCover);
    if (post) post.render(drawLayers, t); else drawLayers();
  };

  runLoader();
  requestAnimationFrame(tick);
}
```

- [ ] **Step 9: Replace the two entry stubs**

`src/scripts/home.ts`:

```ts
import { detectCapabilities } from './scene/capabilities';
import { fallbackDOM } from './scene/fallback';
import { initSplitText } from './ui/split-text';

const caps = detectCapabilities();

if (caps.webgl) {
  // three.js is only fetched on machines that can draw with it.
  import('./scene').then(({ startScene }) => startScene(caps));
} else {
  fallbackDOM();
  initSplitText();
}
```

`src/scripts/blog.ts`:

```ts
import { initCursor } from './ui/cursor';
import { initSplitText } from './ui/split-text';

initCursor({ autoLoop: true });
initSplitText();
```

- [ ] **Step 10: Type-check and build**

```bash
pnpm exec astro check && pnpm build
ls dist/_astro | grep -i -E "scene|three" | head
```

Expected: no errors; a separate chunk for the scene (dynamic import) appears in `dist/_astro/`.

- [ ] **Step 11: Runtime verification with Playwright against `pnpm dev`**

Start `pnpm dev` in the background, then with the Playwright MCP tools:

1. `browser_navigate` to `http://localhost:4321/`, `browser_wait_for` 2.5 s. `browser_evaluate`: `document.getElementById('tp-loader').style.display` → `"none"`; `document.querySelector('#tp-hero h1 .tp-char') !== null` → `true`; `document.getElementById('tp-gl').getContext('webgl2') || document.getElementById('tp-gl').getContext('webgl')` → truthy.
2. `browser_evaluate`: `window.scrollTo(0, document.getElementById('tp-work').offsetTop + window.innerHeight * 1.8)`; wait 1.5 s; `document.getElementById('tp-idx-title').textContent` → no longer `ckad-dojo` (a later plate is nearest).
3. `browser_evaluate`: `document.getElementById('tp-veil').style.opacity` after scrolling to `#tp-about` → `> 0.5`.
4. Click a card: `browser_evaluate` scroll to the work section middle, `browser_hover` at the viewport centre, `browser_click` at the same point; then `document.getElementById('tp-detail').style.opacity` → `"1"` and `document.getElementById('tp-detail-title').textContent` is one of the six titles. `browser_press_key` `Escape` → opacity `"0"`.
5. `browser_navigate` to `/en/`; repeat step 1; `document.querySelector('#tp-count')` exists and `document.documentElement.lang` → `"en"`.
6. `browser_navigate` to `/blog/`; `document.getElementById('tp-cursor')` exists, `document.getElementById('tp-gl')` → `null`.
7. Fallback: `browser_run_code_unsafe` with a page that stubs WebGL (`HTMLCanvasElement.prototype.getContext = () => null` via `page.addInitScript`), navigate to `/`; `getComputedStyle(document.getElementById('tp-projects')).display` → `"block"`, `document.getElementById('tp-loader').style.display` → `"none"`.
8. Reduced motion: `browser_run_code_unsafe` with `page.emulateMedia({ reducedMotion: 'reduce' })`, navigate to `/`; after 1 s the loader is hidden and `document.documentElement.classList.contains('lenis')` → `false` (Lenis stamps that class on `<html>` when it runs).

Record each result in the task notes. Any failure is a bug to fix before the commit checkpoint.

- [ ] **Step 12: Commit checkpoint (ask the user first)**

```bash
git add src/scripts
git commit -m "feat(scene): port the three.js backdrop, plates, cursor and reveals"
```

---

### Task 9: Blog surfaces in the monochrome system

**Files:**
- Modify: `src/layouts/PostLayout.astro`, `src/components/ArticleCard.astro`, `src/components/ArticlesGrid.astro`, `src/components/CategoriesCloud.astro`, `src/components/Pagination.astro`, `src/components/SeriesEpisodeList.astro`, `src/pages/blog/[...page].astro`, `src/pages/en/blog/[...page].astro`, `src/pages/categories/[...path].astro`, `src/pages/en/categories/[...path].astro`, `src/pages/categories/index.astro`, `src/pages/en/categories/index.astro`
- Untouched on purpose: `TableOfContents.astro`, `SeriesHeader.astro`, `SeriesNav.astro` (they resolve the remapped semantic variables and already render correctly on black).

**Interfaces:**
- `ArticlesGrid` `Article` gains optional `date?: Date` and `readingMinutes?: number`; `ArticleCard` shows them in the mono meta line.

- [ ] **Step 1: Rewrite `src/components/ArticleCard.astro`**

```astro
---
import { type Locale, t, formatDate } from '../i18n';

interface Props {
  title: string;
  href: string;
  summary?: string;
  image?: string;
  locale: Locale;
  seriesName?: string;
  seriesOrder?: number;
  date?: Date;
  readingMinutes?: number;
}

const { title, href, summary, image, locale, seriesName, seriesOrder, date, readingMinutes } = Astro.props;

const episodeLabel =
  seriesOrder !== undefined
    ? `${seriesName ? `${seriesName} · ` : ''}${t(locale, 'episode')} ${seriesOrder}`
    : undefined;
const meta = [date && formatDate(date, locale), readingMinutes && `${readingMinutes} ${t(locale, 'minShort')}`]
  .filter(Boolean)
  .join(' · ');
---

<li class="list-none">
  <a
    href={href}
    data-cursor="link"
    class="tp-card tp-mono-hover flex flex-col h-full"
    style="border:1px solid rgba(255,255,255,.2); transition:border-color .3s ease;"
  >
    {image ? (
      <img src={image} alt={title} loading="lazy" class="tp-mono-img block w-full object-cover" style="aspect-ratio:3/1;" />
    ) : (
      <div class="w-full" style="aspect-ratio:3/1; background:#0a0a0a; border-bottom:1px solid rgba(255,255,255,.18);"></div>
    )}
    <div class="flex flex-col" style="gap:14px; padding:clamp(20px,2.4vw,28px);">
      <div class="tp-label-sm flex flex-wrap" style="gap:8px 18px; letter-spacing:.26em;">
        {episodeLabel && <span style="color:#a8cf3e;">{episodeLabel}</span>}
        {meta && <span style="opacity:.6;">{meta}</span>}
      </div>
      <h3 style="margin:0; font-size:clamp(1.1rem,1.6vw,1.4rem); font-weight:500; line-height:1.2; letter-spacing:.005em; text-wrap:pretty;">{title}</h3>
      {summary && (
        <p style="margin:0; font-size:.95rem; line-height:1.55; font-weight:300; opacity:.82; text-wrap:pretty;" class="line-clamp-3">{summary}</p>
      )}
      <span class="tp-label flex items-baseline" style="gap:12px; margin-top:auto; letter-spacing:.28em;">{t(locale, 'readMore')} <span style="color:#a8cf3e;">↗</span></span>
    </div>
  </a>
</li>

<style>
  .tp-card:hover { opacity: 1; border-color: #a8cf3e !important; }
</style>
```

- [ ] **Step 2: Update `src/components/ArticlesGrid.astro`**

Add `date?: Date; readingMinutes?: number;` to the `Article` interface, pass them to `ArticleCard` (`date={article.date} readingMinutes={article.readingMinutes}`), drop the `index` prop, and replace the "view all" block with:

```astro
{showViewAll && (
  <div class="mt-10">
    <a href={`${localePrefix(locale)}/blog/`} data-cursor="link" class="tp-link">
      <span>{t(locale, 'blogReadAll')}</span>
      <span style="color:#a8cf3e;">↗</span>
    </a>
  </div>
)}
```

The `<ul>` becomes `class="grid grid-cols-1 md:grid-cols-2 list-none m-0 p-0" style="gap:2px;"`.

- [ ] **Step 3: Rewrite `src/components/CategoriesCloud.astro`**

```astro
---
import { type Locale, t, localePrefix } from '../i18n';

interface Category {
  name: string;
  count: number;
  href: string;
}

interface Props {
  categories: Category[];
  locale: Locale;
}

const { categories, locale } = Astro.props;
const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
const chip = 'tp-label inline-flex items-baseline transition-colors';
const chipStyle = 'gap:10px; padding:10px 16px; border:1px solid rgba(255,255,255,.18); letter-spacing:.22em;';
---

{categories.length > 0 && (
  <nav class="mb-12" aria-label={t(locale, 'categoriesCloud')}>
    <p class="tp-label-sm" style="opacity:.62; margin:0 0 14px;">{t(locale, 'categoriesCloud')}</p>
    <div class="flex flex-wrap" style="gap:8px;">
      <a href={`${localePrefix(locale)}/blog/`} data-cursor="link" class={`${chip} tp-chip`} style={`${chipStyle} border-color:#fff;`}>
        <span>{t(locale, 'categoriesAll')}</span>
        <span style="opacity:.5;">{totalCount}</span>
      </a>
      {categories.map((cat) => (
        <a href={cat.href} data-cursor="link" class={`${chip} tp-chip`} style={chipStyle}>
          <span>{cat.name}</span>
          <span style="opacity:.5;">{cat.count}</span>
        </a>
      ))}
    </div>
  </nav>
)}

<style>
  .tp-chip:hover { opacity: 1; border-color: #a8cf3e !important; }
</style>
```

- [ ] **Step 4: Rewrite `src/components/Pagination.astro`**

```astro
---
import { type Locale, t } from '../i18n';

interface Props {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  locale: Locale;
}

const { currentPage, totalPages, baseUrl, locale } = Astro.props;
const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
const hrefFor = (page: number): string => (page === 1 ? baseUrl : `${baseUrl}${page}/`);
const cell = 'tp-label inline-flex items-center justify-center';
const cellStyle = 'min-width:44px; height:44px; padding:0 12px; border:1px solid rgba(255,255,255,.18); letter-spacing:.2em;';
---

{totalPages > 1 && (
  <nav class="flex justify-center flex-wrap mt-16" style="gap:2px;" aria-label="Pagination">
    {currentPage > 1 && (
      <a href={hrefFor(currentPage - 1)} data-cursor="link" class={`${cell} tp-page`} style={cellStyle} aria-label={t(locale, 'previousPage')}>←</a>
    )}
    {pages.map((page) =>
      page === currentPage ? (
        <span class={cell} style={`${cellStyle} background:#fff; color:#000; border-color:#fff;`} aria-current="page">{page}</span>
      ) : (
        <a href={hrefFor(page)} data-cursor="link" class={`${cell} tp-page`} style={cellStyle}>{page}</a>
      )
    )}
    {currentPage < totalPages && (
      <a href={hrefFor(currentPage + 1)} data-cursor="link" class={`${cell} tp-page`} style={cellStyle} aria-label={t(locale, 'nextPage')}>→</a>
    )}
  </nav>
)}

<style>
  .tp-page:hover { opacity: 1; border-color: #a8cf3e !important; }
</style>
```

- [ ] **Step 5: Fix the contrast of the current episode in `src/components/SeriesEpisodeList.astro`**

Replace `'bg-[var(--color-accent)] text-white'` with `'bg-[var(--color-accent)] text-black'` and every `rounded-lg` / `rounded-full` with nothing (delete the class). No other change.

- [ ] **Step 6: Restyle `src/layouts/PostLayout.astro` (markup only; the frontmatter and JSON-LD stay as they are)**

Replace everything from `<article` to `</article>` with:

```astro
  <article class="mx-auto" style="max-width:1400px; padding:48px 28px 96px;">
    <header class="mb-12">
      <p class="tp-label" style="opacity:.8; margin:0 0 22px;" data-split="1">{t(locale, 'blogEyebrow')}</p>
      <h1 class="uppercase" style="margin:0; font-size:clamp(1.9rem,4.5vw,3.6rem); font-weight:500; line-height:.95; letter-spacing:.01em; text-wrap:balance; max-width:22ch;" data-split="1">
        {title}
      </h1>
      <div class="tp-label-sm flex flex-wrap items-baseline" style="gap:8px 18px; margin-top:22px; letter-spacing:.26em; opacity:.62;">
        <time datetime={date.toISOString()}>{t(locale, 'publishedOn')} {formatDate(date, locale)}</time>
        {author && <span>{t(locale, 'by')} {author}</span>}
        {readingTime && <span>{readingTime} {t(locale, 'minRead')}</span>}
      </div>
      {(tags.length > 0 || categories.length > 0) && (
        <div class="flex flex-wrap" style="gap:8px; margin-top:22px;">
          {categories.map((cat) => (
            <a href={`${localePrefix(locale)}/categories/${cat.toLowerCase()}/`} data-cursor="link" class="tp-label tp-tag" style="padding:8px 14px; border:1px solid rgba(255,255,255,.35); letter-spacing:.22em; color:#a8cf3e;">{cat}</a>
          ))}
          {tags.map((tag) => (
            <span class="tp-label" style="padding:8px 14px; border:1px solid rgba(255,255,255,.18); letter-spacing:.22em; opacity:.74;">{tag}</span>
          ))}
        </div>
      )}
      {seriesName && seriesEpisodes.length > 0 && (
        <SeriesHeader seriesName={seriesName} episodes={seriesEpisodes} locale={locale} />
      )}
    </header>

    {image && (
      <div class="tp-mono-hover mb-12" style="border:1px solid rgba(255,255,255,.2);">
        <img src={image} alt={heroAlt} class="tp-mono-img block w-full object-cover" style="aspect-ratio:3/1;" />
      </div>
    )}

    <div data-toc-grid class:list={["gap-x-10", showToc && "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]"]}>
      {showToc && <TableOfContents headings={headings} locale={locale} />}
      <div class="prose prose-invert prose-lg max-w-none prose-headings:scroll-mt-[calc(var(--navbar-height)+1.5rem)]">
        <slot />
      </div>
    </div>

    {seriesName && seriesEpisodes.length > 0 && (
      <SeriesNav seriesName={seriesName} episodes={seriesEpisodes} prev={seriesPrev} next={seriesNext} locale={locale} />
    )}

    <footer class="mt-16 pt-8" style="border-top:1px solid rgba(255,255,255,.18);">
      <a href={`${localePrefix(locale)}/blog/`} data-cursor="link" class="tp-link">
        <span style="color:#a8cf3e;">←</span>
        <span>{t(locale, 'backToBlog')}</span>
      </a>
    </footer>
  </article>

<style>
  .tp-tag:hover { opacity: 1; border-color: #a8cf3e; }
</style>
```

- [ ] **Step 7: Listing pages — `src/pages/blog/[...page].astro` and `src/pages/en/blog/[...page].astro`**

Remove the `SectionEyebrow` import. Add `import { getReadingTime } from '../../utils/readingTime';` (EN: `'../../../utils/readingTime'`). In the `articles` mapping add `date: post.data.date,` and `readingMinutes: getReadingTime(post.body ?? ''),`. Replace the template with:

```astro
<BaseLayout title={t(locale, 'posts')} description={t(locale, 'postsDescription')} locale={locale}>
  <div class="mx-auto" style="max-width:1400px; padding:48px 28px 96px;">
    <header class="mb-12 flex flex-col" style="gap:22px;">
      <p class="tp-label" style="opacity:.8; margin:0;" data-split="1">{t(locale, 'blogLabel')}</p>
      <h1 class="tp-h2" data-split="1">{t(locale, 'blogTitle1')}<br />{t(locale, 'blogTitle2')}</h1>
      <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; opacity:.9; max-width:52ch; text-wrap:pretty;" data-split="1">{t(locale, 'blogIntro')}</p>
    </header>

    <CategoriesCloud categories={categories} locale={locale} />

    <ArticlesGrid articles={articles} locale={locale} showViewAll={false} />

    <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={`${localePrefix(locale)}/blog/`} locale={locale} />
  </div>
</BaseLayout>
```

(FR file: import `localePrefix` from `'../../i18n'` alongside `t`.)

- [ ] **Step 8: Category pages — `src/pages/categories/[...path].astro`, `src/pages/en/categories/[...path].astro`, and both `categories/index.astro`**

Same treatment: remove `SectionEyebrow`, add `date`/`readingMinutes` to the mapping (import `getReadingTime`), and replace the template of `[...path].astro` with:

```astro
<BaseLayout title={categoryName} description={`${t(locale, 'articles')} ${categoryName} — ${totalPosts} ${totalPosts === 1 ? t(locale, 'article') : t(locale, 'articles')}`} locale={locale}>
  <div class="mx-auto" style="max-width:1400px; padding:48px 28px 96px;">
    <header class="mb-12 flex flex-col" style="gap:22px;">
      <p class="tp-label" style="opacity:.8; margin:0;" data-split="1">{t(locale, 'categoriesCloud')}</p>
      <h1 class="tp-h2" data-split="1">{categoryName}</h1>
      <p class="tp-label-sm" style="opacity:.62; margin:0;">{totalPosts} {totalPosts === 1 ? t(locale, 'article') : t(locale, 'articles')}</p>
    </header>

    <CategoriesCloud categories={categories} locale={locale} />

    <ArticlesGrid articles={articles} locale={locale} showViewAll={false} />

    <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={`${localePrefix(locale)}/categories/${categoryName}/`} locale={locale} />
  </div>
</BaseLayout>
```

and of `categories/index.astro` with:

```astro
<BaseLayout title={t(locale, 'categoriesCloud')} description={t(locale, 'categoriesDescription')} locale={locale}>
  <div class="mx-auto" style="max-width:1400px; padding:48px 28px 96px;">
    <header class="mb-12 flex flex-col" style="gap:22px;">
      <p class="tp-label" style="opacity:.8; margin:0;" data-split="1">{t(locale, 'blogEyebrow')}</p>
      <h1 class="tp-h2" data-split="1">{t(locale, 'categoriesCloud')}</h1>
    </header>
    <CategoriesCloud categories={categories} locale={locale} />
  </div>
</BaseLayout>
```

(FR files import `localePrefix` where the `Pagination` `baseUrl` uses it.)

- [ ] **Step 9: Build and check**

```bash
pnpm exec astro check && pnpm build && python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
grep -c 'tp-mono-img' dist/blog/index.html
```

Expected: checks pass; the listing carries at least one grayscale card image. In `pnpm preview` open `/blog/`, `/blog/homelab/`, `/categories/tutoriels/`, `/en/blog/llm-01-comment-un-llm-fabrique-un-mot/` (series header + TOC + prose on black) and check at 360 px that nothing scrolls horizontally (`document.documentElement.scrollWidth === document.documentElement.clientWidth`).

- [ ] **Step 10: Commit checkpoint (ask the user first)**

```bash
git add src/layouts/PostLayout.astro src/components src/pages/blog src/pages/en/blog src/pages/categories src/pages/en/categories
git commit -m "feat(blog): restyle listing, categories, pagination and articles in monochrome"
```

---

### Task 10: Remove the old pages, components, content and keys; redirect their URLs

**Files:**
- Delete (via `trash`): `src/pages/about.astro`, `src/pages/cv.astro`, `src/pages/contact.astro`, `src/pages/projects.astro`, `src/pages/training/`, `src/pages/en/about.astro`, `src/pages/en/cv.astro`, `src/pages/en/contact.astro`, `src/pages/en/projects.astro`, `src/pages/en/training/`, `src/layouts/PageLayout.astro`, `src/components/Hero.astro`, `HeroPortraitCard.astro`, `CredentialsStrip.astro`, `CredentialsBadges.astro`, `TrainingsFeaturedList.astro`, `TrainingsGrid.astro`, `ProjectsGrid.astro`, `ArticlesFeaturedList.astro`, `AvailabilityPill.astro`, `DarkModeToggle.astro`, `SectionEyebrow.astro`, `Navbar.astro`, `Footer.astro`, `src/data/heroSkills.ts`, `src/content/training/`, `src/content/pages/`
- Modify: `src/content/config.ts` (drop `pages` and `training`), `astro.config.mjs` (redirects), `src/i18n/fr.ts`, `src/i18n/en.ts` (dead keys), `public/llms.txt` (Important Pages block)

**Interfaces:**
- After this task `collections` exports only `{ posts, projects }`.

- [ ] **Step 1: Trash the files**

```bash
trash src/pages/about.astro src/pages/cv.astro src/pages/contact.astro src/pages/projects.astro src/pages/training \
      src/pages/en/about.astro src/pages/en/cv.astro src/pages/en/contact.astro src/pages/en/projects.astro src/pages/en/training \
      src/layouts/PageLayout.astro \
      src/components/Hero.astro src/components/HeroPortraitCard.astro src/components/CredentialsStrip.astro src/components/CredentialsBadges.astro \
      src/components/TrainingsFeaturedList.astro src/components/TrainingsGrid.astro src/components/ProjectsGrid.astro src/components/ArticlesFeaturedList.astro \
      src/components/AvailabilityPill.astro src/components/DarkModeToggle.astro src/components/SectionEyebrow.astro src/components/Navbar.astro src/components/Footer.astro \
      src/data/heroSkills.ts src/content/training src/content/pages
rmdir src/data 2>/dev/null || true
```

- [ ] **Step 2: Drop the two collections from `src/content/config.ts`**

Delete the `pages` and `training` `defineCollection` blocks and set `export const collections = { posts, projects };`.

- [ ] **Step 3: Redirect the removed URLs to the home anchors in `astro.config.mjs`**

```js
  redirects: {
    '/posts': '/blog',
    '/posts/[...slug]': '/blog/[...slug]',
    '/en/posts': '/en/blog',
    '/en/posts/[...slug]': '/en/blog/[...slug]',
    '/about': '/#tp-about',
    '/cv': '/#tp-cv',
    '/contact': '/#tp-contact',
    '/projects': '/#tp-work',
    '/training': '/',
    '/en/about': '/en/#tp-about',
    '/en/cv': '/en/#tp-cv',
    '/en/contact': '/en/#tp-contact',
    '/en/projects': '/en/#tp-work',
    '/en/training': '/en/',
  },
```

- [ ] **Step 4: Remove translation keys with no consumer**

```bash
for key in $(grep -oE '^  [a-zA-Z0-9]+:' src/i18n/fr.ts | tr -d ' :'); do
  if ! grep -rq "'$key'" src --include='*.astro' --include='*.ts' --exclude-dir=i18n; then echo "$key"; fi
done
```

Delete every key the loop prints from **both** `fr.ts` and `en.ts`. Expected output: `home`, `availableContact`, `toggleMenu`, `toggleColorScheme`, `seriesEpisodes`, `heroDescription` (if the temporary key from Task 4 was added), `heroCtaPrimary`, `heroCtaSecondary`, `skillsTitle`, `skillsBack`, `skillsAriaFlip`, `skillKubernetes`, `skillDocker`, `skillTerraform`, `skillAnsible`, `skillGithubActions`, `skillPython`, `recentArticles`, `articlesEyebrow`, `recentArticlesTitle`, `viewAllArticles`, `categoriesSubtitle`, `credentialsEyebrow`, `credentialsTitle`, `credentialsVerify`, `trainingsDescription`, `trainingsEyebrow`, `recentTrainingsTitle`, `viewAllTrainings`, `viewTraining`, `recentTrainings`, `projectsDescription`, `projectsCategoryGithub`, `projectsCategoryWebsites`, `visitSite`, `projectsSearch`, `projectsNoResults`, `projectsClearSearch`, `showMore`, `newWindow`, `allRightsReserved`, `contactTitle`, `contactNamePlaceholder`, `contactEmailPlaceholder`, `contactMessagePlaceholder`, `cvDescription`, `downloadCV`, `notFound`, `notFoundMessage`, `backHome`. Keep any key the loop does **not** print. Re-run the loop: it must print nothing. Then re-run the key-parity diff from Task 4 Step 3.

- [ ] **Step 5: Rewrite the "Important Pages" block of `public/llms.txt`**

Replace everything from `## Important Pages` up to (not including) `## Blog Articles (French)` with:

```markdown
## Important Pages

### Homepage (one page: projects, about, blog, resume, contact)
- https://xgueret.github.io/
- https://xgueret.github.io/en/

### Blog (Articles)
- https://xgueret.github.io/blog/
- https://xgueret.github.io/en/blog/

### Categories
- https://xgueret.github.io/categories/
- https://xgueret.github.io/en/categories/

### Resume (PDF)
- https://xgueret.github.io/assets/cv.fr.pdf
- https://xgueret.github.io/assets/cv.en.pdf

```

Also change `- contact: https://xgueret.github.io/contact/` to `- contact: https://xgueret.github.io/#tp-contact`. Then in `public/llms-full.txt`:

```bash
sed -i -E '/xgueret\.github\.io(\/en)?\/(about|cv|contact|projects|training)\//d' public/llms-full.txt
grep -n -E "/(about|cv|contact|projects|training)/" public/llms.txt public/llms-full.txt
```

Expected: the grep prints nothing.

- [ ] **Step 6: Full check**

```bash
pnpm exec astro check && pnpm build
python3 scripts/check-articles.py && python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
grep -o 'url=[^"]*' dist/about/index.html dist/en/cv/index.html
ls dist/blog dist/en/blog dist/categories | head
grep -rn "posts/\|/about/\|/cv/\|/contact/\|/projects/\|/training/" src --include='*.astro' --include='*.ts' | grep -v "images/posts\|content/posts"
```

Expected: everything passes; the two redirect pages point to `/#tp-about` and `/en/#tp-cv`; the last grep prints nothing.

- [ ] **Step 7: Commit checkpoint (ask the user first)**

```bash
git add -A src public/llms.txt public/llms-full.txt astro.config.mjs
git commit -m "chore: remove the standalone pages, training and dead components; redirect their URLs"
```

---

### Task 11: Documentation, memory and the end-to-end verification protocol

**Files:**
- Modify: `CLAUDE.md` (project file), `README.md` if it describes the pages
- Memory: `/home/xgueret/.claude/projects/-home-xgueret-Workspace-01-projets-web-xgueret-github-io/memory/` (new entry + `MEMORY.md` pointer)

- [ ] **Step 1: Update the project `CLAUDE.md`**

Edit these points (leave the rest):

- "Project overview": add "One-page home (hero, 3D project plates, about, blog teaser, resume, contact) per locale; the blog lives at `/blog/` and `/en/blog/`."
- "Tech stack" fonts line → `**Fonts** (self-hosted via `@fontsource`): **Space Grotesk** (display + body), **JetBrains Mono** (labels, HUD, nav, buttons, code)`. Add `**three** 0.186 + **lenis** — home pages only, loaded through `src/scripts/home.ts` (dynamic import of `src/scripts/scene/`).`
- "Project structure": replace `pages/{fr,en}/`, `training/{fr,en}/`, `data/` lines; add `components/home/`, `scripts/`, `lib/featured-projects.ts`; `posts/` → `blog/` under `pages/`.
- "Content Collections": two collections; add `featured`, `motif`, `plateTag` to `projects`; remove the `pages` and `training` lines.
- "Styling": replace the Dawn Palette bullet with "Monochrome system: black, white, lime `#a8cf3e`, white-alpha rules — `DESIGN.md` and `.impeccable/design.json` are the contract; the semantic variables (`--color-bg`, `--color-text`, `--color-border`, `--color-accent`…) keep their names and are remapped in `global.css`." Delete the "Dark mode" section.
- Add a "Home scene" section: DOM contract (`#tp-projects[data-*]` feeds the plates; ids are mockup ids), capability paths (light path on coarse pointers, no Lenis under reduced motion, DOM fallback without WebGL), the frozen constants in `src/scripts/scene/config.ts`, and the rule "sections share ids across locales so the script is locale-agnostic".
- "CI/CD": Lighthouse URLs are `/`, `/blog/`, `/en/`; the internal-link count in `check-html` changed (update the number after the first green run).
- "Common tasks → Add a new page": replace with "Add a home section: create `src/components/home/XSection.astro`, add its keys to both i18n files, mount it in both `index.astro` files, and add its id to the veil list in `src/scripts/scene/index.ts` if it is copy-heavy."
- Fix the stale `site` line: production is `https://xgueret.tipunchlabs.fr` (the `Astro.site` note already says so).

- [ ] **Step 2: Save the memory entry**

Create `monochrome_redesign_refonte.md` in the memory directory (type `project`) recording: branch `refonte`, spec and plan paths, the decisions table of spec §3, the `/posts`→`/blog` redirects, "home only runs three.js", and what remains after the merge (Search Console re-crawl of the `/blog/` URLs, replacing the OpenWhispr placeholder image). Add the one-line pointer in `MEMORY.md`.

- [ ] **Step 3: End-to-end verification protocol (Playwright MCP against `pnpm preview` on the production build)**

```bash
pnpm build && pnpm preview &
```

1. **Home FR at 1440×900**: `browser_resize` 1440×900, navigate `/`, wait 3 s, `browser_take_screenshot` of each section after scrolling to `#tp-hero`, `#tp-work` (+1.5 vh), `#tp-about`, `#tp-blog`, `#tp-cv`, `#tp-contact`. Compare side by side with the mockup opened as `file:///home/xgueret/Téléchargements/Maquette%20trois.js%20monochrome%20Lusion(2)/TiPunch%20Labs%20v5.dc.html` at the same size. Acceptable differences: featured post content, video frame. Anything else is a defect.
2. **Home EN**: navigate `/en/`; `browser_snapshot`; check the hero reads "Build, deploy, automate." and the blog link is `/en/blog/`.
3. **Language switch round-trips**: on `/`, click `EN` → `/en/`; on `/en/blog/homelab/`, click `FR` → `/blog/homelab/`; on `/categories/tutoriels/`, click `EN` → `/en/categories/tutorials/`.
4. **Nav anchors**: from `/blog/`, click "Projets" → URL `/#tp-work` and `#tp-work` in view. On `/`, click "CV" → smooth scroll to `#tp-cv`.
5. **Overlay**: hover a plate at the viewport centre while inside the work range, click, `browser_snapshot` → dialog with title/desc/link, focus on the close button; Escape closes and the page fades back.
6. **360×740**: `browser_resize`, navigate `/`; the `Menu` button is visible, opens the list, a link closes it; `document.documentElement.scrollWidth === document.documentElement.clientWidth` on `/`, `/blog/`, `/blog/homelab/`.
7. **Keyboard-only**: on `/`, press Tab repeatedly: skip link → logo → five links → FR/EN → (sections) → featured card → CV link → certifications → socials → form fields → submit. Every stop shows the lime outline.
8. **Reduced motion** (`page.emulateMedia({ reducedMotion: 'reduce' })`): loader hides within ~0.4 s, wheel scroll is native (no `lenis` class on `<html>`), text is visible.
9. **No WebGL** (`addInitScript` stubbing `getContext` to `null`): the project grid is visible inside `#tp-work`, no loader, system cursor.
10. **Redirects**: `/posts/homelab/` lands on `/blog/homelab/`; `/en/posts/` on `/en/blog/`; `/about/` on `/#tp-about`.
11. **Lighthouse locally** (optional but recommended): `npx --yes @lhci/cli autorun --collect.staticDistDir=dist --collect.url=/ --collect.url=/blog/ --collect.url=/en/` — accessibility ≥ 90 on all three, no `errors-in-console`.

- [ ] **Step 4: Commit checkpoint (ask the user first)**

```bash
git add CLAUDE.md README.md
git commit -m "docs: describe the monochrome one-page architecture and the home scene contract"
```

Then hand over to `superpowers:finishing-a-development-branch` (PR from `refonte` to `main`; CI must be 7/7 green; the `check-html` link count in `CLAUDE.md` is updated from the CI log).
