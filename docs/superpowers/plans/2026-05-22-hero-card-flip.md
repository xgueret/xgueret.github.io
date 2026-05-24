# Hero Card Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static hero portrait with a 3D flip card that reveals 6 skill gauges on the back face — keeping the offset ocean accent block fixed behind.

**Architecture:** Single new Astro component (`HeroPortraitCard.astro`) with CSS 3D perspective + vanilla JS island. Skill data lives in a separate typed module (`heroSkills.ts`) for easy editing without touching markup. Labels are localized via the existing `t()` i18n function. No new framework or dependency.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript, vanilla JS (no React for this).

**Source spec:** [`docs/superpowers/specs/2026-05-22-hero-card-flip-design.md`](../specs/2026-05-22-hero-card-flip-design.md)

**Project-specific notes:**

- This project has **no test framework**. The TDD red/green cycle is replaced by a **build → visual verify → commit** cycle. Each task has explicit verification commands and expected observations.
- **Commit policy** (global rule `~/.claude/rules/commit-policy.md`): never auto-commit. Each task ends with a *suggested* commit command; the executor MUST wait for explicit user confirmation before running it.
- Package manager: **pnpm** (never npm or yarn — global rule `~/.claude/rules/use-pnpm.md`).
- Dev server: `pnpm dev` on `localhost:4321`. Build: `pnpm build`.

---

## File Structure

**Created:**

- `src/data/heroSkills.ts` — single source of truth for the 6 skills and their levels.
- `src/components/HeroPortraitCard.astro` — the flip card component (front + back + inline script + scoped styles).

**Modified:**

- `src/i18n/fr.ts` — add 9 keys (1 title, 1 back, 1 aria, 6 skill labels).
- `src/i18n/en.ts` — same 9 keys, EN values.
- `src/components/Hero.astro` — replace the `<picture>` block (lines 59–79) with `<HeroPortraitCard locale={locale} />`. The accent ocean block sibling (lines 55–58) stays untouched.

---

## Task 1: Add skill data module

**Files:**

- Create: `src/data/heroSkills.ts`

- [ ] **Step 1: Verify the `src/data/` directory exists**

Run: `ls src/data/ 2>/dev/null || mkdir -p src/data/`

Expected: directory exists or is created silently.

- [ ] **Step 2: Create the data file**

Write `src/data/heroSkills.ts`:

```ts
export type HeroSkill = {
  key:
    | 'kubernetes'
    | 'docker'
    | 'terraform'
    | 'ansible'
    | 'githubActions'
    | 'python';
  level: number;
};

export const HERO_SKILLS: HeroSkill[] = [
  { key: 'kubernetes',    level: 90 },
  { key: 'docker',        level: 90 },
  { key: 'terraform',     level: 85 },
  { key: 'ansible',       level: 85 },
  { key: 'githubActions', level: 85 },
  { key: 'python',        level: 75 },
];
```

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `pnpm astro check 2>&1 | tail -10`

Expected: no new errors. If `astro check` is not configured, run `pnpm build` and confirm it still completes successfully (we are only adding an unused export at this point, so build cannot regress).

- [ ] **Step 4: Suggested commit (wait for user approval)**

```bash
git add src/data/heroSkills.ts
git commit -m "feat(hero): add hero skills data module"
```

---

## Task 2: Add i18n keys for skill labels

**Files:**

- Modify: `src/i18n/fr.ts`
- Modify: `src/i18n/en.ts`

The `t()` function is typed via `TranslationKey = keyof typeof fr` (see `src/i18n/index.ts:7`). The same keys must exist in both files. Use camelCase to match the existing convention.

- [ ] **Step 1: Add the FR keys**

In `src/i18n/fr.ts`, insert a new `// Skills` section AFTER the `// Hero` section (after the line `heroCtaSecondary: 'Voir mon CV',` and BEFORE the `// Articles` comment around line 30).

Add exactly these 9 lines plus the section header:

```ts
  // Skills (hero flip card)
  skillsTitle: 'Compétences',
  skillsBack: '← Retour',
  skillsAriaFlip: 'Voir mes compétences',
  skillKubernetes: 'Kubernetes',
  skillDocker: 'Docker',
  skillTerraform: 'Terraform',
  skillAnsible: 'Ansible',
  skillGithubActions: 'GitHub Actions',
  skillPython: 'Python',
```

- [ ] **Step 2: Add the same keys to EN**

In `src/i18n/en.ts`, insert the same `// Skills (hero flip card)` block at the equivalent position (after the Hero section, before the Articles section). Use EN values:

```ts
  // Skills (hero flip card)
  skillsTitle: 'Skills',
  skillsBack: '← Back',
  skillsAriaFlip: 'Show my skills',
  skillKubernetes: 'Kubernetes',
  skillDocker: 'Docker',
  skillTerraform: 'Terraform',
  skillAnsible: 'Ansible',
  skillGithubActions: 'GitHub Actions',
  skillPython: 'Python',
```

- [ ] **Step 3: Verify both files type-check together**

Run: `pnpm build 2>&1 | tail -20`

Expected: build succeeds. If there is a type mismatch (e.g., key only added to one file), the build fails with a clear error pointing at the missing key — fix and re-run.

- [ ] **Step 4: Suggested commit (wait for user approval)**

```bash
git add src/i18n/fr.ts src/i18n/en.ts
git commit -m "feat(i18n): add skill label keys for hero flip card"
```

---

## Task 3: Create HeroPortraitCard.astro with the front face only

This is a **safe checkpoint**: after this task the page must look pixel-identical to the current build. We move the existing `<picture>` markup into the new component without any styling or behaviour change.

**Files:**

- Create: `src/components/HeroPortraitCard.astro`
- Modify: `src/components/Hero.astro` (lines 59–79)

- [ ] **Step 1: Create the component scaffold with only the front face**

Write `src/components/HeroPortraitCard.astro`:

```astro
---
import { type Locale, t } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
---

<div class="card-perspective">
  <div class="card-3d">
    <div class="face face-front">
      <picture>
        <source
          type="image/avif"
          srcset="/images/moi-600.avif 600w, /images/moi-1000.avif 1000w"
          sizes="(min-width: 1024px) 30vw, 90vw"
        />
        <source
          type="image/webp"
          srcset="/images/moi-600.webp 600w, /images/moi-1000.webp 1000w"
          sizes="(min-width: 1024px) 30vw, 90vw"
        />
        <img
          src="/images/moi.png"
          alt={t(locale, 'author')}
          class="w-full aspect-[3/4] rounded-lg object-cover"
          loading="eager"
          fetchpriority="high"
          width="864"
          height="1184"
        />
      </picture>
    </div>
  </div>
</div>

<style>
  .card-perspective {
    display: block;
    width: 100%;
  }
  .card-3d,
  .face {
    display: block;
    width: 100%;
  }
</style>
```

- [ ] **Step 2: Wire the new component into `Hero.astro`**

In `src/components/Hero.astro`, at the top of the frontmatter (after the existing imports), add:

```astro
import HeroPortraitCard from './HeroPortraitCard.astro';
```

Then replace lines 59–79 (the entire `<picture>...</picture>` block including the surrounding `<picture class="col-start-1 row-start-1 relative z-10 block">` open and `</picture>` close tags) with:

```astro
        <div class="col-start-1 row-start-1 relative z-10 block">
          <HeroPortraitCard locale={locale} />
        </div>
```

The accent ocean block (lines 55–58, the `<div aria-hidden="true" ...></div>`) stays untouched.

- [ ] **Step 3: Build + visual verification**

Run: `pnpm build`

Expected: build succeeds with no errors.

Then run: `pnpm dev`

Open `http://localhost:4321/`. Expected observations:

- Hero portrait visible at the same position as before.
- Accent ocean block decalé derrière le portrait (unchanged).
- No layout shift, no missing image.

Open `http://localhost:4321/en/` — same verification with the EN home.

Stop the dev server (Ctrl+C) before continuing.

- [ ] **Step 4: Suggested commit (wait for user approval)**

```bash
git add src/components/HeroPortraitCard.astro src/components/Hero.astro
git commit -m "refactor(hero): extract portrait into HeroPortraitCard component"
```

---

## Task 4: Add the back face structure (still no flip yet)

This task makes the back face render in the DOM as a sibling of the front face. Visually, the back is hidden behind the front (we'll set it up properly in the next task). After this step you can inspect the DOM to confirm structure, but the page looks identical.

**Files:**

- Modify: `src/components/HeroPortraitCard.astro`

- [ ] **Step 1: Import data + render the back face markup**

Update the frontmatter at the top of `src/components/HeroPortraitCard.astro`:

```astro
---
import { type Locale, t, type TranslationKey } from '../i18n';
import { HERO_SKILLS } from '../data/heroSkills';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const labelKey = (key: string): TranslationKey =>
  `skill${key.charAt(0).toUpperCase()}${key.slice(1)}` as TranslationKey;
---
```

Inside the `.card-3d` div, AFTER the existing `<div class="face face-front">...</div>`, add the back face block:

```astro
    <div class="face face-back" aria-hidden="true">
      <h3 class="back-title">{t(locale, 'skillsTitle')}</h3>
      <ul class="skills-list">
        {HERO_SKILLS.map((skill, i) => {
          const level = clamp(skill.level);
          return (
            <li class="skill-gauge">
              <div class="gauge-row">
                <span class="gauge-label">{t(locale, labelKey(skill.key))}</span>
                <span class="gauge-value">{level}%</span>
              </div>
              <div class="gauge-track">
                <div
                  class="gauge-fill"
                  style={`--level: ${level}%; --stagger: ${i * 100}ms;`}
                ></div>
              </div>
            </li>
          );
        })}
      </ul>
      <p class="back-hint">{t(locale, 'skillsBack')}</p>
    </div>
```

> **Why `aria-hidden="true"` here:** the back is not yet reachable. We'll flip this dynamically in Task 6 along with the JS interaction. Keeping it hidden from screen readers during this intermediate state prevents a confusing audit.

- [ ] **Step 2: Add minimal back-face styles so it renders (even if visible)**

Replace the existing `<style>` block in `HeroPortraitCard.astro` with:

```astro
<style>
  .card-perspective {
    display: block;
    width: 100%;
  }
  .card-3d {
    position: relative;
    display: block;
    width: 100%;
  }
  .face {
    display: block;
    width: 100%;
  }
  .face-front {
    position: relative;
    z-index: 1;
  }
  .face-back {
    /* For now: hidden under the front. Task 5 will turn this into a real 3D back face. */
    position: absolute;
    inset: 0;
    z-index: 0;
    aspect-ratio: 3 / 4;
    padding: 2rem;
    background: var(--color-ocean-deep);
    border-radius: var(--radius, 0.5rem);
    color: var(--color-sand);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .back-title {
    font-family: var(--font-serif, 'Source Serif 4', serif);
    font-size: 1.25rem;
    margin: 0;
  }
  .skills-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .gauge-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.375rem;
  }
  .gauge-label {
    font-family: var(--font-sans, 'Geist', sans-serif);
    font-size: 0.875rem;
    color: var(--color-sand);
  }
  .gauge-value {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    color: color-mix(in oklch, var(--color-sand) 70%, transparent);
  }
  .gauge-track {
    height: 4px;
    border-radius: 9999px;
    background: color-mix(in oklch, var(--color-sand) 15%, transparent);
    overflow: hidden;
  }
  .gauge-fill {
    height: 100%;
    border-radius: 9999px;
    background: var(--color-coral);
    width: var(--level, 0%);
    transform-origin: left;
  }
  .back-hint {
    margin: auto 0 0 0;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6875rem;
    color: color-mix(in oklch, var(--color-sand) 60%, transparent);
  }
</style>
```

- [ ] **Step 3: Build + DOM inspection**

Run: `pnpm build`

Expected: build succeeds.

Run: `pnpm dev`. Open `http://localhost:4321/` and inspect the DOM in DevTools. Expected:

- The `.face-back` `<div>` exists inside `.card-3d` with a `<h3>`, `<ul>` with 6 `<li>`, and a `<p>`.
- The page LOOKS identical to before (the back face is behind the front face, both share the same area).

Switch to `/en/` and confirm the title is "Skills" and all 6 labels are correct.

Stop the dev server.

- [ ] **Step 4: Suggested commit (wait for user approval)**

```bash
git add src/components/HeroPortraitCard.astro
git commit -m "feat(hero): add back face structure with skill gauges"
```

---

## Task 5: Add 3D perspective + flip CSS (no JS yet)

After this task, the flip animation is wired in CSS but is not triggered by any user interaction. We will validate the animation by manually toggling the `.is-flipped` class in DevTools.

**Files:**

- Modify: `src/components/HeroPortraitCard.astro`

- [ ] **Step 1: Replace the `<style>` block with the full 3D version**

Replace the entire existing `<style>` block in `HeroPortraitCard.astro` with:

```astro
<style>
  .card-perspective {
    display: block;
    width: 100%;
    perspective: 1200px;
  }

  .card-3d {
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    transform-style: preserve-3d;
    transition: transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-3d.is-flipped {
    transform: rotateY(180deg);
  }

  .face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .face-front {
    z-index: 2;
  }

  .face-back {
    z-index: 1;
    transform: rotateY(180deg);
    padding: 2rem;
    background: var(--color-ocean-deep);
    color: var(--color-sand);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Front face image fills the face */
  .face-front :global(picture),
  .face-front :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .back-title {
    font-family: var(--font-serif, 'Source Serif 4', serif);
    font-size: 1.25rem;
    margin: 0;
  }

  .skills-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .gauge-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.375rem;
  }

  .gauge-label {
    font-family: var(--font-sans, 'Geist', sans-serif);
    font-size: 0.875rem;
    color: var(--color-sand);
  }

  .gauge-value {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    color: color-mix(in oklch, var(--color-sand) 70%, transparent);
  }

  .gauge-track {
    height: 4px;
    border-radius: 9999px;
    background: color-mix(in oklch, var(--color-sand) 15%, transparent);
    overflow: hidden;
  }

  .gauge-fill {
    height: 100%;
    border-radius: 9999px;
    background: var(--color-coral);
    width: 0;
    transition: width 900ms ease-out;
    transition-delay: var(--stagger, 0ms);
  }

  .card-3d.is-flipped .gauge-fill {
    width: var(--level, 0%);
  }

  .back-hint {
    margin: auto 0 0 0;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.6875rem;
    color: color-mix(in oklch, var(--color-sand) 60%, transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    .card-3d {
      transform: none !important;
      transition: none;
    }
    .face {
      transition: opacity 150ms ease;
    }
    .card-3d:not(.is-flipped) .face-back {
      opacity: 0;
    }
    .card-3d.is-flipped .face-back {
      opacity: 1;
      transform: none;
    }
    .card-3d.is-flipped .face-front {
      opacity: 0;
    }
    .gauge-fill {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Build + manual flip via DevTools**

Run: `pnpm build` — expected to succeed.

Run: `pnpm dev`. Open `http://localhost:4321/`. Open DevTools, select the `.card-3d` element, and add the class `is-flipped` via the element styles panel.

Expected:

- The card rotates smoothly to reveal the back face with the 6 skill gauges.
- The bars fill in staggered (100ms each), reaching their `--level` values.
- The accent ocean block stays in place behind the card (does NOT rotate).
- The front face is hidden when flipped (no double image).

Toggle the class off — the card flips back and the bars empty.

In DevTools → Rendering panel, enable "Emulate CSS prefers-reduced-motion: reduce", reload, and repeat the toggle: the flip should now be an opacity crossfade with no rotation and bars instantly filled.

Stop the dev server.

- [ ] **Step 3: Suggested commit (wait for user approval)**

```bash
git add src/components/HeroPortraitCard.astro
git commit -m "feat(hero): add 3D flip CSS with reduced-motion fallback"
```

---

## Task 6: Wire the user interaction (hover, click, keyboard)

We replace the outer `<div class="card-perspective">` with a `<button>` and add an inline `<script>` to toggle the `.is-flipped` class on hover (mouse only), tap, and keyboard Enter/Space.

**Files:**

- Modify: `src/components/HeroPortraitCard.astro`

- [ ] **Step 1: Update the markup to use a `<button>`**

In the template section of `HeroPortraitCard.astro`, replace:

```astro
<div class="card-perspective">
  <div class="card-3d">
```

with:

```astro
<button
  type="button"
  class="card-perspective"
  aria-pressed="false"
  aria-label={t(locale, 'skillsAriaFlip')}
  data-flip-card
>
  <div class="card-3d" data-flip-inner>
```

And replace the closing:

```astro
  </div>
</div>
```

(the `</div>` that closes `.card-3d` and the `</div>` that closes `.card-perspective`)

with:

```astro
  </div>
</button>
```

Also: REMOVE the `aria-hidden="true"` from the `.face-back` div — we'll let the screen reader hear the back face content when it's revealed. The button itself announces the state change via `aria-pressed`.

- [ ] **Step 2: Reset native button styles inside the `<style>` block**

Find the `.card-perspective` rule and replace it with:

```css
  .card-perspective {
    display: block;
    width: 100%;
    perspective: 1200px;
    /* Reset native <button> defaults */
    background: transparent;
    border: 0;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card-perspective:focus-visible {
    outline: 2px solid var(--color-coral);
    outline-offset: 4px;
    border-radius: 0.5rem;
  }
```

- [ ] **Step 3: Add the inline `<script>` at the end of the component**

Append this AFTER the closing `</style>` tag in `HeroPortraitCard.astro`:

```astro
<script>
  function initHeroCard(button: HTMLButtonElement) {
    const inner = button.querySelector<HTMLElement>('[data-flip-inner]');
    if (!inner) return;

    const setFlipped = (flipped: boolean) => {
      button.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      inner.classList.toggle('is-flipped', flipped);
    };

    button.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') setFlipped(true);
    });

    button.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') setFlipped(false);
    });

    button.addEventListener('click', () => {
      const isFlipped = button.getAttribute('aria-pressed') === 'true';
      setFlipped(!isFlipped);
    });

    // Native <button> handles Enter/Space → click event, so no extra keyboard handler needed.
  }

  document
    .querySelectorAll<HTMLButtonElement>('[data-flip-card]')
    .forEach(initHeroCard);
</script>
```

- [ ] **Step 4: Build + interaction verification in browser**

Run: `pnpm build` — expected to succeed.

Run: `pnpm dev`. Open `http://localhost:4321/` in Chrome.

Verify all four interaction paths:

1. **Mouse hover**: hover the card → flips to back, gauges fill staggered. Move away → flips back.
2. **Mouse click**: click while hovered → the state stays (click toggles, hover already set it). Move away → unflips. (Acceptable: hover is the dominant input for mouse users; click is a fallback.)
3. **Touch (DevTools → toggle device toolbar → iPhone)**: tap the card → flips. Tap again → unflips. No residual hover state.
4. **Keyboard**: press Tab until the card has focus (coral 2px outline visible) → press Enter, card flips, `aria-pressed="true"`. Press Space, card unflips, `aria-pressed="false"`.

Verify the FR `/` and EN `/en/` both work and the `aria-label` is "Voir mes compétences" / "Show my skills" respectively (inspect the `<button>` in DevTools).

Stop the dev server.

- [ ] **Step 5: Suggested commit (wait for user approval)**

```bash
git add src/components/HeroPortraitCard.astro
git commit -m "feat(hero): wire flip interaction (hover, tap, keyboard)"
```

---

## Task 7: Add the flip affordance icon

A small `↻` icon in the bottom-right of the front face, visible only on hover/focus, hints that the card is interactive.

**Files:**

- Modify: `src/components/HeroPortraitCard.astro`

- [ ] **Step 1: Add the affordance markup inside `.face-front`**

Inside `<div class="face face-front">`, AFTER the `<picture>` block, add:

```astro
      <span class="flip-affordance" aria-hidden="true">↻</span>
```

- [ ] **Step 2: Add the affordance CSS rules**

Inside the `<style>` block, add these rules (anywhere after the `.face-front` rule):

```css
  .face-front {
    z-index: 2;
  }

  .flip-affordance {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: color-mix(in oklch, var(--color-ocean-deep) 60%, transparent);
    color: var(--color-sand);
    font-size: 0.875rem;
    line-height: 1;
    opacity: 0;
    transition: opacity 200ms ease;
    pointer-events: none;
  }

  .card-perspective:hover .flip-affordance,
  .card-perspective:focus-visible .flip-affordance {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .flip-affordance {
      transition: none;
    }
  }
```

> The duplicate `.face-front { z-index: 2; }` is intentional — if it already exists from Task 5, keep only one copy.

- [ ] **Step 3: Build + visual verification**

Run: `pnpm build` — expected to succeed.

Run: `pnpm dev`. Open `http://localhost:4321/`.

Expected:

- At rest, the front face shows the portrait only, no icon visible.
- On mouse hover (before the flip kicks in, the affordance is on the front face during the transition), the `↻` icon fades in for a moment, then hides as the back face takes over.
- On keyboard focus (Tab to the card without moving the mouse), the `↻` is visible.

Stop the dev server.

- [ ] **Step 4: Suggested commit (wait for user approval)**

```bash
git add src/components/HeroPortraitCard.astro
git commit -m "feat(hero): add flip affordance icon"
```

---

## Task 8: Final verification (golden path)

This task runs no code edits — only verification against the spec's acceptance criteria.

**Files:** none modified.

- [ ] **Step 1: Production build clean**

Run: `pnpm build 2>&1 | tee /tmp/hero-flip-build.log`

Expected: build succeeds. Scan `/tmp/hero-flip-build.log` for any new warnings related to `HeroPortraitCard`, `heroSkills`, or i18n.

- [ ] **Step 2: Run the dev server and walk the golden path**

Run: `pnpm dev`. Then in Chrome, verify each of these:

| # | Path | Expectation |
|---|------|-------------|
| 1 | `/` desktop hover | Card flips forward, 6 gauges fill staggered, "Compétences" title visible |
| 2 | `/` desktop leave | Card flips back to portrait |
| 3 | `/en/` desktop hover | Same flip, title "Skills", 6 EN labels |
| 4 | `/` mobile (DevTools touch emulation) | Tap toggles sticky, no double-fire |
| 5 | `/` keyboard only (Tab + Enter + Space) | Card focusable with coral ring, Enter/Space toggle flip |
| 6 | DevTools → Rendering → `prefers-reduced-motion: reduce` | Flip replaced by opacity crossfade, gauges instantly filled |
| 7 | DOM inspect at rest | `<button type="button" aria-pressed="false" aria-label="Voir mes compétences" ...>` |
| 8 | DOM inspect flipped | Same button with `aria-pressed="true"` |
| 9 | Visual: accent ocean block | Stays fixed during flip, does not rotate |

- [ ] **Step 3: Lighthouse a11y check**

In Chrome DevTools → Lighthouse → "Accessibility" only → Mobile + Desktop.

Run on `/` and `/en/`. Expected: a11y score remains **100** (no new violations).

- [ ] **Step 4: Stop the dev server and confirm clean working tree**

```bash
git status
```

Expected: nothing to commit (all task commits already made).

- [ ] **Step 5: Plan complete — final summary**

At this point the feature is functionally complete. Summary to share with user:

- 6 stacks displayed (Kubernetes 90, Docker 90, Terraform 85, Ansible 85, GitHub Actions 85, Python 75).
- To change a level: edit `src/data/heroSkills.ts` (one number).
- To rename or translate a label: edit `src/i18n/fr.ts` and `src/i18n/en.ts`.
- To add a 7th skill: append to both files (1 line per file).

---

## Self-Review

### Spec coverage

| Spec section | Covered by |
|--------------|------------|
| Goal: flip card on hover/tap/keyboard | Tasks 5, 6 |
| 6 skills as horizontal gauges | Tasks 1, 2, 4 |
| Accent block stays fixed | Task 3 (component scope) + spec note |
| `src/data/heroSkills.ts` | Task 1 |
| i18n keys | Task 2 |
| `HeroPortraitCard.astro` structure | Tasks 3, 4, 5, 6, 7 |
| `Hero.astro` integration | Task 3 |
| Front face identical to current | Task 3 verification |
| Back face design (ocean-deep, sand text) | Tasks 4, 5 |
| 3D flip with `cubic-bezier(0.4, 0, 0.2, 1)` 700ms | Task 5 |
| Staggered gauge fill 900ms + 100ms × index | Task 5 |
| `prefers-reduced-motion: reduce` crossfade | Task 5 |
| Pointer triggers (mouse hover, touch tap) | Task 6 |
| Keyboard (Enter/Space via native `<button>`) | Task 6 |
| `aria-pressed` sync | Task 6 |
| `aria-label` localized | Task 6 |
| Focus ring | Task 6 |
| Affordance icon `↻` | Task 7 |
| Golden path verification | Task 8 |

All spec sections covered.

### Type and naming consistency

- `data-flip-card` (button) and `data-flip-inner` (card-3d): used consistently in Task 6 markup and script. ✓
- `HeroSkill['key']` enum values match `labelKey(key)` mapping: `kubernetes` → `skillKubernetes`, etc. ✓
- CSS variable names (`--level`, `--stagger`) declared inline in markup (Task 4) and consumed in CSS (Task 5). ✓
- Token references (`--color-ocean-deep`, `--color-sand`, `--color-coral`) verified against `src/styles/global.css:21-28`. ✓

### Edge cases handled

- `level` out of [0, 100] range: `clamp` in component frontmatter defends against typos in `heroSkills.ts`. ✓
- JS fails / disabled: button is inert, front face renders, no broken state. ✓
- Touch device with residual `pointerleave` after `tap`: `pointerType === 'mouse'` filter in Task 6 script. ✓

No placeholders found. Plan ready for execution.
