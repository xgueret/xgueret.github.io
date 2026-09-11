# Dark / light theme — design

**Date:** 2026-09-10
**Status:** approved by the user 2026-09-10
**Supersedes:** decision 8 of `2026-09-09-monochrome-redesign-design.md` ("dark-mode
toggle removed — single black theme"). That decision is reversed here, on the
user's request; the black theme stays the default and the identity of the site.

## 1. Goal

A light theme covering the whole site, the three.js home scene included. Dark
stays the default; the visitor's choice is explicit and remembered.

## 2. Decisions

1. **Scope: everything.** Home (scene, plates, backdrop film, post-processing),
   blog, articles, categories, `/projects`, nav, footer, forms.
2. **Default: dark.** `prefers-color-scheme` is deliberately NOT consulted — the
   black theme is the site's identity, the light one is an opt-in.
3. **Persistence:** `localStorage`, key `tp-theme`, values `dark` | `light`.
4. **No flash:** a blocking inline script in `<head>` stamps `data-theme` on
   `<html>` before first paint. It is the only inline script on the site.
5. **Light ground is paper, not white:** `#f4f2ed` warm off-white, ink `#111`.
   A pure white would drop the monochrome-print character the design is built on.
6. **The accent changes with the theme.** `#a8cf3e` on white measures 1.77:1 —
   unusable for text. Light mode uses `#5a7d0c` (4.65:1 on the paper ground) for
   text, arrows and links. The original lime survives as a *solid* fill (motif
   dots, plate accents), where text contrast does not apply.
7. **Live switch, including the 3D.** Plate textures are baked into canvases at
   startup; the toggle regenerates them. A toggle that left the plates in the
   old polarity would read as a bug.
8. **No-JS keeps the dark theme** — the default needs no script to be correct.

## 3. Token architecture

Two RGB triplets drive everything, so the ~40 white-alpha and black-alpha values
scattered through the markup convert mechanically instead of becoming 12 new
named tokens:

```css
:root                  { --ink: 255 255 255; --ground: 0 0 0;      }
:root[data-theme=light]{ --ink: 17 17 17;    --ground: 244 242 237; }
```

Every `rgba(255,255,255,α)` becomes `rgb(var(--ink) / α)`; every black scrim
`rgba(0,0,0,α)` becomes `rgb(var(--ground) / α)`. The existing semantic aliases
(`--color-bg`, `--color-text`, `--color-border`, `--color-accent`…) are rebuilt
on top of the two triplets and keep their names — the article components resolve
them already.

## 4. The scene under a light theme

| Layer | Dark | Light |
|---|---|---|
| renderer clear colour | `#000` | paper |
| backdrop film | luminance held down (`pow(l,1.5)*0.72`) | curve inverted: dark ink on paper |
| pastel wash | unchanged | unchanged — it rides on the luminance either way |
| plates | ink-on-black, two inverted for rhythm | ink-on-paper, two inverted for rhythm |
| vignette | `0.55` | softened — it multiplies down, and darkened corners on paper read as dirt |
| grain | `0.075` | kept: on paper it reads as press texture |
| scrim / veil | black gradients | paper gradients |
| cursor | white ring | ink ring |

## 5. Out of scope

- Following `prefers-color-scheme` (decision 2).
- A third theme, or per-page themes.
- Re-encoding the backdrop video.

## 6. Verification

- Contrast: every text/background pair ≥ 4.5:1 in both themes, measured, not eyeballed.
- No flash: first painted frame already carries the stored theme.
- The scene: plates, backdrop, scrim and cursor all follow a live toggle.
- `astro check`, `pnpm build`, `check-articles.py`, `check-html.py`,
  `check-language-switcher.mjs` all green.
