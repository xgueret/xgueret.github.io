# Plates Cap and Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cap the home-page 3D plates with one shared constant (random runtime pick, derived section height and camera travel) and restore a `/projects/` listing page linked from the projects section.

**Architecture:** `src/lib/plates.ts` holds `MAX_PLATES` and the two derivations; the Astro `WorkSection` renders the section height and HUD total from it, the client `scene/index.ts` picks the plates and derives the camera travel from it. The projects page reuses the blog listing shell with a new `ProjectsList` component.

**Tech Stack:** Astro 5, TypeScript, three.js scene already in place, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-10-plates-cap-and-projects-page-design.md`

## Global Constraints

- pnpm only; deletions via `trash`; one local commit per task on `refonte` (authorized), never push.
- English code/comments/docs; every visible string through `t(locale, key)` in **both** `src/i18n/fr.ts` and `src/i18n/en.ts`.
- With `MAX_PLATES = 6` the home page must render exactly as before this plan (same height 340 vh, same travel 58, same six plates in featured order, HUD `/06`).
- One `<h1>` per page; `post.id`/`entry.id` handling as in the project `CLAUDE.md`; absolute URLs from `Astro.site`.
- Verification commands: `pnpm exec astro check`, `pnpm build`, `python3 scripts/check-articles.py`, `python3 scripts/check-html.py dist`, `node scripts/check-language-switcher.mjs`.

---

### Task 1: `MAX_PLATES` — random pick, derived height and travel

**Files:**
- Create: `src/lib/plates.ts`
- Modify: `src/scripts/scene/config.ts`, `src/scripts/scene/cards.ts`, `src/scripts/scene/index.ts`, `src/components/home/WorkSection.astro`

**Interfaces:**
- Produces `MAX_PLATES: number`, `workHeightVh(count): number`, `cameraTravelZ(count): number` in `src/lib/plates.ts`; `pickPlates(pool, max): ProjectData[]` in `cards.ts`.

- [ ] **Step 1: Create `src/lib/plates.ts`**

```ts
/**
 * Upper bound of 3D plates drawn on the home page. The featured projects are
 * the pool; when the pool is larger, the scene picks this many at random on
 * each visit. Section height and camera travel derive from the count.
 */
export const MAX_PLATES = 6;

/** Depth of the first plate and spacing between plates (mockup values). */
export const CARD_FIRST_Z = -11;
export const CARD_GAP_Z = 7.5;
/** The camera starts at the hero depth and flies just past the last plate. */
export const CAMERA_START_Z = 8;

/** `#tp-work` height in vh for a plate count — 340 vh for six, as the mockup. */
export function workHeightVh(count: number): number {
  return 40 + count * 50;
}

/** Camera Z travel for a plate count — 58 for six, as the mockup. */
export function cameraTravelZ(count: number): number {
  return CAMERA_START_Z - (CARD_FIRST_Z - (count - 1) * CARD_GAP_Z) + 1.5;
}
```

- [ ] **Step 2: Make `src/scripts/scene/config.ts` re-export the geometry from the shared module**

Replace the four geometry lines (`CARD_FIRST_Z`, `CARD_GAP_Z`, `CAMERA_START_Z`, `CAMERA_TRAVEL_Z` and their comments) with:

```ts
export { CARD_FIRST_Z, CARD_GAP_Z, CAMERA_START_Z, cameraTravelZ, MAX_PLATES } from '../../lib/plates';
```

Keep `SCENE` and `LIME` as they are.

- [ ] **Step 3: Add `pickPlates` to `src/scripts/scene/cards.ts`** (after `readProjects`)

```ts
/**
 * Choose the plates to draw: the whole pool when it fits, otherwise `max`
 * entries picked at random, kept in featured order so the column rhythm holds.
 */
export function pickPlates(pool: ProjectData[], max: number): ProjectData[] {
  if (max >= pool.length) return pool;
  const indices = pool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, max).sort((a, b) => a - b).map((i) => pool[i]);
}
```

- [ ] **Step 4: Use it in `src/scripts/scene/index.ts`**

Change the import line `import { CAMERA_START_Z, CAMERA_TRAVEL_Z, SCENE } from './config';` to `import { CAMERA_START_Z, cameraTravelZ, MAX_PLATES, SCENE } from './config';`, the cards import to `import { createCards, pickPlates, readProjects, type Card } from './cards';`, then:

```ts
  const data = pickPlates(readProjects(), MAX_PLATES);
  const cards: Card[] = createCards(scene, data, caps.mobile);
  const travelZ = cameraTravelZ(cards.length);
```

and in `updateCamera` replace `CAMERA_TRAVEL_Z` with `travelZ`. Nothing else changes (`total`, HUD updates and `data[nearest]` already use the picked `data`/`cards`).

- [ ] **Step 5: Derive height and total in `src/components/home/WorkSection.astro`**

```astro
---
import { type Locale, t } from '../../i18n';
import type { FeaturedProject } from '../../lib/featured-projects';
import { MAX_PLATES, workHeightVh } from '../../lib/plates';

interface Props {
  locale: Locale;
  projects: FeaturedProject[];
}

const { locale, projects } = Astro.props;
const count = Math.min(MAX_PLATES, projects.length);
const first = projects[0];
const total = String(count).padStart(2, '0');
const firstTag = first ? `${first.plateTag} — ${first.year}` : '';
const height = `${workHeightVh(count)}vh`;
---

<section id="tp-work" data-screen-label="Work" class="relative" style={`height:${height};`}>
```

(the rest of the file unchanged).

- [ ] **Step 6: Verify parity at 6, then the cap at 3**

```bash
pnpm exec astro check && pnpm build
grep -o 'id="tp-work"[^>]*' dist/index.html          # expect height:340vh
grep -o '/06' dist/index.html | head -1
python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
```

Then temporarily set `MAX_PLATES = 3`, rebuild, start `pnpm preview --port 4322` in the background and run `node /tmp/claude-1000/-home-xgueret-Workspace-01-projets-web-xgueret-github-io/9cc5a9fd-9b5c-451b-b8e4-537f406e9dbf/scratchpad/mobile-frames.cjs http://localhost:4322/` (needs `CHROME=/usr/bin/google-chrome`; run it from that scratchpad directory): the `work75`/`about` rows must show the HUD at a picked title and `/03` in `dist/index.html` (`grep -o '/03' dist/index.html`), `#tp-work` at `height:190vh`. Run it twice: the picked set may differ (three of six). Restore `MAX_PLATES = 6`, rebuild, re-run the frames script once (parity: same numbers as the 2026-09-10 baseline, no frame over 50 ms in `scroll-work`). Stop the preview server (`fuser -k 4322/tcp`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/plates.ts src/scripts/scene/config.ts src/scripts/scene/cards.ts src/scripts/scene/index.ts src/components/home/WorkSection.astro
git commit -m "feat(scene): cap the home plates with MAX_PLATES, random pick and derived section geometry"
```

---

### Task 2: `/projects/` page, HUD link, redirects and docs

**Files:**
- Create: `src/components/ProjectsList.astro`, `src/pages/projects.astro`, `src/pages/en/projects.astro`
- Modify: `src/i18n/fr.ts`, `src/i18n/en.ts`, `src/components/home/WorkSection.astro`, `astro.config.mjs`, `public/llms.txt`, `CLAUDE.md` (git-ignored, on disk)

**Interfaces:**
- `ProjectsList` props: `{ locale: Locale; projects: ProjectRow[] }` with `interface ProjectRow { title: string; description: string; category: 'github' | 'websites'; tags: string[]; href: string }`.

- [ ] **Step 1: Add the keys (both files, before `} as const;`)**

`fr.ts`:

```ts
  // Projects page
  projectsTitle1: 'Projets',
  projectsTitle2: 'et expériences',
  projectsIntro: 'Dépôts open source et sites livrés : ce que je construis quand je ne déploie pas chez un client.',
  projectsViewAll: 'Voir tous les projets',
  projectsDescription: 'Projets open source et sites web de Xavier Gueret : Kubernetes, Terraform, Ansible, Python, sites statiques.',
```

`en.ts`:

```ts
  // Projects page
  projectsTitle1: 'Projects',
  projectsTitle2: 'and experiments',
  projectsIntro: 'Open-source repositories and shipped websites: what I build when I am not deploying for a client.',
  projectsViewAll: 'View all projects',
  projectsDescription: 'Open-source projects and websites by Xavier Gueret: Kubernetes, Terraform, Ansible, Python, static sites.',
```

- [ ] **Step 2: Create `src/components/ProjectsList.astro`**

```astro
---
import { type Locale, t } from '../i18n';

export interface ProjectRow {
  title: string;
  description: string;
  category: 'github' | 'websites';
  tags: string[];
  href: string;
}

interface Props {
  locale: Locale;
  projects: ProjectRow[];
}

const { locale, projects } = Astro.props;
const groups = [
  { key: 'github', label: t(locale, 'projectOpenSource'), rows: projects.filter((p) => p.category === 'github') },
  { key: 'websites', label: t(locale, 'projectWebsite'), rows: projects.filter((p) => p.category === 'websites') },
].filter((g) => g.rows.length > 0);
let n = 0;
---

{groups.map((g) => (
  <section class="mb-16">
    <h2 class="tp-label" style="opacity:.8; margin:0 0 8px;">{g.label}</h2>
    <div class="flex flex-col" style="gap:2px;">
      {g.rows.map((p) => {
        n += 1;
        return (
          <article class="tp-row" style="grid-template-columns:minmax(60px,80px) 1fr; padding:26px 0;">
            <span class="font-mono" style="font-size:11px; letter-spacing:.24em; opacity:.74;">{String(n).padStart(2, '0')}</span>
            <div class="flex flex-col" style="gap:14px;">
              <h3 class="uppercase" style="margin:0; font-size:clamp(1.15rem,1.9vw,1.6rem); font-weight:500; letter-spacing:.02em; line-height:1.1;">
                <a href={p.href} target="_blank" rel="noopener" data-cursor="link">{p.title}</a>
              </h3>
              <p style="margin:0; font-size:.95rem; line-height:1.55; font-weight:300; opacity:.82; max-width:62ch; text-wrap:pretty;">{p.description}</p>
              <div class="flex flex-wrap" style="gap:8px;">
                {p.tags.map((tag) => (
                  <span class="tp-label-sm" style="padding:6px 10px; border:1px solid rgba(255,255,255,.18); letter-spacing:.22em; opacity:.74;">{tag}</span>
                ))}
              </div>
              <a href={p.href} target="_blank" rel="noopener" data-cursor="link" class="tp-link self-start" style="padding-bottom:6px;">{t(locale, 'detailView')}</a>
            </div>
          </article>
        );
      })}
    </div>
  </section>
))}
```

- [ ] **Step 3: Create `src/pages/projects.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProjectsList, { type ProjectRow } from '../components/ProjectsList.astro';
import { t, type Locale } from '../i18n';
import { getCollection } from 'astro:content';

const locale: Locale = 'fr';

const entries = await getCollection('projects', ({ id }) => id.startsWith(`${locale}/`));
const projects: ProjectRow[] = entries
  .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title))
  .map((e) => ({
    title: e.data.title,
    description: e.data.description,
    category: e.data.category,
    tags: e.data.tags,
    href: e.data.github ?? e.data.url ?? '#',
  }));
---

<BaseLayout title={t(locale, 'projects')} description={t(locale, 'projectsDescription')} locale={locale}>
  <div class="mx-auto" style="max-width:1400px; padding:48px 28px 96px;">
    <header class="mb-12 flex flex-col" style="gap:22px;">
      <p class="tp-label" style="opacity:.8; margin:0;" data-split="1">{t(locale, 'workLabel')}</p>
      <h1 class="tp-h2" data-split="1">{t(locale, 'projectsTitle1')}<br />{t(locale, 'projectsTitle2')}</h1>
      <p style="margin:0; font-size:clamp(.95rem,1.3vw,1.1rem); line-height:1.55; font-weight:300; opacity:.9; max-width:52ch; text-wrap:pretty;" data-split="1">{t(locale, 'projectsIntro')}</p>
    </header>
    <ProjectsList projects={projects} locale={locale} />
  </div>
</BaseLayout>
```

`src/pages/en/projects.astro`: identical with `const locale: Locale = 'en';` and imports one level deeper (`'../../layouts/BaseLayout.astro'`, `'../../components/ProjectsList.astro'`, `'../../i18n'`).

If Astro refuses `export interface` from a component frontmatter, move `ProjectRow` to `src/lib/project-row.ts` and import it from there in the three files.

- [ ] **Step 4: Add the link to the HUD in `src/components/home/WorkSection.astro`**

Replace the top row's right span with a column:

```astro
    <div class="tp-label flex justify-between items-start">
      <span data-split="1">{t(locale, 'workLabel')}</span>
      <div class="flex flex-col items-end" style="gap:14px;">
        <span style="opacity:.8;">{t(locale, 'workScroll')}</span>
        <a href={`${localePrefix(locale)}/projects/`} data-cursor="link" class="tp-link" style="pointer-events:auto; padding-bottom:6px;">
          <span>{t(locale, 'projectsViewAll')}</span>
          <span style="color:#a8cf3e;">↗</span>
        </a>
      </div>
    </div>
```

and import `localePrefix` from `'../../i18n'`.

- [ ] **Step 5: Remove the two redirects and list the pages**

In `astro.config.mjs` delete the lines `'/projects': '/#tp-work',` and `'/en/projects': '/en/#tp-work',`. In `public/llms.txt`, under `## Important Pages`, add after the Categories block:

```markdown
### Projects
- https://xgueret.github.io/projects/
- https://xgueret.github.io/en/projects/

```

In `CLAUDE.md` (on disk): in the home-scene section add "`MAX_PLATES` in `src/lib/plates.ts` caps the plates (random runtime pick when the featured pool is larger; section height and camera travel derive from it)", and in the project structure add `src/pages/projects.astro` / `en/projects.astro` and `components/ProjectsList.astro`.

- [ ] **Step 6: Verify**

```bash
pnpm exec astro check && pnpm build
python3 scripts/check-articles.py && python3 scripts/check-html.py dist && node scripts/check-language-switcher.mjs
ls dist/projects/index.html dist/en/projects/index.html
grep -c '<article' dist/projects/index.html         # expect 10
grep -o 'href="/projects/"' dist/index.html | head -1 && grep -o 'href="/en/projects/"' dist/en/index.html | head -1
grep -c '<h1' dist/projects/index.html               # expect 1
```

Then with the Playwright MCP tools against `pnpm preview`: `/projects/` at 1440 and 360 (no horizontal overflow, 0 console errors), the FR→EN switcher lands on `/en/projects/`, the HUD link on `/` is clickable (pointer-events) and navigates to `/projects/`.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProjectsList.astro src/pages/projects.astro src/pages/en/projects.astro src/i18n/fr.ts src/i18n/en.ts src/components/home/WorkSection.astro astro.config.mjs public/llms.txt
git commit -m "feat(projects): restore the projects listing page and link it from the home section"
```
