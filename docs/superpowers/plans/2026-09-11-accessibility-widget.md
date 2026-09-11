# Accessibility Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 10-feature accessibility toolbar on every page of the site, in both locales, expressed through the existing `--ink`/`--ground` token system so it does not disfigure the monochrome design.

**Architecture:** An Astro component renders the button and panel server-side so every label reaches `t(locale, …)`. A TypeScript module in `src/scripts/ui/` binds behaviour and writes `tp-a11y-*` classes onto `<html>`. A dedicated stylesheet turns those classes into overrides — mostly by redefining CSS variables, only falling back to `!important` selectors where no variable covers the case. Two features reach past CSS into the three.js home via a `document` event.

**Tech Stack:** Astro 5, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/vite`), three.js 0.186, Lenis. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-11-accessibility-widget-design.md`

## Global Constraints

- **Package manager is `pnpm`.** Never `npm` or `yarn`.
- **No new dependencies and no new test runner.** Verification is `astro check`, `pnpm build`, the `scripts/` checkers, and Playwright against the real page.
- **Language is English everywhere in code** — identifiers, comments, file names. User-facing strings are French and English, and live only in `src/i18n/fr.ts` and `src/i18n/en.ts`.
- **Every i18n key must be added to BOTH `fr.ts` and `en.ts`.** A key in one file only is a build-time type error.
- **Never hardcode an absolute URL.** Not relevant to this feature, but it is the repo's standing rule.
- **Commits use Conventional Commits.** The repo policy is that commits are never made automatically — **confirm with the user before the first commit of this branch**, then proceed per task.
- **Branch:** `feat/accessibility-widget` (already created).
- **Storage keys** are all prefixed `tp-a11y-`, matching the existing `tp-theme`.
- **CSS classes** are all prefixed `tp-a11y-`.
- **Source-order dependency:** `src/styles/a11y.css` is imported LAST in `global.css`, and its self-exemption block (Task 9) is the LAST thing in that file. Several overrides rely on this ordering. Do not reorder.

### Canonical names (used across tasks)

| Feature id | Storage key | Class(es) on `<html>` | Type |
|---|---|---|---|
| `fontScale` | `tp-a11y-font` | `tp-a11y-font-115` / `-130` / `-150` | step |
| `lineHeight` | `tp-a11y-lh` | `tp-a11y-lh-130` / `-160` | step |
| `alignLeft` | `tp-a11y-align` | `tp-a11y-align-left` | toggle |
| `readableFont` | `tp-a11y-readable` | `tp-a11y-readable-font` | toggle |
| `contrast` | `tp-a11y-contrast` | `tp-a11y-contrast` | toggle |
| `hideImages` | `tp-a11y-hide-images` | `tp-a11y-hide-images` | toggle |
| `pause` | `tp-a11y-pause` | `tp-a11y-pause` | toggle |
| `links` | `tp-a11y-links` | `tp-a11y-links` | toggle |
| `mask` | `tp-a11y-mask` | `tp-a11y-mask` | toggle |
| `focus` | `tp-a11y-focus` | `tp-a11y-focus` | toggle |

Toggles store `"1"` or are removed. Steps store the class suffix (`"115"`, `"130"`, `"150"`, `"160"`) or are removed.

---

### Task 1: Foundations — i18n keys and rem type primitives

Nothing is visible after this task. It makes the ground ready: the 17 strings the panel needs, and the six hardcoded pixel font-sizes converted to rem so the text-scaling feature in Task 4 can actually reach them.

**Files:**
- Modify: `src/i18n/fr.ts` (append before the closing `} as const;`)
- Modify: `src/i18n/en.ts` (append before the closing `} as const;`)
- Modify: `src/styles/global.css:126`, `:133`, `:152`, `:278`, `:322`, `:341`

**Interfaces:**
- Consumes: nothing.
- Produces: 17 translation keys, usable as `t(locale, 'a11yTitle')` etc. Task 2 renders all of them. The `TranslationKey` type derives from `fr.ts`, so `fr.ts` is the source of truth for the key set.

- [ ] **Step 1: Add the 17 keys to `src/i18n/fr.ts`**

Append immediately before the final `} as const;`:

```ts
  // Accessibility widget
  a11yOpen: 'Ouvrir les paramètres d\'accessibilité',
  a11yTitle: 'Accessibilité',
  a11yReset: 'Réinitialiser',
  a11yClose: 'Fermer',
  a11yCatText: 'Texte',
  a11yCatVisual: 'Visuel',
  a11yCatOrientation: 'Orientation',
  a11yFontSize: 'Taille de texte',
  a11yLineHeight: 'Hauteur de ligne',
  a11yAlignLeft: 'Alignement du texte',
  a11yReadableFont: 'Police lisible',
  a11yContrast: 'Contraste',
  a11yHideImages: 'Masquer les images',
  a11yPauseAnimations: 'Pause animations',
  a11yHighlightLinks: 'Mettre en évidence les liens',
  a11yReadingMask: 'Masque de lecture',
  a11yFocusOutline: 'Contour du focus',
```

- [ ] **Step 2: Add the same 17 keys to `src/i18n/en.ts`**

Append immediately before the final `} as const;`:

```ts
  // Accessibility widget
  a11yOpen: 'Open accessibility settings',
  a11yTitle: 'Accessibility',
  a11yReset: 'Reset',
  a11yClose: 'Close',
  a11yCatText: 'Text',
  a11yCatVisual: 'Visual',
  a11yCatOrientation: 'Orientation',
  a11yFontSize: 'Text size',
  a11yLineHeight: 'Line height',
  a11yAlignLeft: 'Text alignment',
  a11yReadableFont: 'Readable font',
  a11yContrast: 'Contrast',
  a11yHideImages: 'Hide images',
  a11yPauseAnimations: 'Pause animations',
  a11yHighlightLinks: 'Highlight links',
  a11yReadingMask: 'Reading mask',
  a11yFocusOutline: 'Focus outline',
```

- [ ] **Step 3: Convert the six pixel font-sizes in `src/styles/global.css` to rem**

These are the only typographic values on the site that a root font-size change cannot reach. `11px → 0.6875rem` and `10px → 0.625rem` are exact at the 16px default, so nothing moves visually.

| Line | Rule | Change |
|---|---|---|
| 126 | `.tp-label` | `font-size: 11px` → `font-size: 0.6875rem` |
| 133 | `.tp-label-sm` | `font-size: 10px` → `font-size: 0.625rem` |
| 152 | `.tp-link` | `font-size: 11px` → `font-size: 0.6875rem` |
| 278 | `.tp-row-label` | `font-size: 11px` → `font-size: 0.6875rem` |
| 322 | `.tp-button` | `font-size: 11px` → `font-size: 0.6875rem` |
| 341 | (mono bordered control) | `font-size: 11px` → `font-size: 0.6875rem` |

Add this comment above `.tp-label` at line 125 so the reason survives:

```css
/* rem, not px: the accessibility text-scaling feature moves the root font-size,
   and a px value here would be the one label that refuses to grow with it. */
```

- [ ] **Step 4: Verify the types and the build**

Run: `pnpm exec astro check`
Expected: 0 errors. If `en.ts` is missing a key that `fr.ts` has, this is where it fails.

Run: `pnpm build`
Expected: build completes.

- [ ] **Step 5: Verify nothing moved visually**

Run: `pnpm dev`, open `http://localhost:4321/` and `http://localhost:4321/blog/`.
Expected: labels, buttons and HUD text are pixel-identical to before. `0.6875rem × 16px = 11px` exactly, so any visible change means a rem was applied to the wrong rule.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/fr.ts src/i18n/en.ts src/styles/global.css
git commit -m "chore(a11y): add widget translation keys and make type primitives scalable"
```

---

### Task 2: The widget markup and its own styles

Renders a fully styled, completely inert panel. No behaviour yet — the button does nothing, and that is the correct end state for this task. This is the task where the visual language gets settled, so it is the one worth reviewing with your eyes.

**Files:**
- Create: `src/components/A11yWidget.astro`
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: the 17 keys from Task 1.
- Produces: the DOM contract Task 3 binds to —
  - `#tp-a11y-open` — the floating button
  - `#tp-a11y-panel` — the dialog
  - `#tp-a11y-overlay` — the scrim
  - `#tp-a11y-reset`, `#tp-a11y-close` — header buttons
  - `button[data-a11y-feature="<id>"]` — one per feature, `<id>` from the canonical-names table
  - `[data-a11y-steps]` on step features, holding the comma-separated step suffixes
  - `.tp-a11y-dot` — step indicator dots, rendered one per step
  - the whole widget wrapped in `.tp-a11y`

- [ ] **Step 1: Create `src/components/A11yWidget.astro`**

```astro
---
import { type Locale, t } from '../i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;

/* The registry is rendered, not scripted: every label goes through `t()`, and
   the behaviour module in `scripts/ui/a11y.ts` reads ids back off the markup.
   `steps` holds the class suffixes; the unscaled first step has no class. */
const FEATURES = [
  { cat: 'text', id: 'fontScale', key: 'a11yFontSize', steps: ['115', '130', '150'] },
  { cat: 'text', id: 'lineHeight', key: 'a11yLineHeight', steps: ['130', '160'] },
  { cat: 'text', id: 'alignLeft', key: 'a11yAlignLeft' },
  { cat: 'text', id: 'readableFont', key: 'a11yReadableFont' },
  { cat: 'visual', id: 'contrast', key: 'a11yContrast' },
  { cat: 'visual', id: 'hideImages', key: 'a11yHideImages' },
  { cat: 'visual', id: 'pause', key: 'a11yPauseAnimations' },
  { cat: 'orientation', id: 'links', key: 'a11yHighlightLinks' },
  { cat: 'orientation', id: 'mask', key: 'a11yReadingMask' },
  { cat: 'orientation', id: 'focus', key: 'a11yFocusOutline' },
] as const;

const CATEGORIES = [
  { id: 'text', key: 'a11yCatText' },
  { id: 'visual', key: 'a11yCatVisual' },
  { id: 'orientation', key: 'a11yCatOrientation' },
] as const;
---

<div class="tp-a11y">
  <button
    id="tp-a11y-open"
    type="button"
    data-cursor="link"
    class="tp-a11y-open"
    aria-label={t(locale, 'a11yOpen')}
    aria-expanded="false"
    aria-controls="tp-a11y-panel"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm3.5 5h-7a1.5 1.5 0 0 0 0 3H10v4.5l-2.5 5a1 1 0 0 0 1.79.89L12 15l2.71 5.39a1 1 0 0 0 1.79-.89l-2.5-5V10h1.5a1.5 1.5 0 0 0 0-3Z"
      />
    </svg>
  </button>

  <div id="tp-a11y-overlay" class="tp-a11y-overlay" hidden></div>

  <div
    id="tp-a11y-panel"
    class="tp-a11y-panel"
    role="dialog"
    aria-modal="true"
    aria-label={t(locale, 'a11yTitle')}
    hidden
  >
    <div class="tp-a11y-head">
      <span class="tp-label">{t(locale, 'a11yTitle')}</span>
      <div class="tp-a11y-head-actions">
        <button id="tp-a11y-reset" type="button" data-cursor="link" aria-label={t(locale, 'a11yReset')}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z"
            />
          </svg>
        </button>
        <button id="tp-a11y-close" type="button" data-cursor="link" aria-label={t(locale, 'a11yClose')}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="tp-a11y-body">
      {CATEGORIES.map((cat) => (
        <section class="tp-a11y-section">
          <h2 class="tp-label-sm tp-a11y-section-title">{t(locale, cat.key)}</h2>
          <div class="tp-a11y-grid">
            {FEATURES.filter((f) => f.cat === cat.id).map((f) => (
              <button
                type="button"
                data-cursor="link"
                class="tp-a11y-feature"
                data-a11y-feature={f.id}
                data-a11y-steps={'steps' in f ? f.steps.join(',') : undefined}
                aria-pressed="false"
              >
                <span class="tp-a11y-feature-label">{t(locale, f.key)}</span>
                {'steps' in f && (
                  <span class="tp-a11y-dots" aria-hidden="true">
                    {f.steps.map(() => <span class="tp-a11y-dot"></span>)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
</div>
```

> Note on the heading: `check-html.py` enforces exactly one `<h1>` per page. The
> section titles are `<h2>`, which is correct and does not trip that check.

- [ ] **Step 2: Add the widget's own styles to the same file**

Append to `src/components/A11yWidget.astro`. These are Astro-scoped, so they cannot leak; the global override rules live in `a11y.css` instead (Task 4 onward).

```astro
<style>
  /* Z-index sits in the gap the site leaves free: above the nav (60) and the
     home veil (70), below the custom cursor (90) and the loader (100). */
  .tp-a11y-open {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 80;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(var(--ground));
    color: rgb(var(--ink));
    border: 1px solid rgb(var(--ink) / 0.35);
    border-right: 0;
    padding: 0;
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  .tp-a11y-open:hover,
  .tp-a11y-open:focus-visible {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .tp-a11y-open svg {
    width: 24px;
    height: 24px;
    display: block;
  }

  .tp-a11y-overlay {
    position: fixed;
    inset: 0;
    z-index: 84;
    background: rgb(var(--ground) / 0.72);
  }

  /* Required, not redundant. The UA's `[hidden] { display: none }` is weaker
     than the author `display: block/flex` on these same elements, so without
     this the panel renders OPEN on first paint despite carrying the attribute. */
  .tp-a11y-overlay[hidden],
  .tp-a11y-panel[hidden] {
    display: none;
  }

  .tp-a11y-panel {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 85;
    width: 340px;
    max-width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: rgb(var(--ground));
    border-left: 1px solid rgb(var(--ink) / 0.22);
    overflow-y: auto;
  }

  .tp-a11y-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 22px 20px;
    border-bottom: 1px solid rgb(var(--ink) / 0.22);
    flex-shrink: 0;
  }

  .tp-a11y-head-actions {
    display: flex;
    gap: 8px;
  }

  .tp-a11y-head-actions button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: rgb(var(--ink));
    border: 1px solid rgb(var(--ink) / 0.22);
    padding: 0;
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  .tp-a11y-head-actions button:hover,
  .tp-a11y-head-actions button:focus-visible {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .tp-a11y-head-actions svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  .tp-a11y-body {
    padding: 8px 20px 28px;
  }

  .tp-a11y-section {
    margin-top: 24px;
  }

  .tp-a11y-section-title {
    margin: 0 0 12px;
    opacity: 0.62;
    font-weight: 400;
  }

  .tp-a11y-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  .tp-a11y-feature {
    min-height: 76px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 12px;
    background: transparent;
    color: rgb(var(--ink));
    border: 1px solid rgb(var(--ink) / 0.22);
    text-align: left;
    transition: color 0.3s ease, border-color 0.3s ease;
  }

  .tp-a11y-feature:hover,
  .tp-a11y-feature:focus-visible {
    border-color: rgb(var(--ink) / 0.5);
  }

  .tp-a11y-feature[aria-pressed='true'] {
    border-color: var(--color-accent-solid);
    color: var(--color-accent);
  }

  .tp-a11y-feature-label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    line-height: 1.35;
    text-transform: uppercase;
  }

  .tp-a11y-dots {
    display: flex;
    gap: 4px;
  }

  .tp-a11y-dot {
    width: 6px;
    height: 6px;
    border: 1px solid rgb(var(--ink) / 0.4);
  }

  .tp-a11y-dot.is-on {
    background: var(--color-accent-solid);
    border-color: var(--color-accent-solid);
  }

  /* A finger needs 44px. The panel goes full width rather than squeezing the
     two-up grid into something nobody can hit. */
  @media (max-width: 768px) {
    .tp-a11y-panel {
      width: 100%;
      border-left: 0;
    }

    .tp-a11y-open {
      width: 44px;
      height: 44px;
    }
  }
</style>
```

- [ ] **Step 3: Mount the widget in `src/layouts/BaseLayout.astro`**

Add the import alongside the others at the top of the frontmatter:

```ts
import A11yWidget from '../components/A11yWidget.astro';
```

Then place the element immediately before the closing `</body>` — after the `{!home && <BlogScripts />}` line:

```astro
    <A11yWidget locale={locale} />
```

It goes last so it is the final thing in the tab order before the page ends, and so its stacking context is not trapped inside `<main>`.

- [ ] **Step 4: Verify the build and the markup**

Run: `pnpm exec astro check`
Expected: 0 errors.

Run: `pnpm build`
Expected: build completes.

Run: `python3 scripts/check-html.py dist`
Expected: passes. One `<h1>` per page still holds (the widget adds only `<h2>`), and the internal-link count is unchanged because the widget renders no `<a>`.

- [ ] **Step 5: Verify the panel visually**

Run `pnpm dev`. In devtools, remove the `hidden` attribute from `#tp-a11y-panel` and `#tp-a11y-overlay` by hand.

Expected: the panel reads as part of the site — mono uppercase labels, square borders, `--ground` background. Check it in **both themes** using the existing theme toggle, and at 375px width. The button sits at the right edge, vertically centred, on both `/` and `/blog/`.

- [ ] **Step 6: Commit**

```bash
git add src/components/A11yWidget.astro src/layouts/BaseLayout.astro
git commit -m "feat(a11y): render the accessibility panel markup and styles"
```

---

### Task 3: Behaviour — state, persistence, panel, focus trap

The panel becomes operable. Toggling a feature writes a `tp-a11y-*` class onto `<html>` and persists it, but **no override CSS exists yet**, so the page will not change appearance. That is the expected end state: this task is verified by inspecting `<html>`'s class list, not by looking at the page.

**Files:**
- Create: `src/scripts/ui/a11y.ts`
- Modify: `src/components/A11yWidget.astro` (add the `<script>` at the end)
- Modify: `src/layouts/BaseLayout.astro:43-49` (extend the pre-paint inline script)

**Interfaces:**
- Consumes: the DOM contract from Task 2.
- Produces:
  - `export const A11Y_EVENT = 'tp-a11ychange'` — dispatched on `document` after any change, `CustomEvent<A11yState>`.
  - `export interface A11yState { pause: boolean; hideImages: boolean }` — the subset the scene cares about.
  - `export function initA11y(): void` — called once from the component script.
  - `export function onA11yChange(fn: (s: A11yState) => void): void` — subscribe, and fire once immediately with the current state. Task 6 (`scene/index.ts`) is the only consumer. Mirrors `onThemeChange` in `theme.ts`.

- [ ] **Step 1: Create `src/scripts/ui/a11y.ts`**

```ts
/**
 * Accessibility toolbar behaviour. The markup is rendered by
 * `components/A11yWidget.astro` — this module only binds to it, so every label
 * stays in the i18n files. State lives as `tp-a11y-*` classes on <html>; the
 * head script in `BaseLayout` stamps them before the first paint, and this
 * module owns every change after that.
 */

const PREFIX = 'tp-a11y-';

interface Feature {
  /** localStorage key, minus nothing — stored verbatim. */
  key: string;
  /** Class written to <html>. Steps append the step suffix. */
  cssClass: string;
}

/** Ids match `data-a11y-feature` in the markup. */
const FEATURES: Record<string, Feature> = {
  fontScale: { key: 'tp-a11y-font', cssClass: 'tp-a11y-font-' },
  lineHeight: { key: 'tp-a11y-lh', cssClass: 'tp-a11y-lh-' },
  alignLeft: { key: 'tp-a11y-align', cssClass: 'tp-a11y-align-left' },
  readableFont: { key: 'tp-a11y-readable', cssClass: 'tp-a11y-readable-font' },
  contrast: { key: 'tp-a11y-contrast', cssClass: 'tp-a11y-contrast' },
  hideImages: { key: 'tp-a11y-hide-images', cssClass: 'tp-a11y-hide-images' },
  pause: { key: 'tp-a11y-pause', cssClass: 'tp-a11y-pause' },
  links: { key: 'tp-a11y-links', cssClass: 'tp-a11y-links' },
  mask: { key: 'tp-a11y-mask', cssClass: 'tp-a11y-mask' },
  focus: { key: 'tp-a11y-focus', cssClass: 'tp-a11y-focus' },
};

export interface A11yState {
  pause: boolean;
  hideImages: boolean;
}

/** Fired on `document` after any change, for the WebGL scene. */
export const A11Y_EVENT = 'tp-a11ychange';

const root = document.documentElement;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private browsing refuses the read; the session simply starts unset.
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Private browsing refuses the write; the change still holds for this page.
  }
}

function currentState(): A11yState {
  return {
    pause: root.classList.contains(FEATURES.pause.cssClass),
    hideImages: root.classList.contains(FEATURES.hideImages.cssClass),
  };
}

function announce(): void {
  document.dispatchEvent(new CustomEvent<A11yState>(A11Y_EVENT, { detail: currentState() }));
}

/** Steps come off the markup so the panel stays the single source of truth. */
function stepsOf(btn: HTMLButtonElement): string[] {
  const raw = btn.dataset.a11ySteps;
  return raw ? raw.split(',') : [];
}

/** Index 0 is the unscaled state and carries no class. */
function currentStep(id: string, steps: string[]): number {
  const stored = read(FEATURES[id].key);
  const i = stored ? steps.indexOf(stored) : -1;
  return i === -1 ? 0 : i + 1;
}

function paintButton(btn: HTMLButtonElement, id: string): void {
  const steps = stepsOf(btn);

  if (steps.length > 0) {
    const step = currentStep(id, steps);
    btn.setAttribute('aria-pressed', String(step > 0));
    btn.setAttribute('aria-valuenow', String(step));
    btn.setAttribute('aria-valuetext', `${step + 1} / ${steps.length + 1}`);
    btn.querySelectorAll<HTMLElement>('.tp-a11y-dot').forEach((dot, i) => {
      dot.classList.toggle('is-on', i < step);
    });
    return;
  }

  btn.setAttribute('aria-pressed', String(root.classList.contains(FEATURES[id].cssClass)));
}

function applyStep(id: string, steps: string[], step: number): void {
  const { key, cssClass } = FEATURES[id];
  steps.forEach((s) => root.classList.remove(cssClass + s));
  if (step === 0) {
    write(key, null);
    return;
  }
  root.classList.add(cssClass + steps[step - 1]);
  write(key, steps[step - 1]);
}

function toggle(btn: HTMLButtonElement, id: string): void {
  const steps = stepsOf(btn);

  if (steps.length > 0) {
    applyStep(id, steps, (currentStep(id, steps) + 1) % (steps.length + 1));
  } else {
    const { key, cssClass } = FEATURES[id];
    const on = root.classList.toggle(cssClass);
    write(key, on ? '1' : null);
  }

  paintButton(btn, id);
  announce();
}

function resetAll(buttons: NodeListOf<HTMLButtonElement>): void {
  buttons.forEach((btn) => {
    const id = btn.dataset.a11yFeature;
    if (!id || !FEATURES[id]) return;
    const steps = stepsOf(btn);
    if (steps.length > 0) applyStep(id, steps, 0);
    else {
      root.classList.remove(FEATURES[id].cssClass);
      write(FEATURES[id].key, null);
    }
    paintButton(btn, id);
  });
  announce();
}

export function initA11y(): void {
  const openBtn = document.getElementById('tp-a11y-open');
  const panel = document.getElementById('tp-a11y-panel');
  const overlay = document.getElementById('tp-a11y-overlay');
  const resetBtn = document.getElementById('tp-a11y-reset');
  const closeBtn = document.getElementById('tp-a11y-close');
  if (!openBtn || !panel || !overlay || !resetBtn || !closeBtn) return;

  const buttons = panel.querySelectorAll<HTMLButtonElement>('[data-a11y-feature]');

  buttons.forEach((btn) => {
    const id = btn.dataset.a11yFeature;
    if (!id || !FEATURES[id]) return;
    paintButton(btn, id);
    btn.addEventListener('click', () => toggle(btn, id));
  });

  resetBtn.addEventListener('click', () => resetAll(buttons));

  const focusable = (): HTMLElement[] =>
    Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled])'));

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  function open(): void {
    panel!.hidden = false;
    overlay!.hidden = false;
    openBtn!.setAttribute('aria-expanded', 'true');
    focusable()[0]?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(): void {
    panel!.hidden = true;
    overlay!.hidden = true;
    openBtn!.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    openBtn!.focus();
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

/** Run `fn` on every change, and once now with the current state. */
export function onA11yChange(fn: (s: A11yState) => void): void {
  document.addEventListener(A11Y_EVENT, (e) => fn((e as CustomEvent<A11yState>).detail));
  fn(currentState());
}

/** Exported for the pre-paint script's benefit — keeps the prefix in one place. */
export { PREFIX };
```

- [ ] **Step 2: Wire the script into `src/components/A11yWidget.astro`**

Append at the very end of the file, after the `<style>` block:

```astro
<script>
  import { initA11y } from '../scripts/ui/a11y';

  initA11y();
</script>
```

- [ ] **Step 3: Extend the pre-paint script in `src/layouts/BaseLayout.astro`**

Replace the existing inline `<script is:inline>` block at lines 43-49 with:

```astro
    <script is:inline>
      try {
        if (localStorage.getItem('tp-theme') === 'light') document.documentElement.dataset.theme = 'light';

        var flags = {
          'tp-a11y-align': 'tp-a11y-align-left',
          'tp-a11y-readable': 'tp-a11y-readable-font',
          'tp-a11y-contrast': 'tp-a11y-contrast',
          'tp-a11y-hide-images': 'tp-a11y-hide-images',
          'tp-a11y-pause': 'tp-a11y-pause',
          'tp-a11y-links': 'tp-a11y-links',
          'tp-a11y-mask': 'tp-a11y-mask',
          'tp-a11y-focus': 'tp-a11y-focus',
        };
        for (var k in flags) {
          if (localStorage.getItem(k) === '1') document.documentElement.classList.add(flags[k]);
        }
        // Validated, never interpolated raw: a tampered value must not become a class.
        var font = localStorage.getItem('tp-a11y-font');
        if (/^(115|130|150)$/.test(font)) document.documentElement.classList.add('tp-a11y-font-' + font);
        var lh = localStorage.getItem('tp-a11y-lh');
        if (/^(130|160)$/.test(lh)) document.documentElement.classList.add('tp-a11y-lh-' + lh);
      } catch (e) {
        /* Private browsing refuses the read; the defaults are correct anyway. */
      }
    </script>
```

Update the comment above it to say it now carries both the theme and the accessibility preferences.

- [ ] **Step 4: Verify the build**

Run: `pnpm exec astro check`
Expected: 0 errors.

Run: `pnpm build`
Expected: build completes.

- [ ] **Step 5: Verify the behaviour in the browser**

Run `pnpm dev` and open `http://localhost:4321/blog/`.

Check each of these:
1. Clicking the edge button opens the panel; the overlay appears; focus lands on the first control.
2. `Escape` closes it and focus returns to the edge button.
3. `Tab` from the last control wraps to the first; `Shift+Tab` from the first wraps to the last.
4. Clicking `Contraste` sets `aria-pressed="true"` and adds `tp-a11y-contrast` to `<html>`. **The page does not change appearance — that is correct at this stage.**
5. Clicking `Taille de texte` four times cycles `<html>` through `tp-a11y-font-115` → `-130` → `-150` → no class, with the dots filling 1, 2, 3, then none.
6. Reload with `Contraste` and `Taille de texte` at step 2 active: `<html>` carries `tp-a11y-contrast tp-a11y-font-130` **in the first painted frame**, and the panel buttons come back already showing their active state.
7. Clicking the reset button clears every class and every `tp-a11y-*` key from localStorage.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/ui/a11y.ts src/components/A11yWidget.astro src/layouts/BaseLayout.astro
git commit -m "feat(a11y): toggle, persist and restore accessibility preferences"
```

---

### Task 4: Text overrides

The first task where the page actually changes. Creates the override stylesheet and implements the four Texte features.

**Files:**
- Create: `src/styles/a11y.css`
- Modify: `src/styles/global.css` (add the import)

**Interfaces:**
- Consumes: the `tp-a11y-*` classes Task 3 writes onto `<html>`.
- Produces: `src/styles/a11y.css`, which Tasks 5-9 append to in order.

- [ ] **Step 1: Create `src/styles/a11y.css`**

```css
/* ============================================================================
   Accessibility overrides — driven by the `tp-a11y-*` classes that
   `scripts/ui/a11y.ts` writes onto <html>.

   Wherever the site's token system can express an override, it is expressed as
   a variable redefinition rather than as an `!important` selector. That is why
   this file is a fraction of the size of the one it was ported from: the
   original had no tokens and had to enumerate selectors per feature.

   The self-exemption block at the END of this file protects the widget from
   its own rules. Source order matters — keep it last.
   ========================================================================= */

/* ---- Text size -----------------------------------------------------------
   The root font-size, not per-tag overrides. The site's headings are
   `clamp(2rem, 5.6vw, 4.6rem)`: moving the root moves both rem bounds and
   leaves the vw term alone, so type grows along its own fluid curve instead of
   being replaced by a fixed ladder. Tailwind's rem-based utilities follow for
   free, and Task 1 converted the six px primitives that would not have. */
html.tp-a11y-font-115 { font-size: 115%; }
html.tp-a11y-font-130 { font-size: 130%; }
html.tp-a11y-font-150 { font-size: 150%; }

/* ---- Line height ---------------------------------------------------------
   1.55 and 1.7 are the site's own body and prose values; the class multiplies
   them rather than replacing them. Headings carry inline `line-height` from the
   mockup, so they need the override to win. */
html.tp-a11y-lh-130 { --tp-a11y-lh: 1.3; }
html.tp-a11y-lh-160 { --tp-a11y-lh: 1.6; }

html[class*='tp-a11y-lh-'] body {
  line-height: calc(1.55 * var(--tp-a11y-lh));
}

html[class*='tp-a11y-lh-'] .prose p,
html[class*='tp-a11y-lh-'] .prose li {
  line-height: calc(1.7 * var(--tp-a11y-lh)) !important;
}

html[class*='tp-a11y-lh-'] h1,
html[class*='tp-a11y-lh-'] h2,
html[class*='tp-a11y-lh-'] h3,
html[class*='tp-a11y-lh-'] h4 {
  line-height: calc(1.15 * var(--tp-a11y-lh)) !important;
}

/* ---- Text alignment ------------------------------------------------------ */
html.tp-a11y-align-left body * {
  text-align: left !important;
}

/* ---- Readable font -------------------------------------------------------
   One rule, because the fonts are variables. The tracking goes too: 0.3em on
   the mono labels is a legibility cost this feature exists to remove. */
html.tp-a11y-readable-font {
  --font-sans: Arial, Helvetica, sans-serif;
  --font-mono: Consolas, 'Courier New', monospace;
}

html.tp-a11y-readable-font body * {
  letter-spacing: normal !important;
  font-style: normal !important;
}
```

- [ ] **Step 2: Import it from `src/styles/global.css`**

Add as the **last** `@import` at the top of the file, after the fontsource imports:

```css
/* Last on purpose: its self-exemption block has to outrank everything above. */
@import './a11y.css';
```

- [ ] **Step 3: Verify the build**

Run: `pnpm exec astro check` — Expected: 0 errors.
Run: `pnpm build` — Expected: build completes.

- [ ] **Step 4: Verify each feature in the browser**

Run `pnpm dev`, open `http://localhost:4321/blog/` and a blog post.

1. **Taille de texte** at each of the 3 steps: body text and headings both grow. Headings grow *smoothly*, not in jumps — if a heading snaps to a fixed size, a per-tag override has crept in. The nav and mono labels grow too (this is what Task 1 bought).
2. **Hauteur de ligne** at both steps: paragraph spacing opens up; headings stay readable rather than collapsing.
3. **Alignement du texte**: any centred block becomes left-aligned.
4. **Police lisible**: Space Grotesk and JetBrains Mono are replaced by Arial and Consolas; the uppercase labels lose their wide tracking.
5. Toggle all four on at once and confirm the page is still usable — no overlapping text, no clipped headings.
6. **The panel itself is expected to be affected at this stage.** Task 9 fixes that. Note anything that looks broken inside the panel, but do not fix it here.

- [ ] **Step 5: Commit**

```bash
git add src/styles/a11y.css src/styles/global.css
git commit -m "feat(a11y): text size, line height, alignment and readable font"
```

---

### Task 5: Contrast and hide-images

**Files:**
- Modify: `src/styles/a11y.css` (append)

**Interfaces:**
- Consumes: `tp-a11y-contrast`, `tp-a11y-hide-images` on `<html>`; the `#tp-gl`, `#tp-scrim`, `#tp-veil`, `#tp-projects`, `#tp-work` ids from the home; the `.tp-sr-grid` class.
- Produces: nothing new.

- [ ] **Step 1: Append the contrast block to `src/styles/a11y.css`**

```css
/* ---- Contrast ------------------------------------------------------------
   A modifier on the current theme, not a forced black-on-white: dark stays
   dark and paper stays paper, both pushed to their pure extremes. This is the
   clearest payoff of the two-triplet token system — the ported original needed
   eight `!important` selector blocks for the same result.

   `--color-accent` becomes ink because no green clears 4.5:1 against both pure
   grounds; `--color-accent-solid` keeps the lime for fills, where text contrast
   does not apply. That is the split the light theme already makes. */
html.tp-a11y-contrast {
  --ink: 255 255 255;
  --ground: 0 0 0;
  --color-bg-alt: #000000;
  --color-text-muted: rgb(var(--ink));
  --color-text-light: rgb(var(--ink));
  --color-border: rgb(var(--ink) / 0.6);
  --color-accent: rgb(var(--ink));
  --color-accent-hover: rgb(var(--ink));
}

html[data-theme='light'].tp-a11y-contrast {
  --ink: 0 0 0;
  --ground: 255 255 255;
  --color-bg-alt: #ffffff;
}

/* The mockup dims secondary copy with inline `opacity`, which no token reaches.
   Contrast is exactly the setting where that dimming must not survive. */
html.tp-a11y-contrast main :is(p, li, span, a, h1, h2, h3, h4, time) {
  opacity: 1 !important;
}

/* ---- Hide images ---------------------------------------------------------
   The home's projects are a WebGL canvas, not <img>, so hiding media alone
   would leave the reader with an empty page. The canvas goes and the existing
   `.tp-sr-grid` fallback is revealed — it is already built, already in the
   accessibility tree, and already the no-WebGL path. These rules mirror the
   <noscript> block in `components/home/SceneLayer.astro`; if that block
   changes, this one has to change with it. */
html.tp-a11y-hide-images :is(img, picture, video, [role='img']) {
  visibility: hidden !important;
}

html.tp-a11y-hide-images :is(#tp-gl, #tp-scrim, #tp-veil, #tp-work-hud, #tp-scrollcue) {
  display: none !important;
}

html.tp-a11y-hide-images #tp-projects {
  position: static !important;
  width: auto !important;
  height: auto !important;
  padding: 120px 28px !important;
  margin: 0 !important;
  overflow: visible !important;
  clip: auto !important;
  white-space: normal !important;
}

html.tp-a11y-hide-images #tp-work {
  height: auto !important;
}
```

- [ ] **Step 2: Verify the build**

Run: `pnpm exec astro check` — Expected: 0 errors.
Run: `pnpm build` — Expected: build completes.

- [ ] **Step 3: Verify contrast in all four states**

Run `pnpm dev`. Using the existing theme toggle plus the `Contraste` button, check all four combinations on `/blog/` and on a post:

| Theme | Contrast | Expected |
|---|---|---|
| dark | off | `#fff` on `#000`, lime accent — unchanged |
| dark | on | pure white on pure black, no dimmed copy, accents white |
| light | off | `#111` on `#f4f2ed` paper, olive accent — unchanged |
| light | on | pure black on pure white, no dimmed copy, accents black |

Measure at least one text/background pair per state with devtools' contrast readout. Do not eyeball it.

- [ ] **Step 4: Verify hide-images on the home**

Open `http://localhost:4321/` and enable `Masquer les images`.

Expected: the WebGL canvas disappears and the project list appears as readable text with its titles, descriptions and links. The page is still navigable. Post images on a blog post are hidden but the layout does not collapse (`visibility`, not `display`).

Then toggle it back off and confirm the scene returns. If the scene does not come back, the canvas was removed rather than hidden — that is a bug.

- [ ] **Step 5: Commit**

```bash
git add src/styles/a11y.css
git commit -m "feat(a11y): contrast through the theme tokens, and image hiding"
```

---

### Task 6: Pause animations, including the three.js scene

The one feature that cannot be done in CSS alone. `transition: none` does nothing to a `requestAnimationFrame` loop rendering three.js, or to Lenis interpolating scroll.

**Files:**
- Modify: `src/styles/a11y.css` (append)
- Modify: `src/scripts/scene/index.ts` — import at the top, listener near the Lenis setup (~line 109-117), guard at the top of `tick` (~line 319)

**Interfaces:**
- Consumes: `onA11yChange` and `A11yState` from `src/scripts/ui/a11y.ts` (Task 3).
- Produces: nothing new.

- [ ] **Step 1: Append the CSS to `src/styles/a11y.css`**

```css
/* ---- Pause animations ----------------------------------------------------
   The CSS half. The scene's render loop and Lenis are stopped in
   `scripts/scene/index.ts`, which listens for `tp-a11ychange` — CSS cannot
   reach a requestAnimationFrame loop. */
html.tp-a11y-pause *,
html.tp-a11y-pause *::before,
html.tp-a11y-pause *::after {
  animation: none !important;
  transition: none !important;
}

html.tp-a11y-pause {
  scroll-behavior: auto !important;
}
```

- [ ] **Step 2: Import the subscriber in `src/scripts/scene/index.ts`**

Add to the import block at the top, next to the existing `import { getTheme, onThemeChange } from '../ui/theme';`:

```ts
import { onA11yChange } from '../ui/a11y';
```

- [ ] **Step 3: Add the pause flag and the subscription**

Immediately after the Lenis setup block (after `setProgress();` at what is currently line 117), insert:

```ts
  // The reader can freeze the scene from the accessibility panel. It is frozen,
  // not torn down: the RAF stays scheduled so releasing the toggle resumes
  // without a reload, and Lenis is stopped so smooth scroll stops interpolating.
  let paused = false;
  onA11yChange((s) => {
    if (paused === s.pause) return;
    paused = s.pause;
    if (paused) lenis?.stop();
    else lenis?.start();
  });
```

- [ ] **Step 4: Guard the render loop**

In `tick`, currently beginning at line 319, insert the guard as the second statement — after the `requestAnimationFrame(tick)` call, before `const t = now * 0.001;`:

```ts
    if (paused) return;
```

The resulting head of the function reads:

```ts
  const tick = (now: number): void => {
    requestAnimationFrame(tick);
    if (paused) return;
    const t = now * 0.001;
    state.last = t;
```

Scheduling first and returning second is deliberate: the loop stays alive so an unpause needs no restart, and every update, camera move and draw call is skipped while frozen.

- [ ] **Step 5: Verify the build**

Run: `pnpm exec astro check` — Expected: 0 errors.
Run: `pnpm build` — Expected: build completes. Watch for a circular-import warning between `ui/a11y` and `scene/index` — there should be none, the dependency runs one way.

- [ ] **Step 6: Verify the pause in the browser**

Open `http://localhost:4321/` and let the scene load.

1. Enable `Pause animations`. The plates stop moving, the backdrop film stops, the scroll-cue line stops pulsing.
2. Open devtools' Performance panel and record 3 seconds while paused. Expected: no sustained scripting work per frame. If three.js is still drawing, the guard is in the wrong place.
3. Scroll. The page still scrolls — natively, without smooth interpolation.
4. Disable it. The scene resumes without a reload.
5. Reload with it on: the scene must come up already frozen. This works because `onA11yChange` fires once immediately with the current state, which the pre-paint script has already set.
6. On a blog post, confirm CSS transitions and reveals are suppressed.

- [ ] **Step 7: Commit**

```bash
git add src/styles/a11y.css src/scripts/scene/index.ts
git commit -m "feat(a11y): pause animations, the WebGL scene included"
```

---

### Task 7: Link highlighting and focus outline

**Files:**
- Modify: `src/styles/a11y.css` (append)

**Interfaces:**
- Consumes: `tp-a11y-links`, `tp-a11y-focus` on `<html>`.
- Produces: nothing new.

- [ ] **Step 1: Append to `src/styles/a11y.css`**

```css
/* ---- Highlight links -----------------------------------------------------
   The ported original used `#0000EE`, the standard link blue. On this site's
   black ground that measures ~2.3:1 — it would be LESS legible than what it
   replaces. The accent is already contrast-checked per theme, so
   recognisability is carried by a 2px underline and a weight bump instead.

   Under `tp-a11y-contrast` the accent resolves to ink, so highlighted links
   match body colour and the underline does the whole job. That is correct for
   a high-contrast mode and not a bug. */
html.tp-a11y-links :is(main, footer, nav) a {
  color: var(--color-accent) !important;
  text-decoration: underline !important;
  text-decoration-thickness: 2px !important;
  text-underline-offset: 3px !important;
  font-weight: 500 !important;
  opacity: 1 !important;
}

/* ---- Focus outline -------------------------------------------------------
   `global.css` already ships `:focus-visible { outline: 1px solid accent }`.
   This thickens what exists rather than introducing a competing rule. */
html.tp-a11y-focus :focus-visible {
  outline: 3px solid var(--color-accent) !important;
  outline-offset: 4px !important;
}
```

- [ ] **Step 2: Verify the build**

Run: `pnpm exec astro check` — Expected: 0 errors.
Run: `pnpm build` — Expected: build completes.

- [ ] **Step 3: Verify in the browser**

1. **Mise en évidence des liens** on `/blog/` and a post: every link in the nav, body and footer is underlined 2px in the accent colour, in both themes.
2. Combine it with `Contraste`: links go ink-coloured and stay clearly underlined. Confirm they remain distinguishable from body text by the underline alone.
3. **Contour du focus**: Tab through the page. The ring is visibly thicker than the default 1px and is never clipped by an ancestor's `overflow`.
4. Confirm the custom cursor (`#tp-cursor`) is unaffected.

- [ ] **Step 4: Commit**

```bash
git add src/styles/a11y.css
git commit -m "feat(a11y): link highlighting and a thicker focus ring"
```

---

### Task 8: Reading mask

Two fixed overlays darkening everything except a horizontal strip that follows the pointer.

**Files:**
- Modify: `src/styles/a11y.css` (append)
- Modify: `src/scripts/ui/a11y.ts` — add the mask functions, call them from `toggle`, `resetAll` and `initA11y`

**Interfaces:**
- Consumes: `tp-a11y-mask` on `<html>`.
- Produces: two elements appended to `<body>` while active — `.tp-a11y-mask-band.is-top` and `.tp-a11y-mask-band.is-bottom`.

- [ ] **Step 1: Append the CSS to `src/styles/a11y.css`**

```css
/* ---- Reading mask --------------------------------------------------------
   z-index 82: over the page and the nav, under the panel (85) and its overlay
   (84), so the control that turns the mask off is never dimmed by it. */
.tp-a11y-mask-band {
  position: fixed;
  left: 0;
  width: 100%;
  z-index: 82;
  background: rgb(var(--ground) / 0.78);
  pointer-events: none;
}

.tp-a11y-mask-band.is-top {
  top: 0;
}
```

- [ ] **Step 2: Add the mask implementation to `src/scripts/ui/a11y.ts`**

Insert after the `announce()` function and before `stepsOf`:

```ts
/* ---- Reading mask --------------------------------------------------------
   Two bands sized around a strip that follows the pointer. Height is written
   on a rAF tick so a fast pointer cannot queue a layout per mousemove. */

const MASK_STRIP = 120;
let bandTop: HTMLElement | null = null;
let bandBottom: HTMLElement | null = null;
let maskFrame = 0;

function placeMask(y: number): void {
  if (!bandTop || !bandBottom) return;
  const half = MASK_STRIP / 2;
  const topHeight = Math.max(0, y - half);
  const bottomStart = Math.min(window.innerHeight, y + half);
  bandTop.style.height = `${topHeight}px`;
  bandBottom.style.top = `${bottomStart}px`;
  bandBottom.style.height = `${window.innerHeight - bottomStart}px`;
}

function scheduleMask(y: number): void {
  if (maskFrame) return;
  maskFrame = requestAnimationFrame(() => {
    maskFrame = 0;
    placeMask(y);
  });
}

function onMaskPointer(e: PointerEvent): void {
  scheduleMask(e.clientY);
}

function showMask(): void {
  if (bandTop) return;
  bandTop = document.createElement('div');
  bandTop.className = 'tp-a11y-mask-band is-top';
  bandBottom = document.createElement('div');
  bandBottom.className = 'tp-a11y-mask-band is-bottom';
  document.body.append(bandTop, bandBottom);
  placeMask(window.innerHeight / 2);
  document.addEventListener('pointermove', onMaskPointer, { passive: true });
}

function hideMask(): void {
  if (maskFrame) {
    cancelAnimationFrame(maskFrame);
    maskFrame = 0;
  }
  document.removeEventListener('pointermove', onMaskPointer);
  bandTop?.remove();
  bandBottom?.remove();
  bandTop = null;
  bandBottom = null;
}

/** Bring the mask DOM in line with the class on <html>. */
function syncMask(): void {
  if (root.classList.contains(FEATURES.mask.cssClass)) showMask();
  else hideMask();
}
```

`pointermove` covers mouse, pen and touch in one listener, so the ported original's separate `mousemove` and `touchmove` handlers are not needed.

- [ ] **Step 3: Call `syncMask()` from the three places that change state**

In `toggle`, add it immediately before `announce();`:

```ts
  paintButton(btn, id);
  syncMask();
  announce();
```

In `resetAll`, add it immediately before `announce();`:

```ts
  syncMask();
  announce();
```

In `initA11y`, add it immediately after the `buttons.forEach(...)` block, so a page restored with the mask on gets its bands:

```ts
  syncMask();
```

- [ ] **Step 4: Verify the build**

Run: `pnpm exec astro check` — Expected: 0 errors.
Run: `pnpm build` — Expected: build completes.

- [ ] **Step 5: Verify in the browser**

1. Enable `Masque de lecture` on a blog post. A clear 120px band follows the pointer; everything above and below is dimmed.
2. The band dims the page in both themes (it uses `--ground`, so it darkens on dark and lightens on light — check it reads correctly in light too).
3. Open the accessibility panel while the mask is on: **the panel and its overlay are NOT dimmed.** If they are, the z-index is wrong.
4. Record 3 seconds of fast pointer movement in devtools' Performance panel: no layout thrash, one style recalculation per frame at most.
5. Turn it off — both bands are removed from the DOM. Confirm in the elements inspector; a leaked band is a bug.
6. Reload with it on: the bands are recreated.
7. Resize the window while active and confirm the bottom band still reaches the viewport bottom.

- [ ] **Step 6: Commit**

```bash
git add src/styles/a11y.css src/scripts/ui/a11y.ts
git commit -m "feat(a11y): pointer-following reading mask"
```

---

### Task 9: Self-exemption and the full verification pass

Until now the widget has been subject to its own overrides — enlarging the page's text also enlarged the panel's, and hiding images hid its icons. This task fixes that and runs the complete check.

**Files:**
- Modify: `src/styles/a11y.css` (append — this block must be LAST in the file)

**Interfaces:**
- Consumes: everything.
- Produces: nothing.

- [ ] **Step 1: Append the self-exemption block — it must be the last thing in the file**

```css
/* ============================================================================
   Self-exemption — MUST STAY LAST IN THIS FILE.

   The overrides above are written plainly, without a `:not(.tp-a11y *)` on
   every selector; this block wins them back instead. A toolbar that shrinks its
   own text when you enlarge the page's, or hides its own icons when you hide
   the page's images, is not usable by the reader who needs it.

   TWO THINGS HERE ARE LOAD-BEARING AND EASY TO "TIDY" INTO BREAKAGE:

   1. The doubled class (`.tp-a11y.tp-a11y`) is deliberate. Several overrides
      above are `html[class*='tp-a11y-…'] <element>`, specificity (0,1,2). The
      plain `.tp-a11y *` is (0,1,0) and LOSES to them — specificity is compared
      before source order, so being last in the file does not save it. Doubling
      the class makes it (0,2,0) and wins. Do not "simplify" it back.

   2. Sizes here are px, NOT rem. `Taille de texte` scales the ROOT font-size,
      and a rem inside this block would resolve against that scaled root — i.e.
      it would fail to exempt the one thing this block exists to exempt.
   ========================================================================= */
.tp-a11y.tp-a11y,
.tp-a11y.tp-a11y * {
  font-family: var(--font-mono) !important;
  font-style: normal !important;
  text-align: left !important;
  letter-spacing: 0.08em !important;
  line-height: 1.35 !important;
  opacity: 1 !important;
  animation: none !important;
}

.tp-a11y.tp-a11y .tp-a11y-feature-label,
.tp-a11y.tp-a11y .tp-label,
.tp-a11y.tp-a11y .tp-label-sm {
  font-size: 11px !important;
}

.tp-a11y.tp-a11y .tp-label,
.tp-a11y.tp-a11y .tp-label-sm {
  letter-spacing: 0.3em !important;
}

.tp-a11y.tp-a11y svg {
  visibility: visible !important;
  display: block !important;
}

/* The panel's own buttons must not pick up the highlight or the thickened
   underline meant for page content. */
.tp-a11y.tp-a11y button {
  text-decoration: none !important;
  font-weight: 400 !important;
}
```

> The `font-family: var(--font-mono)` here deliberately resolves through the
> variable, so `Police lisible` still swaps the panel's own typeface. That one
> is a reader preference the toolbar should honour about itself; size and
> spacing are not.

- [ ] **Step 2: Verify the widget survives every feature**

Run `pnpm dev`. Open the panel and turn on **all ten features at once**.

Expected: the panel stays fully legible and operable — labels readable, icons visible, buttons hittable, the reset button reachable. This is the state a reader can get themselves into, and it must never be a trap.

Check these three specifically, because each one has a rule in the block above that exists solely to make it true:

1. **`Taille de texte` at step 3 does not change the panel's own text size.** If the panel grows with the page, a rem survived in the exemption block.
2. **`Hauteur de ligne` and `Alignement du texte` do not reach inside the panel.** If they do, the exemption lost on specificity — check the doubled class is intact.
3. **`Masquer les images` does not hide the panel's own icons.**

Then turn them off one at a time using the panel itself, confirming each one is individually releasable.

- [ ] **Step 3: Run the full check suite**

```bash
pnpm exec astro check
pnpm build
python3 scripts/check-articles.py
python3 scripts/check-html.py dist
node scripts/check-language-switcher.mjs
```

Expected: all green. In particular, `check-html.py`'s internal-link count must be unchanged from `main` — the widget renders no `<a>`, so any movement means something rendered that should not have. Compare against a build of `main` if the number is in doubt.

- [ ] **Step 4: Full browser pass, both locales**

For each of `/`, `/blog/`, a blog post, `/projects/`, and their `/en/` twins:

1. The button is present and reachable by keyboard.
2. All ten features toggle and release.
3. Preferences survive navigation between pages, not just reload.
4. The panel's labels are in the page's language — French on `/blog/`, English on `/en/blog/`.

- [ ] **Step 5: Mobile pass**

At 375px width with touch emulation:

1. The button is 44px and does not cover content.
2. The panel goes full width.
3. Every feature button is at least 44px tall.
4. The reading mask follows touch (`pointermove` covers it).
5. The panel scrolls if it overflows.

- [ ] **Step 6: Keyboard and screen-reader pass**

1. The whole panel is operable with the keyboard alone.
2. Every control announces a name and, for toggles, a pressed state.
3. Step controls announce their position (`aria-valuetext`, e.g. "2 / 4").
4. Focus never escapes the open panel, and returns to the button on close.

- [ ] **Step 7: Commit**

```bash
git add src/styles/a11y.css
git commit -m "feat(a11y): exempt the toolbar from its own overrides"
```

- [ ] **Step 8: Update the project documentation**

Add to `CLAUDE.md` under **Architecture decisions**, after the "Home scene" section:

```markdown
### Accessibility widget

A 10-feature reader toolbar on every page: `src/components/A11yWidget.astro`
(markup + panel styles), `src/scripts/ui/a11y.ts` (state, persistence, reading
mask), `src/styles/a11y.css` (the `html.tp-a11y-*` overrides). Preferences are
`tp-a11y-*` keys in `localStorage`, stamped onto `<html>` before first paint by
the same inline `<head>` script that carries the theme.

Overrides are written as **CSS variable redefinitions wherever the token system
can express them** — `Contraste` redefines `--ink`/`--ground`, `Police lisible`
redefines `--font-sans`/`--font-mono`. Reach for an `!important` selector only
where no variable covers the case.

**The self-exemption block at the end of `a11y.css` must stay last** — it is
what keeps the toolbar legible under its own settings, and it wins by source
order rather than by a `:not()` on every selector above it.

`Pause animations` and `Masquer les images` reach past CSS: `a11y.ts` dispatches
`tp-a11ychange` on `document` (same pattern as `THEME_EVENT`), and
`scene/index.ts` listens to freeze the render loop and stop Lenis. The
hide-images rules mirror the `<noscript>` block in `SceneLayer.astro` — **if one
changes, change the other.**
```

```bash
git add CLAUDE.md
git commit -m "docs: record the accessibility widget architecture"
```

---

## Self-Review

**Spec coverage.** Every section of the spec maps to a task: §2 decisions 1-9 across Tasks 1-9; §3 file list matches the tasks' Files blocks; §4's ten features are Tasks 4 (4 features), 5 (2), 6 (1), 7 (2), 8 (1) — ten total; §5's dropped features appear nowhere, correctly; §7 visual language is Task 2; §8 widget accessibility is Tasks 3 and 9 step 6; §10 verification is distributed per task and gathered in Task 9.

**Name consistency, checked across tasks.** `A11Y_EVENT` / `onA11yChange` / `A11yState` are defined in Task 3 and consumed in Task 6 under those exact names. `data-a11y-feature` and `data-a11y-steps` are emitted in Task 2 and read in Task 3. Feature ids (`fontScale`, `lineHeight`, `alignLeft`, `readableFont`, `contrast`, `hideImages`, `pause`, `links`, `mask`, `focus`) are identical in the canonical table, the Task 2 markup registry and the Task 3 `FEATURES` record. Class names in the Task 3 record match the selectors in Tasks 4-8 and the pre-paint script in Task 3 step 3. `syncMask` is defined and called under one name in Task 8.

**Known ordering dependencies**, stated where they bite: `a11y.css` imported last (Task 4 step 2), self-exemption block last within it (Task 9 step 1), `requestAnimationFrame(tick)` before the `paused` guard (Task 6 step 4).

**One accepted intermediate-state ugliness:** between Task 4 and Task 9 the panel is disfigured by its own overrides. Flagged in Task 4 step 4.6 so a reviewer does not report it as a defect.
