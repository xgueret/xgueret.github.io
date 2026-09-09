# Monochrome redesign — design spec

> **Date**: 2026-09-09
> **Source mockup**: `~/Téléchargements/Maquette trois.js monochrome Lusion(2)/TiPunch Labs v5.dc.html`
> **Branch**: `refonte`
> **Status**: approved in chat, pending spec review

------

## 1. Goal

Replace the current multi-page Dawn Palette site with the "TiPunch Labs v5" monochrome one-page design, keeping only the blog (articles and every feature attached to them) from the current site. The visual result and every motion effect must match the mockup. Language handling (FR at root, EN under `/en/`) is integrated into the new design, and the blog lives at `/blog/` (FR) and `/en/blog/` (EN).

## 2. Mental model

```
                  ┌──────────────────────────────────────────────┐
  z:0             │ <canvas> three.js — video plate + 3D cards    │  home pages only
  z:5             │ scrim gradient                                │
  z:6             │ veil (fades over copy-heavy sections)         │
  z:10            │ <main> one-page sections (SSR, i18n)          │
  z:60            │ nav (anchors + FR|EN) · scroll cue            │
  z:70            │ card detail overlay                           │
  z:90            │ custom cursor                                 │
  z:100           │ loader 000→100                                │
                  └──────────────────────────────────────────────┘

  /            FR one-page home        /en/            EN one-page home
  /blog/       FR listing (paginated)  /en/blog/       EN listing
  /blog/<slug>/ FR article             /en/blog/<slug>/ EN article
  /categories/<fr-slug>/               /en/categories/<en-slug>/   (unchanged)
  /posts/*  → meta-refresh → /blog/*   (both locales)
  /about/ /cv/ /contact/ /projects/ → meta-refresh → /#about … (both locales)
```

## 3. Decisions (approved 2026-09-09)

| # | Decision |
|---|---|
| 1 | The WebGL scene runs only on the two home pages. Blog pages keep the cursor, fonts, split-text reveals and a CSS grain. |
| 2 | Exactly the six projects of the mockup are featured, flagged `featured: true` with a `motif` in frontmatter. The other four project entries are no longer displayed anywhere. |
| 3 | The "Gouttes d'encre" plate (Pexels 3960414) is self-hosted: 1080p for desktop, 540p for the light path. |
| 4 | Mobile navigation is a hamburger in the same mono uppercase style. |
| 5 | Category routes stay at `/categories/…` and `/en/categories/…`. |
| 6 | The dark-mode toggle is removed; the site is single-theme black. |
| 7 | Contact form keeps the existing Formspree endpoint. |
| 8 | Mockup tweak props become constants with the mockup defaults: backdrop "Gouttes d'encre", pastel 0.4, bgLevel 1, drift 1, grain 0.075, postFx on, cardBlur 1. |

## 4. Visual system

| Token | Value | Use |
|---|---|---|
| `--tp-black` | `#000` | page ground, loader, veil |
| `--tp-white` | `#fff` | text, cursor, buttons |
| `--tp-lime` | `#a8cf3e` | single accent: brand word, "automatiser.", arrows, featured label, card motif accent |
| `--tp-line-18` | `rgba(255,255,255,.18)` | grid rules, cards, project grid |
| `--tp-line-22` | `rgba(255,255,255,.22)` | social buttons |
| `--tp-line-30` | `rgba(255,255,255,.30)` | form fields |
| `--tp-line-35` | `rgba(255,255,255,.35)` | hero quote rule |
| `--tp-line-50` | `rgba(255,255,255,.50)` | link underlines |
| `--font-sans` | Space Grotesk 300/400/500/700 | display, body |
| `--font-mono` | JetBrains Mono 300/400/500 | labels, HUD, nav, buttons, code |

Fonts are self-hosted via `@fontsource/space-grotesk` and `@fontsource/jetbrains-mono`. Source Serif 4 and Geist Sans are removed. The Dawn Palette tokens are removed from `global.css`, `DESIGN.md` and `.impeccable/design.json`, which are rewritten to describe this system.

Inline styles from the mockup are converted to Tailwind utilities where they map one-to-one and to component-scoped CSS otherwise. `style-hover` and `style-focus` attributes become `:hover` and `:focus` rules. Every animation timing and easing is carried over verbatim.

## 5. Routing and i18n

- FR pages stay at root, EN under `/en/`. Each page sets `locale` and passes it down, as today.
- Blog routes are renamed: `src/pages/posts/` → `src/pages/blog/`, `src/pages/en/posts/` → `src/pages/en/blog/`. Every internal reference (`Navbar`, `PostLayout` breadcrumb, listings, `series.ts`, `llms.txt`, `llms-full.txt`, the in-article link in `kandidat.md`, Lighthouse URLs in `ci.yml`) is updated.
- `astro.config.mjs` gains `redirects`: `/posts/[...slug]` → `/blog/[...slug]`, `/en/posts/[...slug]` → `/en/blog/[...slug]`, plus `/about/`, `/cv/`, `/contact/`, `/projects/`, `/training/` and their EN twins → the matching home anchor. Static output renders them as meta-refresh pages. `/posts/` and `/en/posts/` (the listings) are redirected as well.
- `localizedPath()` is unchanged; the language switcher lives in the nav as `FR | EN` in mono uppercase, the current locale in white, the other at 60 % opacity with a hover to white. On home pages it links to the other home; anchors share ids across locales.
- `SEO.astro` (canonical, hreflang, OG, Twitter) and `person-ld.ts` are kept as they are. `og:site_name` stays "Xavier GUERET". `theme-color` becomes `#000000` for both schemes.
- Every mockup string becomes a translation key present in both `fr.ts` and `en.ts`. EN copy is written to match the tone of the existing EN files. Keys that only served removed pages are deleted.

## 6. Home page

One Astro page per locale (`src/pages/index.astro`, `src/pages/en/index.astro`) composed of section components. Section ids are the mockup ids (`tp-hero`, `tp-work`, `tp-about`, `tp-blog`, `tp-cv`, `tp-contact`) so the scene script needs no per-locale configuration.

| Component | Content source |
|---|---|
| `HeroSection` | i18n keys (eyebrow, three-line h1, quote label, quote, two paragraphs, three meta chips) |
| `WorkSection` | sticky HUD (label, "Défiler ↓", index title/tag/number) — initial values are the first featured project |
| `ProjectsFallbackGrid` | hidden `#tp-projects` grid rendered from the `projects` collection (featured, ordered by `order`); carries `data-title`, `data-tag`, `data-year`, `data-desc`, `data-url`, `data-motif`. Read by the scene script, shown as-is when WebGL is missing |
| `AboutSection` | portrait `/images/moi.png` (grayscale → colour on hover), i18n keys for the label, h2, two paragraphs, three principle rows |
| `BlogSection` | label, h2, paragraph, link to `/blog/` or `/en/blog/`, and the latest non-draft post of the locale as the featured card (image, "Article du moment", date via `formatDate`, reading time via `getReadingTime`, title, description) |
| `CvSection` | label, tagline, PDF link (`/assets/cv.fr.pdf` or `cv.en.pdf`), profile paragraphs, stack grid, certifications with local Credly badges (`/images/badges/`) and the existing Credly URLs; the fourth credential (Red Hat Ansible Specialist) has no badge, as in the mockup |
| `ContactSection` | label, h2, paragraph, social buttons (inline SVG for LinkedIn and GitHub), Formspree form with the mockup field styling and the site's own success/error messages, footer line ("Footage: Pexels", copyright with `getUTCFullYear()`) |
| `CardDetailOverlay` | `#tp-detail` skeleton, labels from i18n |
| `Loader`, `ScrollCue`, `Cursor`, `Scrim`, `Veil` | markup only; behaviour in the scene script |

The `projects` schema gains `featured: z.boolean().default(false)`, `motif: z.enum(['rings','rack','graph','columns','terminal','wireframe']).optional()` and `plateTag: z.string().optional()` (the short "Kubernetes / Python" line drawn on the plate, since it cannot be derived from `tags`). The six featured entries (FR and EN) are: ckad-dojo (rings), homelab (rack), vagrant-k8s-cluster (graph), good-points (columns), hugo-site-manager (terminal), adelineguillotgueret (wireframe). Their `description` is replaced by the mockup's one-line text. The `year` line is "Open source" for `github` entries and "Site web"/"Website" for `websites` entries, via i18n. Order on the plates follows the mockup: 01 ckad-dojo, 02 homelab, 03 vagrant-k8s-cluster, 04 Good Points, 05 hugo-site-manager, 06 adelineguillotgueret.fr.

## 7. Scene and motion script

`src/scripts/scene.ts`, loaded by the home pages only through a `<script>` tag bundled by Vite. It imports `three` (named imports for tree-shaking) and `lenis`. It is a direct port of the mockup class, split into functions with one concern each and typed:

- `detectCapabilities()` — coarse pointer or narrow-and-hoverless → light path; `prefers-reduced-motion`; WebGL presence.
- `initCursor()` — pointer tracking, velocity, `[data-cursor]` hover scale.
- `initScene()`, `initBackdrop()`, `initCards()`, `initPost()` — renderer, video plate shader, six card planes with canvas textures (`drawMotif()` keyed by `data-motif`), grain/vignette pass. Shaders are kept verbatim as template strings.
- `initScroll()` — Lenis unless reduced motion, section progress, anchor `scrollTo`.
- `initSplitText()` — word/char split with the same stagger jitter, IntersectionObserver reveal, 6 s safety net.
- `runLoader()`, `openCard()`, `closeCard()`, `tick()` — loader, overlay focus tween, frame loop (cursor inertia, work-section progress, veil cover, camera fBm drift, raycast hover, DoF, HUD update, scroll cue).
- `fallbackDOM()` — hides canvas, HUD, cue, cursor, loader; moves the grid into the work section; restores the system cursor; still runs split-text.

Video sources: `/videos/backdrop-1080.mp4` on the full path, `/videos/backdrop-540.mp4` on the light path. The plate is Pexels 3960414 ("white ink drops on black"), credited in the footer as in the mockup.

Blog pages load a smaller `src/scripts/motion.ts` with only the cursor and split-text parts.

## 8. Blog surfaces

All article features are kept and restyled in the monochrome system: paginated listing with categories cloud, category pages (with series ordering), article layout with reading time, tags, categories, series header and nav, table of contents, `BlogPosting` + `BreadcrumbList` JSON-LD, hreflang and canonical.

Layout rules for blog pages:

- Same nav (anchors point back to `/#tp-…` or `/en/#tp-…`) and same footer line.
- Listing: mono eyebrow "02 — Le Blog" style label, Space Grotesk uppercase h1, categories as mono uppercase chips with the 18 % rule, article cards as the featured-card pattern of the mockup (grayscale image, colour on hover, 20 % border, lime on hover).
- Article: h1 in Space Grotesk 500 uppercase, meta line in mono, prose in Space Grotesk 300 with white headings, lime links, code blocks in JetBrains Mono on `#0a0a0a` with the 18 % rule; tables and inline code keep the existing overflow fixes.
- Pagination and series nav use the mono underlined link pattern with the lime arrow.

## 9. Removals

Pages: `about`, `cv`, `contact`, `projects`, `training/index` and their EN twins. Components: `Hero`, `HeroPortraitCard`, `CredentialsStrip`, `CredentialsBadges`, `TrainingsFeaturedList`, `TrainingsGrid`, `ProjectsGrid`, `ArticlesFeaturedList`, `AvailabilityPill`, `DarkModeToggle`, `SectionEyebrow`, `Footer` (replaced by the footer line in the layout). Data: `src/data/heroSkills.ts`, the `training` collection and its content, the four non-featured project entries stay in the collection but are not rendered. Content: `src/content/pages/*` (their text is now in i18n keys). Dependencies: `@fontsource/source-serif-4`, `@fontsource/geist-sans`, `tailwind.config.mjs` if `max-w-site` has no consumer left. i18n keys with no consumer.

`check-articles.py`, `check-html.py` and `check-language-switcher.mjs` are kept; the Lighthouse job targets `/`, `/blog/` and `/en/`.

## 10. Accessibility and performance

- One `h1` per page: the hero on home pages, the article or listing title elsewhere.
- Custom cursor is decorative; native focus rings are visible on every interactive element; the overlay closes on Escape and returns focus to the page.
- Reduced motion: no Lenis, 300 ms loader, split-text still reveals (opacity only).
- Light path: no post-process pass, DPR capped at 1.5, 540p plate, no antialias.
- No WebGL: DOM fallback described in section 7.
- Video is `muted`, `loop`, `playsinline`, `preload="auto"` on home pages only; autoplay is retried on the first gesture.

## 11. Verification

1. `pnpm exec astro check`, `pnpm build`.
2. `python3 scripts/check-articles.py`, `python3 scripts/check-html.py dist`, `node scripts/check-language-switcher.mjs`.
3. `html-validate` on `dist/`.
4. Lighthouse on `/`, `/blog/`, `/en/`.
5. Playwright against `pnpm dev`: screenshots of each home section at 1440 px next to the mockup; 360 px viewport; keyboard-only tour; overlay open/close; `prefers-reduced-motion`; WebGL disabled → fallback grid visible; `/posts/homelab/` lands on `/blog/homelab/`; every nav anchor scrolls; FR ↔ EN switch on home, listing, article and category pages.

## 12. Out of scope

Any new content, the four non-featured projects, a training section, a light theme, backend for the contact form, changes to article Markdown other than the one `/posts/` link.
