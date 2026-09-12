# Accessibility widget — design

**Date:** 2026-09-11
**Status:** approved by the user 2026-09-11
**Ported from:** `adeline-gueret` —
`docs/superpowers/specs/2026-04-13-accessibility-widget-design.md`, 12 features,
570 lines of JS and 549 of CSS. The *logic* crosses over almost unchanged; the
*CSS* does not, and section 6 says why.

## 1. Goal

A reader-facing accessibility toolbar on every page, in both locales: a floating
button at the right edge opening a panel of 10 toggles grouped in three
categories. Preferences persist across pages and reloads.

The site is a monochrome design portfolio with a WebGL home. The toolbar has to
serve a reader who needs it without disfiguring the design for the reader who
does not — so every override is expressed in the existing token system wherever
the token system can express it.

## 2. Decisions

1. **10 features, not the reference's 12.** `Niveaux de gris` and
   `Structure de page` are dropped — section 5.
2. **Markup is rendered by Astro, not built by JS.** The reference builds the
   whole panel at runtime from a hardcoded French string table. Here the labels
   must reach `t(locale, …)`, so the panel is an `.astro` component. The script
   binds behaviour to markup that already exists.
3. **Overrides redefine CSS variables wherever possible**, and only fall back to
   `!important` selectors where no variable covers the case. This is the whole
   reason the port shrinks — section 6.
4. **Contrast modifies the current theme**, it does not force black-on-white.
   Dark stays dark, paper stays paper; both go to their pure extremes.
   Explicitly chosen over the reference's behaviour, to compose with `tp-theme`
   rather than fight it.
5. **Links highlight in `--color-accent`**, not the reference's `#0000EE`. That
   blue measures ~2.3:1 on the black ground — it would be *less* legible than
   what it replaces. Recognisability is carried by a 2px underline and a weight
   bump instead.
6. **Persistence:** `localStorage`, keys `tp-a11y-*`, matching `tp-theme`.
   Toggles store `"1"` or are absent; steps store the step value.
7. **No flash:** the existing blocking `<head>` script in `BaseLayout` grows to
   stamp the `tp-a11y-*` classes alongside `data-theme`. It stays the only
   inline script on the site.
8. **The widget is exempt from its own overrides.** A toolbar that shrinks its
   own text when you enlarge the page's is unusable.
9. **No new dependency, no new test runner.**

## 3. Files

| File | Change |
|---|---|
| `src/components/A11yWidget.astro` | new — button, panel, scoped panel styles |
| `src/scripts/ui/a11y.ts` | new — state, persistence, panel, reading mask |
| `src/styles/a11y.css` | new — the `html.tp-a11y-*` override rules |
| `src/styles/global.css` | imports `a11y.css`; 6 px font-sizes → rem |
| `src/layouts/BaseLayout.astro` | mounts the widget; head script extended |
| `src/i18n/fr.ts`, `src/i18n/en.ts` | +17 keys each |
| `src/scripts/scene/index.ts` | selective pause guard, frozen clock, non-smooth Lenis |

`a11y.ts` sits beside `theme.ts`, `cursor.ts` and `split-text.ts` — the
convention already in place for UI behaviour modules.

## 4. The 10 features

### Texte

| Feature | Steps | Mechanism |
|---|---|---|
| Taille de texte | 1 / 1.15 / 1.3 / 1.5 | `html { font-size: calc(100% * scale) }` |
| Hauteur de ligne | 1 / 1.3 / 1.6 | `--tp-a11y-lh` multiplier on body and `.prose` |
| Alignement du texte | toggle | `text-align: left` on text elements |
| Police lisible | toggle | redefines `--font-sans` / `--font-mono` |

**Why root font-size and not per-tag `!important`.** The reference hardcodes
`h1 { font-size: calc(2.5rem * scale) !important }` and so on down the tags.
This site's headings are `clamp(2rem, 5.6vw, 4.6rem)` — per-tag overrides would
replace fluid type with a fixed ladder, i.e. break the design to make it bigger.
Scaling the root instead moves both rem bounds of every `clamp()` and leaves the
`vw` term alone, so headings grow *through* their existing curve. Tailwind v4
utilities are rem-based and follow for free.

**That curve has a ceiling, and it is accepted.** A `vw` or `vh` term is
viewport-relative and cannot scale with the root, so any heading whose `clamp()`
is currently resolving to its viewport term stops growing, while everything
sized in rem keeps going. Measured on `.tp-h2` at 1440px: 73.6px at 100%, then
80.64px at 115%, 130% *and* 150% — identical at the top three steps. Other
headings carry their own clamps and so have their own ceilings; the home hero is
`clamp(1.9rem, min(7.6vw, 9vh), 6.4rem)`, whose `min()` can bind on either term
depending on the viewport's shape. Body text, prose, nav, labels and links keep
scaling the full 50% throughout; it is only display headings that plateau.

This is a deliberate trade, not an oversight. Making the `vw` term scale would
require exactly the per-tag overrides the paragraph above rejects, spending the
site's fluid type to buy growth on an 80px headline — where legibility is not
the constraint. Body copy is the constraint, and body copy is unaffected. The
ceiling is restated in a comment in `a11y.css` so it is not rediscovered as a
bug.

The six hardcoded `font-size: 11px` / `10px` in `global.css` (`.tp-label`,
`.tp-label-sm` and four HUD rules) are the exception that does not follow, so
they convert to rem. That is a targeted fix in code this feature touches, not
unrelated refactoring.

**Police lisible** is one rule, because the fonts are variables:

```css
html.tp-a11y-readable-font {
  --font-sans: Arial, Helvetica, sans-serif;
  --font-mono: Consolas, "Courier New", monospace;
}
```

It also zeroes the `letter-spacing` on `.tp-label*`, whose `0.3em` tracking is a
legibility cost the feature exists to remove, and sets `font-style: normal`.

**Removing italics is deliberate** — the British Dyslexia Association's style
guidance advises against them, and this mode exists for exactly that reader. But
removing them silently erases emphasis: `<em>`, `<i>` and the hero's italic
accent lose their only visual distinction. So emphasis is re-expressed rather
than dropped — `em` and `i` take a heavier weight under this mode, which carries
the same meaning in a form the mode's users can actually perceive.

### Visuel

| Feature | Mechanism |
|---|---|
| Contraste | pushes `--ink` / `--ground` to pure extremes in the current theme |
| Masquer les images | hides media **and** the canvas, revealing `.tp-sr-grid` |
| Pause animations | CSS kill + `tp-a11ychange` event freezing the scene's motion |

**Contraste** is the clearest case for decision 3. Two triplets drive the whole
site, so maximum contrast is:

```css
html.tp-a11y-contrast                      { --ink: 255 255 255; --ground: 0 0 0; }
html[data-theme='light'].tp-a11y-contrast  { --ink: 0 0 0; --ground: 255 255 255; }
```

plus the muted aliases (`--color-text-muted`, `--color-text-light`) collapsing to
full ink and `--color-border` rising to `0.6`. `--color-accent` — the *text* use
of the lime — becomes `rgb(var(--ink))`, since no green clears 4.5:1 against both
pure grounds; `--color-accent-solid` keeps the lime for fills, where text
contrast does not apply. That is the same split the light theme already makes.
The reference needed eight selectors full of `!important` for the same result
because it had no tokens.

**Masquer les images** cannot be `visibility: hidden` on `img` alone: the home's
projects are a WebGL canvas, not images. It hides `img`, `picture`, `video` and
the scene canvas, and reveals `ProjectsFallbackGrid`'s `.tp-sr-grid` — which is
already built, already in the accessibility tree, and already the no-WebGL path.
The feature reuses it rather than inventing a second fallback.

**Pause animations** cannot be CSS-only. `transition: none` does nothing to a
`requestAnimationFrame` loop rendering three.js, or to Lenis interpolating
scroll. So `a11y.ts` dispatches `tp-a11ychange` on `document` — the same pattern
as `THEME_EVENT` in `theme.ts` — and `scene/index.ts` listens. The scene is
frozen, not torn down, so the toggle is reversible without a reload.

**What it freezes is motion, not the page.** The first design stopped Lenis and
returned early from the top of `tick`. Both were wrong, and implementation found
out why:

- **`lenis.stop()` does not pause smooth scroll, it blocks scrolling.** While
  stopped, Lenis `preventDefault`s wheel and touch — it is the modal scroll-lock
  this same file uses when a plate opens. Pausing would have trapped the reader
  at the hero. Lenis is instead switched out of smooth mode (`smoothWheel` and
  `syncTouch` false) and left running, so native scrolling takes over.
- **A blanket early return froze things the reader controls.** It killed the
  custom cursor — and since `global.css` hides the system cursor on fine
  pointers, that left no visible pointer at all — and it froze the readability
  veil, leaving copy over a still frame with no scrim.

So the guard is selective. Skipped: camera, cards, backdrop, the cursor and every
draw call. Still running: Lenis's tick, scroll-progress bookkeeping, and the
veil — all of it reader-driven, none of it autonomous motion. The custom cursor
is *hidden* rather than animated, and CSS restores the native pointer, which is
both simpler and immune to a render-loop bug.

**The clock freezes with it.** `t` is wall-clock, so a scene resumed after a
pause would evaluate its noise functions at an unrelated point and pop. Paused
duration accumulates into an offset subtracted from `now` — which means every
consumer of that clock must read the same offset one, not raw `performance.now()`.

**Known limitation:** clicking a project plate does nothing while paused, because
hit-testing lives in the skipped `updateCards`. The projects stay reachable via
the HUD control and `/projects/`. Restoring it would mean hit-testing a frozen
scene with frozen pointer smoothing, to serve a mouse-only affordance.

### Orientation

| Feature | Mechanism |
|---|---|
| Mise en évidence des liens | `--color-accent`, 2px underline, weight bump |
| Masque de lecture | two fixed overlays tracking pointer Y, rAF-throttled |
| Contour du focus | existing `:focus-visible` 1px → 3px, offset 4px |

The reading mask ports from the reference as-is, including the `transform`-based
repositioning and the `requestAnimationFrame` throttle. Its only change is
z-index, so it sits under the panel rather than over it.

Focus outline builds on what exists — `global.css` already ships
`:focus-visible { outline: 1px solid var(--color-accent) }`. The feature
thickens it; it does not introduce a competing rule.

## 5. Dropped from the reference

- **Niveaux de gris.** The site is already monochrome plus one accent, so the
  feature would amount to removing the lime. Worse, `filter` on `<html>` creates
  a containing block, which breaks `position: fixed` — the scene canvas, the
  nav, the cursor and the panel itself all depend on it. The cost is real and
  the benefit is nearly nil here.
- **Structure de page.** Red dashed outlines on every `nav`/`main`/`section`
  plus `H1`…`H6` badges is a developer's inspection tool. It disrupts the page
  far more than it orients a reader, and screen readers already expose heading
  level and landmark role natively.

## 6. Why the CSS does not port and the logic does

The reference's 549 CSS lines are written against a light, untokenized,
single-page site: roughly 250 of them are `!important` overrides enumerating
selectors (`h1`, `h2`, `h3`, `p`, `li`, `span`, `a`, `label`, `input`…) one at a
time, each re-stated per feature. None of that survives contact with a site
whose colours, fonts and spacing already resolve through variables — here most
features are a variable redefinition, and the enumerated overrides remain only
for the cases no variable covers (text alignment, media visibility, animation
suppression).

The JS is the opposite. The feature registry, the step/toggle distinction, the
localStorage round-trip, the focus trap, the Escape handling and the reading
mask are all site-agnostic and come across nearly verbatim — retyped in
TypeScript with the string table lifted out into `data-*` attributes so the
markup can carry translated labels.

## 7. Visual language

The panel must read as part of the site, not as a bolted-on toolbar.

| Element | Treatment |
|---|---|
| Floating button | right edge, vertically centred, square corners, `--ground` fill on a 1px `--ink` border, lime on hover/focus |
| Panel | slides from the right, 340px, `--ground` background, 1px ink border on the left edge |
| Header | title in `tp-label`, reset and close buttons |
| Section titles | `tp-label-sm` — JetBrains Mono, tracked, uppercase, as in `01 — HERO` |
| Feature buttons | bordered squares, 2-up grid, ≥44px touch target |
| Active state | lime border and lime glyph |
| Step indicator | dots, filled in lime |

Mobile (≤768px): the panel goes full width; the button shrinks to 40px.

**Z-index:** button 80, overlay 84, panel 85. Above the nav (60) and the home
veil (70), below the custom cursor (90) and the loader (100).

**Self-exemption** (decision 8): the widget's own subtree resets font-family,
font-size, letter-spacing, text-align and visibility, so no feature can
disfigure the control that toggles it.

## 8. Accessibility of the widget itself

- Button: `aria-label`, `aria-expanded`.
- Panel: `role="dialog"`, `aria-modal="true"`, `aria-label`.
- Toggles carry `aria-pressed`; steps carry `aria-valuenow` and `aria-valuetext`.
- Focus moves into the panel on open and returns to the button on close.
- Tab and Shift+Tab cycle inside the panel; Escape closes it.
- Every control is reachable and operable by keyboard alone.

## 9. Out of scope

- Text-to-speech — browsers and assistive tech do this natively and better.
- Colour-blindness simulation filters.
- Server-side persistence; `localStorage` is right for a static site.
- A no-JS fallback for the toolbar itself. The *site* works without JS; the
  toolbar is a JS control and is simply absent, which is honest. The skip link,
  semantic markup, focus styles and `.tp-sr-grid` fallback all remain.

## 10. Verification

There is no JS test runner in this repo and this feature does not add one.

- `pnpm exec astro check` and `pnpm build` green.
- `python3 scripts/check-html.py dist` — one `<h1>` per page, valid JSON-LD,
  every internal link resolving. The widget adds no links, so the reported link
  count should not move; if it does, something rendered that should not have.
- `python3 scripts/check-articles.py` and
  `node scripts/check-language-switcher.mjs` green.
- Playwright, against the real page: each of the 10 features toggled on the home
  and on a blog post, in FR and EN; persistence across a reload; Escape and the
  Tab cycle; mobile width.
- Contrast measured, not eyeballed, in all four states — dark, light, and each
  with `Contraste` active.
- With `Pause animations` on, the draw must actually stop — evidenced by
  `renderer.info.render.frame` deltas or draw-call counts, not by a screenshot:
  a paused scene and a running-but-idle scene look identical. Scrolling must
  still work when driven by a **real wheel event**; `window.scrollBy()` bypasses
  Lenis entirely and will pass even when scrolling is trapped.
