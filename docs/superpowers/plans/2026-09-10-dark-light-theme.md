# Dark / light theme — implementation plan

**Spec:** `docs/superpowers/specs/2026-09-10-dark-light-theme-design.md`

**Goal:** a light theme across the whole site, three.js scene included, dark by
default, toggled from the nav and remembered.

## Global constraints

- Dark is the default and needs no JavaScript to be correct.
- `prefers-color-scheme` is never consulted.
- Light accent for text/arrows is `#5a7d0c`; `#a8cf3e` survives as a solid fill.
- Paper `#f4f2ed`, ink `#111`.
- No new named tokens where `rgb(var(--ink) / α)` will do.

## Task 1 — Token layer

`src/styles/global.css`: `--ink` / `--ground` triplets on `:root` and
`:root[data-theme="light"]`; rebuild the semantic aliases on top; convert every
literal in the file (17 `#fff`, 8 `#000`, 8 `#a8cf3e`, the white- and
black-alpha rules) to the tokens. `html`, `body`, `::selection`, `a`, `.tp-*`
components, `.tp-arrow`, `.tp-back`, the reveal classes.

**Done when:** the built CSS carries no bare `#fff` / `#000` / `rgba(255,255,255`
outside the two `:root` blocks, and the site still looks identical in dark.

## Task 2 — Theme mechanism

- `BaseLayout.astro`: blocking inline script in `<head>` reading
  `localStorage['tp-theme']`, stamping `data-theme` on `<html>`.
- `src/scripts/ui/theme.ts`: `getTheme()`, `setTheme()`, and a `tp-themechange`
  CustomEvent on `document` so the scene can subscribe.
- `SiteNav.astro`: toggle beside the language switcher, same mono treatment,
  `aria-pressed`, localized label; present in the burger menu too.
- i18n keys in both `fr.ts` and `en.ts`.

**Done when:** the toggle flips the document theme, survives a reload, and the
first painted frame already carries the stored theme.

## Task 3 — Components

Convert the 38 literals across the 17 `.astro` files to `var(--…)` /
`rgb(var(--ink) / α)`. Includes `bg-black` on `#tp-menu` and `#tp-veil`, the
scrim gradient, the plate-list cells and the certification rows.

**Done when:** no `.astro` file carries a bare colour literal, dark renders
unchanged, light renders with no white-on-white or black-on-black.

## Task 4 — The scene

- `config.ts`: a `THEME` record holding per-theme scene values (clear colour,
  vignette, backdrop polarity, accent).
- `backdrop.ts`: `uInvert` uniform; light branch maps luminance to dark ink on
  paper, keeping the pastel wash.
- `post.ts`: vignette strength from the theme.
- `cards.ts` / `motifs.ts`: plate polarity from the theme; expose a
  `retheme(cards, theme)` that regenerates the canvas textures.
- `index.ts`: subscribe to `tp-themechange`; update clear colour, uniforms,
  textures; `fallback.ts` cell artwork follows too.

**Done when:** toggling on the home updates ground, film, plates, scrim, veil
and cursor within a frame, with no console error and no texture leak.

## Task 5 — Verification

Contrast measured on every text/background pair in both themes; screenshots of
hero, projects, about, cv, blog, article in both; `astro check`, build,
`check-articles.py`, `check-html.py`, `check-language-switcher.mjs`.
