# Redesign — Elevator concept integration

> **Date**: 2026-04-26
> **Owner**: Xavier GUERET
> **Mockup source**: `tmp/maquette-xgueret.html`
> **Status**: approved

## 1. Goal

Replace the current home page of `xgueret.github.io` with the "elevator building" concept from the mockup (6 floors: RDC / 01 / 02 / 03 / 04 / TOP), while preserving every existing site feature: paginated post listings, individual posts, category pages, projects listing, training listing, CV page (markdown + PDF), and bilingual FR/EN support.

The redesign also extends the elevator's visual identity to every deep route (post pages, category pages, etc.) by applying the new palette/typography/components, and by keeping the elevator side panel persistent on every page so the user can return to any floor with one click.

## 2. Non-goals

- No backend / serverless form handling (contact form opens `mailto:`).
- No Astro `<ClientRouter />` / View Transitions (out of scope, possible phase 2).
- No mobile swipe gesture for floor changes.
- No new content (articles, projects, training) — we remap existing collections.
- No PDF CV refactor — the existing PDF remains as-is.
- No chatbot — the current React island is removed.
- No image/cover redesign for articles — existing `public/images/posts/*` stay.

## 3. Decisions log

The following decisions were made during brainstorming and are baked into this spec:

| # | Question | Decision |
|---|---|---|
| 1 | SPA vs multi-page | **B** — Elevator on home, classic multi-page routes elsewhere |
| 2 | i18n strategy | **A** — Bilingual elevator (`/` FR, `/en/` EN) |
| 3 | Chatbot fate | **C** — Removed entirely |
| 4 | Articles floor content | Dynamic from collection, no hardcoding |
| 5 | Articles pagination | **B** — Floor 02 shows 6 latest + link to existing `/posts/` paginated route |
| 6 | CV floor | **a** — Floor 01 hardcoded resume (apt-list + certs), `/cv` route keeps full markdown + PDF |
| 7 | Contact submission | **c** — Form opens pre-filled `mailto:` on submit |
| 8 | Routes inventory | Keep posts/categories/projects/training/cv ; remove about + contact ; keep tweaks panel (accent switcher) |
| 9 | Return-to-elevator UX | **B** — Persistent elevator panel on every page + hash deep-link (`/#01`, `/#02`, …) |

## 4. Architecture overview

### 4.1 Routing

| Route | Status | Notes |
|---|---|---|
| `/` and `/en/` | Refactored | Elevator home, 6 floors |
| `/posts/[page]` and `/en/posts/[page]` | Kept | Restyled to new palette |
| `/posts/[slug]` and `/en/posts/[slug]` | Kept | Restyled |
| `/categories/[...path]` and `/en/categories/[...path]` | Kept | Restyled |
| `/categories/index` and `/en/categories/index` | Kept | Restyled |
| `/projects` and `/en/projects` | Kept | Existing search + show-more preserved, restyled |
| `/training` and `/en/training` | Kept | Restyled |
| `/cv` and `/en/cv` | Kept | Markdown body + PDF download button, restyled |
| `/about` and `/en/about` | Removed → meta-refresh stub redirecting to `/#01` (CV floor) |
| `/contact` and `/en/contact` | Removed → meta-refresh stub redirecting to `/#TOP` |

### 4.2 Component map

**New (`src/components/elevator/`)**

- `ElevatorPanel.astro` — fixed left (desktop) / bottom (mobile) panel: LCD floor indicator, hex buttons, up/down arrows. Rendered on every page via `BaseLayout`.
- `ElevatorHUD.astro` — fixed top-right HUD: SYS status, build tag, location, theme toggle (DARK/LIGHT). Rendered on every page.
- `ElevatorDoors.astro` — overlay doors + streaks + arrival toast + flash. Rendered on home only.
- `ElevatorTweaks.astro` — desktop-only accent switcher (violet / prusse / amber). Rendered on every page (≥ 800px). Persists choice to `localStorage`.
- `elevator.client.ts` — TypeScript module: navigation logic, door/streak/flash/toast animations, hash sync, keyboard handlers, theme/accent persistence. Imported once globally; auto-detects whether floors exist on the current page (home only) and falls back to navigation-only mode otherwise.

**New (`src/components/floors/`)**

- `FloorHero.astro` — RDC: portrait, h1 headline, sub, hints.
- `FloorCV.astro` — 01: profil text + apt-list (skills) + gitlog (certs), all from i18n.
- `FloorArticles.astro` — 02: 6 latest posts from collection, "view all" link.
- `FloorProjects.astro` — 03: fuse grid from collection sorted by `data.order`.
- `FloorTraining.astro` — 04: man-page block from collection.
- `FloorContact.astro` — TOP: palm SVG, contact form (mailto submit), coords.

**New (`src/components/ui/`)**

- `FuseCard.astro` — reusable industrial card with rivets + state badge. Used in floors 02/03 and on `/posts/` listing.
- `AptItem.astro` — apt-style skill row with progress bar.
- `GitLogRow.astro` — gitlog certification row.
- `ManPageBlock.astro` — man-page formatted section (NAME / SYNOPSIS / DESCRIPTION / etc.).

**Modified**

| Existing | Change |
|---|---|
| `BaseLayout.astro` | Adds HUD + Panel + Tweaks globally; removes Navbar/chatbot mount |
| `PageLayout.astro` | Slim wrapper, content area only |
| `PostLayout.astro` | Slim wrapper, content area only |
| `Footer.astro` | Compact: copyright + LanguageSwitcher + GitHub link |
| `LanguageSwitcher.astro` | Restyled mini, lives in HUD |
| `ProjectsGrid.astro` | Kept as-is (restyled cards via FuseCard if convenient); used only on `/projects/` |
| `ArticlesGrid.astro` | Kept; used only on `/posts/` |
| `ArticleCard.astro` | Replaced by `FuseCard` invocation |
| `Pagination.astro` | Restyled |
| `CategoriesCloud.astro` | Restyled |
| `TrainingsGrid.astro` | Restyled |
| `SEO.astro` | Unchanged |

**Removed**

- `Hero.astro` (replaced by `FloorHero`)
- `Navbar.astro` (replaced by `ElevatorPanel` everywhere)
- `DarkModeToggle.astro` (folded into `ElevatorHUD`)
- `chatbot/` (entire directory)
- `@astrojs/react` integration in `astro.config`
- `react`, `react-dom` from `package.json`

## 5. Data flow

### 5.1 Per-floor sources

| Floor | Source | Notes |
|---|---|---|
| RDC Hero | `src/i18n/{locale}.ts` + `public/images/moi.png` | Static, translated |
| 01 CV | `src/i18n/{locale}.ts` (apt-list keys, certs keys) | Hardcoded but translated. Full markdown stays at `/cv`. PDF download link to `/assets/cv.{locale}.pdf`. |
| 02 Articles | `getCollection('posts', ({id}) => id.startsWith(`${locale}/`))` → sort date desc → `slice(0, 6)` | Dynamic. "View all" link to `/posts/` (FR) or `/en/posts/` (EN). |
| 03 Projects | `getCollection('projects', ({id}) => id.startsWith(`${locale}/`))` → sort by `data.order` | Dynamic. Status badge from new `data.status` field. |
| 04 Training | `getCollection('training', ({id}) => id.startsWith(`${locale}/`))` | Dynamic. Renders man-page block per training entry. |
| TOP Contact | `src/i18n/{locale}.ts` | Static. `<form onsubmit>` opens `mailto:971xavier.gueret@gmail.com?subject=...&body=...`. |

### 5.2 Schema extension

In `src/content/config.ts`, extend the `projects` collection schema with:

```ts
status: z.enum(['running', 'deployed', 'wip']).optional().default('deployed')
```

Existing project frontmatter without `status` defaults to `deployed` so no migration of existing files is required.

### 5.3 i18n keys

Inventory of new keys to add to both `src/i18n/fr.ts` and `src/i18n/en.ts`:

```ts
elevator: {
  hud: { online, build, location, dark, light },
  floor: { rdc, cv, articles, projets, formations, contact },     // floor codes (RDC/01/02/03/04/TOP) — same in both locales
  floorLabels: { accueil, cv, articles, projets, formations, contact },
  floorTags: { rdc, f01, f02, f03, f04, top },                    // section tag lines (e.g. "ÉTAGE 02 · SALLE SERVEURS")
  arrival: { up, down },
  navigate: 'NAVIGUER' / 'NAVIGATE',
  floorsCount: '06 ÉTAGES' / '06 FLOORS',
  hero: { metaPrefix, h1Part1, h1Stroke, h1Part2, h1Accent, sub },
  cv: { profil, profilBody, aptListHeader, aptItems[], certifsHeader, certifsItems[], downloadPdf, viewFullCv },
  articles: { sectionTag, title, desc, viewAll },
  projects: { sectionTag, title, desc, statusRunning, statusDeployed, statusWip },
  training: { sectionTag, title, desc, manName, manSynopsis, manDescription, manPhilo, manSeeAlso },
  contact: { sectionTag, title, sub, formTitle, fieldName, fieldEmail, fieldMessage, send, lat, lon, mailtoSubject }
}
```

Floor codes (`RDC`, `01`, `02`, `03`, `04`, `TOP`) are language-agnostic and rendered as-is in both locales.

### 5.4 Persistence

- `localStorage['xg-theme']` — `dark` | `light` (default `dark`)
- `localStorage['xg-accent']` — `violet` | `prusse` | `amber` (default `prusse`)

Both are read by an inline `<script>` in `<head>` (in `BaseLayout`) before the first paint to prevent FOUC. The script sets `document.documentElement.dataset.theme` and `dataset.accent`.

## 6. Navigation model

### 6.1 On the home

The home page renders all 6 floor sections in the DOM, but only one is visually active at a time (CSS `.active` opacity toggle, with directional arrival animation).

`elevator.client.ts` controls navigation:

- Click on hex button → `goTo(floorIdx)`
- Up/Down arrow buttons → next/prev floor
- Keyboard `ArrowUp`/`ArrowDown` (when not in input) → next/prev floor
- Keyboard `0`-`5` → direct jump
- Hash on load (`/#01`, `/#02`, ...) → jump to that floor immediately, doors animation included
- On floor change, update `location.hash` (without adding history entries — use `history.replaceState`)

### 6.2 On deep routes

The `ElevatorPanel` is rendered on every page. On non-home pages:

- Hex buttons become anchors: `<a href="/#01">`, `<a href="/#02">`, etc. (or `/en/#01` etc. on EN routes)
- The LCD displays the contextually-relevant floor code based on the route:
  - `/cv` and `/en/cv` → `01`
  - `/posts/*`, `/en/posts/*`, `/categories/*`, `/en/categories/*` → `02`
  - `/projects` and `/en/projects` → `03`
  - `/training` and `/en/training` → `04`
  - any other path → `RDC`
- Up/Down arrows are disabled (no floor concept on deep routes)
- Clicking takes the user to the home, which reads the hash and animates to that floor

### 6.3 Hash → floor mapping

```
/#       → RDC (idx 0)
/#01     → idx 1 (CV)
/#02     → idx 2 (Articles)
/#03     → idx 3 (Projects)
/#04     → idx 4 (Training)
/#TOP    → idx 5 (Contact)
```

On invalid hash, fall back to RDC silently (no error).

## 7. Styling

### 7.1 Variables (in `src/styles/global.css`)

All custom variables are prefixed `--xg-*` to avoid conflicts with Tailwind v4 built-ins (lesson learned from past `--color-white` incident — see `MEMORY.md`):

```css
:root, html[data-theme="dark"] {
  --xg-bg: #0b0b12;
  --xg-surface: #13131f;
  --xg-card: #1e2030;
  --xg-border: #2a2d3e;
  --xg-text: #e2e8f0;
  --xg-muted: #8a8fa3;
  --xg-accent: #a855f7;
  --xg-accent-soft: #a855f733;
  --xg-cool: #38bdf8;
  --xg-industrial: #fb923c;
  --xg-top: #2dd4bf;
  /* … */
}
html[data-theme="light"] { /* light overrides */ }
html[data-accent="prusse"] { --xg-accent: #1d4e89; --xg-accent-soft: #1d4e8933; }
html[data-accent="violet"] { --xg-accent: #a855f7; --xg-accent-soft: #a855f733; }
html[data-accent="amber"]  { --xg-accent: #fb923c; --xg-accent-soft: #fb923c33; }
```

### 7.2 Fonts

Self-host (no Google Fonts CDN), via `@fontsource`:

- **Plus Jakarta Sans** (already installed) — kept for body-ish elements where Inter would have been used
- **Space Grotesk** (new, `@fontsource/space-grotesk`) — display headings (h1, floor titles)
- **JetBrains Mono** (new, `@fontsource/jetbrains-mono`) — HUD, LCD, code blocks, labels

Inter is **not** added; Plus Jakarta Sans replaces Inter throughout. Acceptable substitute, both are humanist sans.

### 7.3 Mobile breakpoint

`@media (max-width: 800px)`:

- Panel: bottom-fixed bar instead of left-fixed sidebar
- HUD: hide BUILD + LOCATION, keep SYS::ONLINE + theme toggle
- Tweaks panel: hidden on mobile
- Floor padding reduced
- Floor headings scaled via `clamp()`

### 7.4 Reduced motion

`@media (prefers-reduced-motion: reduce)`:

- Doors, streaks, flash, shake, arrival animations disabled
- Floor swap is a 200ms opacity fade
- LCD update still happens

## 8. Accessibility checklist

- [ ] LCD: `aria-live="polite"` for floor announcements
- [ ] Hex buttons: `aria-label="Floor 02 — Articles"` localized
- [ ] Toast: `role="status"`
- [ ] Focus moves to active floor's `<h1>`/`<h2>` after navigation
- [ ] Keyboard navigation works for all features
- [ ] Form labels properly associated (fix the double-label bug from mockup)
- [ ] `<noscript>` fallback: floors stack vertically with native scroll
- [ ] Light mode contrast: bump `--xg-muted` if needed to pass WCAG AA on `--xg-bg`
- [ ] Skip-to-content link available for screen readers

## 9. Risks and mitigations

1. **Hash deep-link feels slow** — full page reload + door animation on every cross-route click. Mitigation: prefetch home from deep routes via `<link rel="prefetch" href="/" />` in their `<head>`. If still slow on lab tests, revisit with View Transitions in phase 2.

2. **Tailwind v4 variable conflicts** — preempted by prefixing all variables `--xg-*`.

3. **EN content effort** — ~30 i18n keys to translate. Author (Xavier) reviews EN copy before launch.

4. **Removed routes (`/about`, `/contact`) breaking external links** — we ship meta-refresh stubs that redirect to the equivalent floor anchor. SEO-wise, this is a soft 200 with a redirect, not a 404.

5. **Mailto on machines with no default mail client** — accepted limitation. Footer also exposes a clickable email link for fallback.

6. **`@astrojs/react` removal must not break build** — verified that no other component currently uses React.

## 10. Acceptance criteria

The redesign is considered complete when:

1. `pnpm build` succeeds without errors or warnings new to this redesign.
2. The home `/` displays the elevator with all 6 floors functional (clicking hex / arrows / keyboard / hash works).
3. The home `/en/` mirrors `/` in English with translated copy.
4. Deep routes (`/posts/`, `/posts/[slug]`, `/categories/`, `/projects`, `/training`, `/cv`) render with the new palette/typography and the persistent elevator panel.
5. Clicking a hex button on a deep route navigates to the home and lands on the matching floor with the door animation.
6. `/about` and `/contact` redirect (meta-refresh) to `/#01` and `/#TOP` respectively, in both locales.
7. Theme toggle (DARK/LIGHT) and accent switcher (violet/prusse/amber) persist across page loads via `localStorage`.
8. No FOUC on theme/accent on first paint.
9. `prefers-reduced-motion` strips door/streak/flash/shake animations; floor swap remains as opacity fade.
10. Lighthouse a11y score on home and one post page is ≥ 95.
11. No console errors on home, one post, one category, `/cv`, `/projects`, `/training`.
12. Chatbot is removed; `package.json` no longer lists `react`, `react-dom`, `@astrojs/react`; `astro.config.mjs` no longer references React integration.

## 11. Delivery order (8 commits)

1. **chore(deps): add fonts, prep theming groundwork** — install `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`; add prefixed `--xg-*` variables and theme/accent data attributes to `global.css` **alongside** existing `--color-*` variables (do NOT remove them in this commit — deep routes still depend on them). The old `--color-*` palette is migrated route-by-route in commit 7. Inline FOUC-prevention script in `BaseLayout`.
2. **feat(ui): atomic UI primitives** — `FuseCard`, `AptItem`, `GitLogRow`, `ManPageBlock` with their styles.
3. **feat(elevator): static panel and HUD** — `ElevatorPanel` and `ElevatorHUD` rendered with no behavior yet (visual only).
4. **feat(elevator): navigation logic** — `elevator.client.ts` with door/streak/flash/toast animations, hash sync, keyboard, theme/accent persistence; wire `ElevatorDoors` overlay; add `ElevatorTweaks`.
5. **feat(home): six floors** — `FloorHero`, `FloorCV`, `FloorArticles`, `FloorProjects`, `FloorTraining`, `FloorContact`; new home `index.astro` (FR) and `en/index.astro` (EN); add i18n keys; extend `projects` schema with `status` field.
6. **refactor(layout): wire elevator into BaseLayout, drop chatbot/Navbar/Hero** — update `BaseLayout`, `PageLayout`, `PostLayout`; remove `Navbar`, `Hero`, `DarkModeToggle`, `chatbot/`; uninstall `@astrojs/react`, `react`, `react-dom`.
7. **style(routes): reskin deep routes** — restyle `/posts/[page]`, `/posts/[slug]`, `/categories/*`, `/projects`, `/training`, `/cv` using the new palette and components (no logic changes); migrate `--color-*` references to `--xg-*` in these routes' templates.
8. **feat(redirects): retire /about and /contact, polish** — meta-refresh stubs for `/about` and `/contact` (FR + EN); remove orphan `--color-*` variables from `global.css` once no route still depends on them; cleanup `tailwind.config.mjs` if no longer used; final build + visual QA pass on FR + EN + 6 floors + 2 deep routes.

Each commit is independently buildable and visually testable.

## 12. Open questions for implementation

These will be resolved during plan-writing or implementation, not blocking spec approval:

- Exact shade for light-mode `--xg-muted` (verify WCAG AA on light bg).
- Whether `tailwind.config.mjs` still serves a purpose or can be deleted entirely.
- Whether to keep `Plus Jakarta Sans` or fully switch to Inter — depends on how the body copy reads with Plus Jakarta Sans against the maquette's industrial vibe.
- Final shape of the `mailto:` body (just an email separator? full subject template?).
