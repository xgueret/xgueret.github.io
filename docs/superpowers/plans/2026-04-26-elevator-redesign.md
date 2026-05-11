# Elevator Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page with a 6-floor "elevator" SPA experience while preserving every existing site feature; reskin every deep route with the new palette/typography; add a persistent elevator panel for cross-route navigation; remove the React chatbot.

**Architecture:** Astro 5 multi-page (no global SPA router). The home renders all six floors in the DOM, switching the active floor via vanilla TS. The elevator panel + HUD are rendered via `BaseLayout` on every page so deep routes can deep-link back to a floor through the URL hash. Two new `localStorage`-persisted settings drive theme (dark/light) and accent (violet/prusse/amber). No React.

**Tech Stack:** Astro 5, TypeScript 5, Tailwind v4 (via `@tailwindcss/vite`), `@fontsource/*` self-hosted fonts, vanilla TS for elevator logic.

**Source spec:** `docs/superpowers/specs/2026-04-26-redesign-elevator-design.md`
**Mockup reference:** `tmp/maquette-xgueret.html` (reproduce its visuals; logic is to be ported, not copy-pasted verbatim — see notes per phase)

---

## Conventions used in this plan

- **Build = test.** This is a static Astro site with no unit-test harness. The verification step in every task is `pnpm build` (Astro's build performs full type-checking and content-collection schema validation). Visual verification is done manually with `pnpm dev`.
- **Variables are prefixed `--xg-*`** to coexist with the existing `--color-*` palette. The old palette stays in `global.css` until phase 8.
- **i18n keys are flat with underscore namespacing** (matching `src/i18n/fr.ts` style), e.g. `elevator_floor_label_cv`, not nested objects.
- **Theme/accent storage:** `localStorage['xg-theme']` (`dark|light`, default `dark`) and `localStorage['xg-accent']` (`violet|prusse|amber`, default `prusse`). Applied as `<html data-theme="..." data-accent="...">`.
- **Commit per phase.** 8 phases = 8 commits, each independently buildable.

---

## Pre-flight check (run once before starting)

- [ ] **PF.1: Confirm working tree is clean and on `main`**

```bash
git status
git branch --show-current
```

Expected: `nothing to commit, working tree clean` and branch `main`. If not clean, stash or commit first.

- [ ] **PF.2: Confirm baseline build works**

```bash
pnpm install
pnpm build
```

Expected: build succeeds, no errors. If it fails on the baseline, stop and fix before proceeding.

- [ ] **PF.3: Read the spec end-to-end**

Open `docs/superpowers/specs/2026-04-26-redesign-elevator-design.md`. The plan below assumes you understand the decisions log (section 3) and the acceptance criteria (section 10).

- [ ] **PF.4: Read the mockup**

Open `tmp/maquette-xgueret.html` in a browser (`xdg-open tmp/maquette-xgueret.html` or drag into Chrome). Click each hex button, switch theme, switch accent. The look you produce should match this mockup, minus the inline tweaks-panel React experiment which we replace with a static accent toggle.

---

## Phase 1 — Theming groundwork

**Goal of this phase:** Add the new font sources, the `--xg-*` palette (dark + light), the accent variants, the FOUC-prevention script — without breaking any existing page. After this phase, the site looks unchanged but the new tokens exist in CSS.

**Files:**
- Modify: `package.json` (add `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`)
- Modify: `src/styles/global.css` (add `@import` for new fonts; add `--xg-*` variables and `data-theme`/`data-accent` blocks)
- Modify: `src/layouts/BaseLayout.astro` (replace existing FOUC script with one that handles both `theme` (legacy) and `xg-theme` + `xg-accent`)

### Tasks

- [ ] **1.1: Install new fonts via pnpm**

```bash
pnpm add @fontsource/space-grotesk @fontsource/jetbrains-mono
```

Expected: both packages added to `dependencies` in `package.json` and to `pnpm-lock.yaml`.

- [ ] **1.2: Import new fonts in `src/styles/global.css`**

Locate the existing `@import '@fontsource/plus-jakarta-sans/...';` block (lines 4–8). After line 8, insert:

```css
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';

@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/600.css';
```

- [ ] **1.3: Add `--xg-*` font tokens in `@theme` block**

In the existing `@theme { ... }` block (lines 10–18), add after `--font-sans`:

```css
  --font-display: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
```

- [ ] **1.4: Add `--xg-*` palette block to `global.css`**

After the existing `@layer base { ... }` block (after line 56), insert a new block. The variables ARE allowed at `:root` outside `@layer base`. Use this exact block:

```css
:root,
html[data-theme="dark"] {
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
  --xg-rivet: #3a3d52;
  --xg-metal-1: #2a2d3e;
  --xg-metal-2: #1a1c2a;
}

html[data-theme="light"] {
  --xg-bg: #f4f5f8;
  --xg-surface: #ffffff;
  --xg-card: #ffffff;
  --xg-border: #d8dbe4;
  --xg-text: #1a1c2a;
  --xg-muted: #4a5266; /* bumped from mockup #5a6275 for WCAG AA on #f4f5f8 */
  --xg-accent: #7c3aed;
  --xg-accent-soft: #7c3aed22;
  --xg-cool: #0284c7;
  --xg-industrial: #c2410c;
  --xg-top: #0d9488;
  --xg-rivet: #c7cad5;
  --xg-metal-1: #e1e3eb;
  --xg-metal-2: #d0d3de;
}

html[data-accent="prusse"] {
  --xg-accent: #1d4e89;
  --xg-accent-soft: #1d4e8933;
}
html[data-accent="violet"] {
  --xg-accent: #a855f7;
  --xg-accent-soft: #a855f733;
}
html[data-accent="amber"] {
  --xg-accent: #fb923c;
  --xg-accent-soft: #fb923c33;
}
```

- [ ] **1.5: Replace the FOUC script in `BaseLayout.astro`**

In `src/layouts/BaseLayout.astro`, find the existing inline script (lines 68–75):

```html
<script is:inline>
  (function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

Replace it with:

```html
<script is:inline>
  (function() {
    const root = document.documentElement;
    // Theme: dark by default; legacy 'theme' key still respected for users who toggled before
    const legacy = localStorage.getItem('theme');
    const xgTheme = localStorage.getItem('xg-theme');
    const theme = xgTheme || legacy || 'dark';
    root.dataset.theme = theme;
    if (theme === 'dark') root.classList.add('dark'); // keep legacy class for old --color-* rules
    // Accent: prusse default
    const accent = localStorage.getItem('xg-accent') || 'prusse';
    root.dataset.accent = accent;
  })();
</script>
```

- [ ] **1.6: Verify build**

```bash
pnpm build
```

Expected: build passes. The site looks unchanged in dev (`pnpm dev`, open `http://localhost:4321`).

- [ ] **1.7: Smoke-check the new tokens are reachable**

Open `http://localhost:4321` (with `pnpm dev`), open DevTools, in the console run:

```js
getComputedStyle(document.documentElement).getPropertyValue('--xg-accent')
```

Expected: `#1d4e89` (prusse default). Also check `document.documentElement.dataset.theme === 'dark'` and `dataset.accent === 'prusse'`.

- [ ] **1.8: Commit**

```bash
git add package.json pnpm-lock.yaml src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "$(cat <<'EOF'
chore(deps): add display fonts and elevator theming tokens

Adds Space Grotesk and JetBrains Mono via @fontsource. Introduces the
--xg-* palette (dark/light + accent variants violet/prusse/amber) used
by the upcoming elevator redesign. The legacy --color-* palette stays
in place; deep routes still depend on it until phase 7. The inline FOUC
script now applies data-theme and data-accent before the first paint.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Atomic UI primitives

**Goal:** Create the four reusable Astro components that the floors and the reskinned listings will compose. Pure presentation, no logic.

**Files:**
- Create: `src/components/ui/FuseCard.astro`
- Create: `src/components/ui/AptItem.astro`
- Create: `src/components/ui/GitLogRow.astro`
- Create: `src/components/ui/ManPageBlock.astro`

### Tasks

- [ ] **2.1: Create the `ui/` directory**

```bash
mkdir -p src/components/ui
```

- [ ] **2.2: Write `FuseCard.astro`**

`src/components/ui/FuseCard.astro` — a "fuse box" card with rivets, optional cover image, optional label, title, body, and state badge. Matches the `.fuse` block in the mockup (lines 604–668 of `tmp/maquette-xgueret.html`).

```astro
---
interface Props {
  href?: string;
  label?: string;        // e.g. "// 2026-03 · IAC"
  title: string;
  description?: string;
  cover?: string;        // background-image URL
  state?: 'running' | 'deployed' | 'wip';
  stateLabel?: string;   // "PUBLIÉ" | "RUNNING" | "DEPLOYED" | "WIP"
}
const { href, label, title, description, cover, state, stateLabel } = Astro.props;
const Tag = href ? 'a' : 'div';
const linkAttrs = href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: href.startsWith('http') ? 'noopener' : undefined } : {};
---
<Tag class:list={['fuse', href && 'fuse-link']} {...linkAttrs}>
  <span class="fuse-rivet a"></span>
  <span class="fuse-rivet b"></span>
  <span class="fuse-rivet c"></span>
  <span class="fuse-rivet d"></span>
  {cover && <div class="fuse-cover" style={`background-image:url('${cover}')`}></div>}
  {label && <div class="label">{label}</div>}
  <h3>{title}</h3>
  {description && <p>{description}</p>}
  {state && stateLabel && (
    <span class:list={['state', state]}>
      <span class="dot"></span>{stateLabel}
    </span>
  )}
</Tag>

<style is:global>
  .fuse {
    background: var(--xg-card);
    border: 1px solid var(--xg-border);
    border-radius: 6px;
    padding: 22px;
    position: relative;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    text-decoration: none;
    color: inherit;
    display: block;
  }
  .fuse-link { transition: transform 0.2s ease, border-color 0.2s ease; }
  .fuse-link:hover { transform: translateY(-2px); border-color: var(--xg-accent); }
  .fuse-rivet {
    position: absolute;
    width: 6px; height: 6px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #4a4d65, #1c1e2c 80%);
  }
  .fuse-rivet.a { top: 8px; left: 8px; }
  .fuse-rivet.b { top: 8px; right: 8px; }
  .fuse-rivet.c { bottom: 8px; left: 8px; }
  .fuse-rivet.d { bottom: 8px; right: 8px; }
  .fuse-cover {
    width: calc(100% + 44px);
    margin: -22px -22px 18px;
    height: 140px;
    background-size: cover;
    background-position: center;
    background-color: #0f1120;
    border-bottom: 1px solid var(--xg-border);
    filter: saturate(0.85);
  }
  .fuse .label {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--xg-muted);
    letter-spacing: 2px;
    margin-bottom: 10px;
  }
  .fuse h3 {
    font-family: var(--font-display);
    font-size: 22px;
    margin: 0 0 10px;
    letter-spacing: -0.01em;
    color: var(--xg-text);
  }
  .fuse p {
    color: var(--xg-muted);
    font-size: 13.5px;
    line-height: 1.6;
    margin: 0 0 18px;
  }
  .fuse .state {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    padding: 5px 10px;
    border-radius: 3px;
    background: #0a0c16;
    border: 1px solid var(--xg-border);
  }
  .fuse .dot { width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .fuse .state.running { color: var(--xg-cool); }
  .fuse .state.running .dot { background: var(--xg-cool); animation: xg-pulse 1.4s infinite; }
  .fuse .state.deployed { color: #4ade80; }
  .fuse .state.deployed .dot { background: #4ade80; }
  .fuse .state.wip { color: var(--xg-industrial); }
  .fuse .state.wip .dot { background: var(--xg-industrial); }
  @keyframes xg-pulse { 50% { opacity: 0.3; } }
</style>
```

- [ ] **2.3: Write `AptItem.astro`**

`src/components/ui/AptItem.astro` — apt-list-style skill row with progress bar.

```astro
---
interface Props {
  pkg: string;       // e.g. "automatisation"
  ver: string;       // e.g. "terraform / ansible"
  percent: number;   // 0..100
  status: string;    // e.g. "infrastructures reproductibles"
}
const { pkg, ver, percent, status } = Astro.props;
---
<div class="apt">
  <span class="pkg">{pkg}</span><span class="ver">{ver}</span>
  <div class="bar"><span style={`width:${Math.max(0, Math.min(100, percent))}%`}></span></div>
  <div class="status">{status}</div>
</div>

<style is:global>
  .apt {
    background: var(--xg-card);
    border: 1px solid var(--xg-border);
    border-left: 3px solid var(--xg-accent);
    padding: 14px 16px;
    font-family: var(--font-mono);
    font-size: 12px;
    border-radius: 0 4px 4px 0;
  }
  .apt .pkg { color: var(--xg-text); font-weight: 600; }
  .apt .ver { color: var(--xg-muted); margin-left: 8px; }
  .apt .bar {
    margin-top: 10px;
    height: 4px;
    background: #0a0c16;
    border-radius: 2px;
    overflow: hidden;
  }
  .apt .bar > span {
    display: block; height: 100%;
    background: linear-gradient(90deg, var(--xg-accent), var(--xg-cool));
  }
  .apt .status {
    color: var(--xg-cool);
    font-size: 10px;
    margin-top: 6px;
    letter-spacing: 1px;
  }
</style>
```

- [ ] **2.4: Write `GitLogRow.astro`**

`src/components/ui/GitLogRow.astro` — gitlog-style certification row.

```astro
---
interface Props {
  hash: string;        // e.g. "CKA"
  date: string;        // e.g. "2023"
  message: string;
  href?: string;
}
const { hash, date, message, href } = Astro.props;
---
<div class="gitlog-row">
  <span class="hash">{hash}</span>
  <span class="date">{date}</span>
  <span class="msg">
    {href ? (
      <a href={href} target="_blank" rel="noopener">
        {message} <span class="ref">↗</span>
      </a>
    ) : (
      message
    )}
  </span>
</div>

<style is:global>
  .gitlog {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.9;
    background: var(--xg-surface);
    border: 1px solid var(--xg-border);
    border-radius: 6px;
    padding: 24px 28px;
    max-width: 760px;
  }
  .gitlog-row {
    display: grid;
    grid-template-columns: 80px 110px 1fr;
    gap: 18px;
    align-items: baseline;
  }
  .gitlog-row .hash { color: var(--xg-industrial); }
  .gitlog-row .date { color: var(--xg-muted); }
  .gitlog-row .msg { color: var(--xg-text); }
  .gitlog-row .msg a { color: var(--xg-text); text-decoration: none; }
  .gitlog-row .msg a:hover { color: var(--xg-accent); }
  .gitlog-row .msg .ref { color: var(--xg-cool); }
</style>
```

- [ ] **2.5: Write `ManPageBlock.astro`**

`src/components/ui/ManPageBlock.astro` — a single H4 + indented body section, used to compose man-page-style listings.

```astro
---
interface Props {
  heading: string;     // e.g. "NAME", "SYNOPSIS"
}
const { heading } = Astro.props;
---
<h4 class="manpage-h">{heading}</h4>
<div class="manpage-indent"><slot /></div>

<style is:global>
  .manpage {
    max-width: 820px;
    font-size: 13px;
    line-height: 1.85;
    color: var(--xg-text);
    font-family: var(--font-mono);
  }
  .manpage-h {
    font-size: 12px;
    letter-spacing: 4px;
    color: var(--xg-text);
    text-transform: uppercase;
    margin: 28px 0 8px;
    border-bottom: 1px solid var(--xg-border);
    padding-bottom: 4px;
  }
  .manpage-indent { padding-left: 24px; color: var(--xg-muted); }
  .manpage-indent strong { color: var(--xg-text); font-weight: 500; }
  .manpage-indent code { color: var(--xg-cool); }
</style>
```

- [ ] **2.6: Verify build**

```bash
pnpm build
```

Expected: build passes. The components don't render anywhere yet; we're checking that the Astro/TS types are valid and the styles parse.

- [ ] **2.7: Commit**

```bash
git add src/components/ui/
git commit -m "$(cat <<'EOF'
feat(ui): add atomic UI primitives for elevator redesign

FuseCard (industrial card with rivets + state badge), AptItem (apt-list
row with progress bar), GitLogRow (gitlog-style row), ManPageBlock
(man-page heading + indent). All scoped to the new --xg-* token set;
not yet used anywhere.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Static elevator chrome

**Goal:** Build the visual shell of the elevator panel (LCD + hex buttons + arrows), the HUD (status strip + theme toggle), and the desktop-only tweaks panel (accent switcher). Pure presentation, no JS behaviour yet — phase 4 wires them up.

**Files:**
- Create: `src/components/elevator/ElevatorPanel.astro`
- Create: `src/components/elevator/ElevatorHUD.astro`
- Create: `src/components/elevator/ElevatorTweaks.astro`
- Create: `src/components/elevator/elevator.css` (shared styles imported by all three)
- Modify: `src/i18n/fr.ts` and `src/i18n/en.ts` (add minimal HUD/panel keys; full keyset comes in phase 5)

### Tasks

- [ ] **3.1: Create the `elevator/` directory**

```bash
mkdir -p src/components/elevator
```

- [ ] **3.2: Add minimal i18n keys for the chrome**

In `src/i18n/fr.ts`, add inside the exported object (before the closing `} as const;`):

```ts
  // Elevator (chrome only — full keyset added in phase 5)
  elevator_hud_online: 'SYS::ONLINE',
  elevator_hud_build: 'BUILD 2026.04.26',
  elevator_hud_location: 'GUADELOUPE · UTC-4',
  elevator_hud_dark: 'DARK',
  elevator_hud_light: 'LIGHT',
  elevator_panel_label: "Panneau de contrôle d'ascenseur",
  elevator_lcd_label: 'étage',
  elevator_btn_up: 'Étage supérieur',
  elevator_btn_down: 'Étage inférieur',
  elevator_floor_code_rdc: 'RDC',
  elevator_floor_code_01: '01',
  elevator_floor_code_02: '02',
  elevator_floor_code_03: '03',
  elevator_floor_code_04: '04',
  elevator_floor_code_top: 'TOP',
  elevator_floor_label_rdc: 'Accueil',
  elevator_floor_label_01: 'CV',
  elevator_floor_label_02: 'Articles',
  elevator_floor_label_03: 'Projets',
  elevator_floor_label_04: 'Formations',
  elevator_floor_label_top: 'Contact',
  elevator_tweaks_title: 'Tweaks',
  elevator_tweaks_accent: 'Accent signature',
  elevator_tweaks_violet: 'Violet',
  elevator_tweaks_prusse: 'Prusse',
  elevator_tweaks_amber: 'Ambre',
```

In `src/i18n/en.ts`, add the same keys with English values:

```ts
  elevator_hud_online: 'SYS::ONLINE',
  elevator_hud_build: 'BUILD 2026.04.26',
  elevator_hud_location: 'GUADELOUPE · UTC-4',
  elevator_hud_dark: 'DARK',
  elevator_hud_light: 'LIGHT',
  elevator_panel_label: 'Elevator control panel',
  elevator_lcd_label: 'floor',
  elevator_btn_up: 'Upper floor',
  elevator_btn_down: 'Lower floor',
  elevator_floor_code_rdc: 'RDC',
  elevator_floor_code_01: '01',
  elevator_floor_code_02: '02',
  elevator_floor_code_03: '03',
  elevator_floor_code_04: '04',
  elevator_floor_code_top: 'TOP',
  elevator_floor_label_rdc: 'Home',
  elevator_floor_label_01: 'Resume',
  elevator_floor_label_02: 'Posts',
  elevator_floor_label_03: 'Projects',
  elevator_floor_label_04: 'Training',
  elevator_floor_label_top: 'Contact',
  elevator_tweaks_title: 'Tweaks',
  elevator_tweaks_accent: 'Signature accent',
  elevator_tweaks_violet: 'Violet',
  elevator_tweaks_prusse: 'Prussian',
  elevator_tweaks_amber: 'Amber',
```

> Floor codes (`RDC`, `01`, `02`, `03`, `04`, `TOP`) intentionally identical in both locales — they are universal building signage.

- [ ] **3.3: Write `elevator.css`**

`src/components/elevator/elevator.css` — shared styles for panel, HUD, tweaks, doors. Uses `--xg-*` tokens. Faithful port from `tmp/maquette-xgueret.html` (lines 191–414 + 695–840), but every CSS variable rewritten to `--xg-*`. Full file:

```css
/* ---------- Subtle SVG noise grain on everything ---------- */
body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  pointer-events: none; z-index: 9999; opacity: 0.5;
}
html[data-theme="light"] body::before { opacity: 0.25; }

/* ---------- Elevator Panel (left, desktop) ---------- */
.xg-panel {
  position: fixed;
  left: 24px; top: 50%;
  transform: translateY(-50%);
  width: 180px;
  background: linear-gradient(180deg, #1c1f2c 0%, #16182a 50%, #14162a 100%);
  border-radius: 14px;
  padding: 20px 14px 24px;
  z-index: 1000;
  box-shadow:
    0 30px 60px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.04),
    inset 0 -1px 0 rgba(0,0,0,0.4);
  border: 1px solid #0d0f1a;
}
html[data-theme="light"] .xg-panel {
  background: linear-gradient(180deg, #f0f1f5 0%, #e4e6ed 50%, #dadce5 100%);
  border: 1px solid #c2c5d0;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
}
.xg-panel.shake { animation: xg-shake 0.45s ease; }
@keyframes xg-shake {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  20% { transform: translateY(-49.4%) translateX(-1px); }
  40% { transform: translateY(-50.4%) translateX(1px); }
  60% { transform: translateY(-49.6%) translateX(-1px); }
  80% { transform: translateY(-50.2%) translateX(0.5px); }
}
.xg-panel::before {
  content: '';
  position: absolute; inset: 8px;
  border-radius: 10px;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, #1f2233, #15172a);
  pointer-events: none;
  z-index: 0;
}
html[data-theme="light"] .xg-panel::before {
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, #ebedf2, #dcdfe7);
}
.xg-panel > * { position: relative; z-index: 1; }

.xg-rivet {
  position: absolute;
  width: 8px; height: 8px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #4a4d65, #1c1e2c 80%);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 1px rgba(0,0,0,0.6);
}
.xg-rivet.tl { top: 8px; left: 8px; }
.xg-rivet.tr { top: 8px; right: 8px; }
.xg-rivet.bl { bottom: 8px; left: 8px; }
.xg-rivet.br { bottom: 8px; right: 8px; }

.xg-lcd {
  background: #0a0a10;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 10px 8px;
  margin-bottom: 16px;
  text-align: center;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.9);
}
html[data-theme="light"] .xg-lcd { background: #1a1c2a; }
.xg-lcd-screen {
  font-family: var(--font-mono);
  color: var(--xg-industrial);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(251,146,60,0.7), 0 0 14px rgba(251,146,60,0.3);
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 2px);
  padding: 4px 0;
}
.xg-lcd-label {
  font-family: var(--font-mono);
  font-size: 8px;
  color: #555870;
  letter-spacing: 2px;
  margin-top: 4px;
  text-transform: uppercase;
}

.xg-floor-btns {
  display: flex; flex-direction: column; gap: 10px;
  align-items: stretch;
  position: relative;
}
.xg-hex-row {
  display: flex; align-items: center; gap: 10px;
  position: relative; z-index: 1;
}
.xg-hex-row .xg-hex-label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #6c7290;
  text-transform: uppercase;
  flex: 1;
  white-space: nowrap;
  transition: color 0.2s;
}
.xg-hex-row:hover .xg-hex-label { color: #c4c8de; }
.xg-hex-row.is-active .xg-hex-label { color: var(--xg-text); }
.xg-cable {
  position: absolute;
  left: 50%; top: 28px; bottom: 28px;
  width: 2px;
  background: linear-gradient(180deg, transparent, #2a2d3e 12%, #2a2d3e 88%, transparent);
  transform: translateX(-50%);
  z-index: 0;
}

.xg-hex {
  --size: 44px;
  width: var(--size); height: calc(var(--size) * 1.05);
  position: relative;
  display: flex; align-items: center; justify-content: center;
  background: var(--xg-metal-1);
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  cursor: pointer;
  border: none;
  color: #6c7290;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.2s ease;
  z-index: 1;
  text-decoration: none;
}
.xg-hex::before {
  content: '';
  position: absolute; inset: 2px;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  background: linear-gradient(180deg, #232638, #16182a);
  z-index: -1;
}
html[data-theme="light"] .xg-hex { background: #d2d5de; color: #6c7290; }
html[data-theme="light"] .xg-hex::before { background: linear-gradient(180deg, #e6e8ee, #c8cbd6); }
.xg-hex:hover { color: #c4c8de; }
.xg-hex.active {
  background: var(--xg-accent);
  color: white;
  box-shadow: 0 0 18px var(--xg-accent), 0 0 36px var(--xg-accent-soft);
}
.xg-hex.active::before {
  background: linear-gradient(180deg, color-mix(in srgb, var(--xg-accent) 70%, white 0%), color-mix(in srgb, var(--xg-accent) 90%, black 10%));
}
.xg-hex.top.active { background: var(--xg-top); box-shadow: 0 0 18px var(--xg-top), 0 0 36px #2dd4bf33; }
.xg-hex.top.active::before { background: linear-gradient(180deg, #5eead4, #14b8a6); }

.xg-arrows {
  display: flex; justify-content: space-between;
  margin-top: 14px; padding: 0 4px;
}
.xg-arrow {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(180deg, #232638, #15172a);
  border: 1px solid #0a0c16;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.5);
  color: var(--xg-cool);
  font-size: 14px;
  cursor: pointer;
  display: grid; place-items: center;
  transition: all 0.15s ease;
}
.xg-arrow:hover { color: white; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 0 10px var(--xg-cool); }
.xg-arrow:disabled { opacity: 0.3; cursor: not-allowed; }

/* ---------- HUD ---------- */
.xg-hud {
  position: fixed;
  top: 18px; right: 24px;
  display: flex; gap: 14px; align-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--xg-muted);
  letter-spacing: 2px;
  z-index: 700;
}
.xg-hud > span::before {
  content: '●'; margin-right: 6px; color: var(--xg-cool);
}
.xg-hud .ok::before { color: #4ade80; }
.xg-hud .warn::before { color: var(--xg-industrial); }
.xg-theme-toggle {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--xg-surface);
  border: 1px solid var(--xg-border);
  color: var(--xg-text);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  padding: 4px 10px;
  border-radius: 3px;
  cursor: pointer;
  line-height: 1; height: 22px;
  transition: all 0.15s ease;
}
.xg-theme-toggle:hover { border-color: var(--xg-accent); color: var(--xg-accent); }
.xg-theme-toggle .tt-icon { font-size: 12px; line-height: 1; }

/* ---------- Tweaks panel (desktop only) ---------- */
.xg-tweaks {
  position: fixed;
  bottom: 18px; right: 18px;
  background: var(--xg-surface);
  border: 1px solid var(--xg-border);
  border-radius: 6px;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--xg-muted);
  z-index: 600;
  display: flex; gap: 14px; align-items: center;
}
.xg-tweaks legend {
  display: block;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.xg-tweaks .swatches { display: flex; gap: 6px; }
.xg-tweaks .swatch {
  width: 18px; height: 18px;
  border-radius: 50%;
  border: 1px solid var(--xg-border);
  cursor: pointer;
  transition: transform 0.12s, box-shadow 0.12s;
}
.xg-tweaks .swatch[data-accent="violet"]  { background: #a855f7; }
.xg-tweaks .swatch[data-accent="prusse"]  { background: #1d4e89; }
.xg-tweaks .swatch[data-accent="amber"]   { background: #fb923c; }
.xg-tweaks .swatch[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--xg-accent), 0 0 12px var(--xg-accent-soft); }
.xg-tweaks .swatch:hover { transform: scale(1.1); }

/* ---------- Mobile ---------- */
@media (max-width: 800px) {
  .xg-panel {
    left: 12px; right: 12px; bottom: 12px; top: auto;
    width: auto; transform: none;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
  }
  .xg-panel.shake { animation: xg-shake-h 0.4s ease; }
  @keyframes xg-shake-h {
    0%,100% { transform: translateX(0); }
    30% { transform: translateX(-2px); }
    70% { transform: translateX(2px); }
  }
  .xg-lcd { margin-bottom: 0; padding: 6px 10px; flex: 0 0 auto; }
  .xg-floor-btns { flex-direction: row; gap: 6px; flex: 1; justify-content: space-around; }
  .xg-hex-row { flex-direction: column; gap: 2px; align-items: center; }
  .xg-hex-row .xg-hex-label { font-size: 8px; letter-spacing: 1px; }
  .xg-cable {
    left: 10%; right: 10%; top: 50%; bottom: auto;
    height: 2px; width: auto;
    background: linear-gradient(90deg, transparent, #2a2d3e 12%, #2a2d3e 88%, transparent);
  }
  .xg-arrows { flex-direction: column; gap: 4px; margin-top: 0; }
  .xg-arrow { width: 28px; height: 28px; }
  .xg-hex { --size: 36px; }
  .xg-hud .desktop-only { display: none; }
  .xg-tweaks { display: none; }
}
```

- [ ] **3.4: Write `ElevatorHUD.astro`**

`src/components/elevator/ElevatorHUD.astro` — top-right HUD with status pings + theme toggle.

```astro
---
import { type Locale, t } from '../../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
---
<div class="xg-hud" role="status" aria-live="polite">
  <span class="ok">{t(locale, 'elevator_hud_online')}</span>
  <span class="desktop-only">{t(locale, 'elevator_hud_build')}</span>
  <span class="warn desktop-only">{t(locale, 'elevator_hud_location')}</span>
  <button
    class="xg-theme-toggle"
    type="button"
    data-xg-theme-toggle
    aria-label={t(locale, 'elevator_hud_dark') + ' / ' + t(locale, 'elevator_hud_light')}
  >
    <span class="tt-icon" aria-hidden="true">☾</span>
    <span class="tt-label">{t(locale, 'elevator_hud_dark')}</span>
  </button>
</div>
```

- [ ] **3.5: Write `ElevatorPanel.astro`**

`src/components/elevator/ElevatorPanel.astro` — LCD + hex column + arrows. Receives `currentFloor` (default `0` on home; for deep routes the layout passes the matching floor index, see phase 6).

```astro
---
import { type Locale, t } from '../../i18n';
interface Props {
  locale: Locale;
  currentFloor?: number;     // 0..5; undefined → 0
  homeHref?: string;          // '' for FR home, '/en' for EN home
}
const { locale, currentFloor = 0, homeHref = '' } = Astro.props;

const FLOORS = [
  { idx: 0, codeKey: 'elevator_floor_code_rdc', labelKey: 'elevator_floor_label_rdc', hash: '' },
  { idx: 1, codeKey: 'elevator_floor_code_01',  labelKey: 'elevator_floor_label_01',  hash: '#01' },
  { idx: 2, codeKey: 'elevator_floor_code_02',  labelKey: 'elevator_floor_label_02',  hash: '#02' },
  { idx: 3, codeKey: 'elevator_floor_code_03',  labelKey: 'elevator_floor_label_03',  hash: '#03' },
  { idx: 4, codeKey: 'elevator_floor_code_04',  labelKey: 'elevator_floor_label_04',  hash: '#04' },
  { idx: 5, codeKey: 'elevator_floor_code_top', labelKey: 'elevator_floor_label_top', hash: '#TOP' },
] as const;

// Render TOP at top, RDC at bottom (real elevator panel ordering)
const ordered = [...FLOORS].reverse();
const lcdCode = t(locale, FLOORS[currentFloor]?.codeKey ?? 'elevator_floor_code_rdc');
---
<aside class="xg-panel" data-xg-panel aria-label={t(locale, 'elevator_panel_label')}>
  <span class="xg-rivet tl"></span>
  <span class="xg-rivet tr"></span>
  <span class="xg-rivet bl"></span>
  <span class="xg-rivet br"></span>

  <div class="xg-lcd">
    <div class="xg-lcd-screen" data-xg-lcd aria-live="polite">{lcdCode}</div>
    <div class="xg-lcd-label">{t(locale, 'elevator_lcd_label')}</div>
  </div>

  <div class="xg-floor-btns" data-xg-floor-btns>
    <span class="xg-cable"></span>
    {ordered.map((f) => (
      <div class:list={['xg-hex-row', f.idx === currentFloor && 'is-active']} data-floor={f.idx}>
        <a
          class:list={['xg-hex', f.idx === 5 && 'top', f.idx === currentFloor && 'active']}
          data-floor={f.idx}
          href={`${homeHref}/${f.hash}`}
          aria-label={`${t(locale, f.codeKey)} — ${t(locale, f.labelKey)}`}
        >
          {t(locale, f.codeKey)}
        </a>
        <span class="xg-hex-label">{t(locale, f.labelKey)}</span>
      </div>
    ))}
  </div>

  <div class="xg-arrows">
    <button class="xg-arrow" data-xg-up type="button" aria-label={t(locale, 'elevator_btn_up')}>▲</button>
    <button class="xg-arrow" data-xg-down type="button" aria-label={t(locale, 'elevator_btn_down')}>▼</button>
  </div>
</aside>
```

- [ ] **3.6: Write `ElevatorTweaks.astro`**

`src/components/elevator/ElevatorTweaks.astro` — desktop accent switcher (3 swatches).

```astro
---
import { type Locale, t } from '../../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
---
<fieldset class="xg-tweaks" data-xg-tweaks>
  <legend>{t(locale, 'elevator_tweaks_accent')}</legend>
  <div class="swatches" role="radiogroup">
    <button class="swatch" type="button" data-accent="violet" aria-label={t(locale, 'elevator_tweaks_violet')} aria-pressed="false"></button>
    <button class="swatch" type="button" data-accent="prusse" aria-label={t(locale, 'elevator_tweaks_prusse')} aria-pressed="true"></button>
    <button class="swatch" type="button" data-accent="amber"  aria-label={t(locale, 'elevator_tweaks_amber')}  aria-pressed="false"></button>
  </div>
</fieldset>
```

- [ ] **3.7: Mount the chrome on a temporary preview**

To smoke-test phase 3 without touching `BaseLayout` yet (which is phase 6's job), append a temporary include block at the bottom of `src/pages/index.astro` (NOT in BaseLayout). Open `src/pages/index.astro`, find the closing `</BaseLayout>` tag, and just before it add:

```astro
<!-- TEMP phase-3 preview, removed in phase 6 -->
<style>@import '../components/elevator/elevator.css';</style>
<Fragment set:html={Astro.slots.has('default') ? '' : ''} />
```

…and add the imports at top of the same file:

```astro
import ElevatorPanel from '../components/elevator/ElevatorPanel.astro';
import ElevatorHUD from '../components/elevator/ElevatorHUD.astro';
import ElevatorTweaks from '../components/elevator/ElevatorTweaks.astro';
```

Then before `</BaseLayout>`:

```astro
<ElevatorHUD locale={locale} />
<ElevatorPanel locale={locale} />
<ElevatorTweaks locale={locale} />
```

(`locale` is already declared at the top of `src/pages/index.astro`.)

- [ ] **3.8: Verify visually**

```bash
pnpm dev
```

Open `http://localhost:4321/`. Expected:
- Top-right HUD with three pings + theme toggle button (`☾ DARK`)
- Left side panel with LCD reading `RDC`, six hex buttons (TOP at top, RDC at bottom), up/down arrows
- Bottom-right tweaks panel with three swatches (prusse highlighted)
- Nothing is interactive yet (clicks do nothing, theme toggle does nothing). That's expected; phase 4 wires logic.
- The site's existing content (Hero, ArticlesGrid, etc.) still renders below the panel.

- [ ] **3.9: Verify mobile layout**

Resize the browser to < 800px wide (or use DevTools mobile emulation). Expected:
- Panel moves to bottom bar
- HUD hides build/location
- Tweaks panel hides

- [ ] **3.10: Revert temp preview, keep components**

Revert the temp block in `src/pages/index.astro` (we'll mount the chrome properly via `BaseLayout` in phase 6). Remove the three imports + the three component invocations + the `<style>` import. The components themselves and `elevator.css` stay.

- [ ] **3.11: Verify build**

```bash
pnpm build
```

Expected: build passes. Site looks identical to baseline (chrome not yet mounted globally).

- [ ] **3.12: Commit**

```bash
git add src/components/elevator/ src/i18n/
git commit -m "$(cat <<'EOF'
feat(elevator): add static panel, HUD, and tweaks chrome

Three Astro components rendering the elevator's visual shell with no
behaviour wired yet: ElevatorPanel (LCD + hex column + arrows),
ElevatorHUD (status strip + theme toggle button), ElevatorTweaks
(desktop accent switcher). Shared styles in elevator.css use the new
--xg-* token set. Adds the minimal i18n keys needed by the chrome.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Elevator navigation logic

**Goal:** Add the JS controller that drives floor changes (with door/streak/flash/toast animations on the home), reads/writes the URL hash, syncs the LCD, handles keyboard navigation, persists theme/accent to `localStorage`, and falls back gracefully on deep routes (where there are no floor sections in the DOM).

**Files:**
- Create: `src/components/elevator/ElevatorDoors.astro`
- Create: `src/components/elevator/elevator.client.ts`
- Modify: `src/components/elevator/elevator.css` (append doors + streaks + toast styles + arrival animations)

### Tasks

- [ ] **4.1: Write `ElevatorDoors.astro`**

`src/components/elevator/ElevatorDoors.astro` — overlay rendered on the home only. Empty containers; the JS controller toggles classes on them.

```astro
---
---
<div class="xg-streaks" data-xg-streaks aria-hidden="true">
  <span class="xg-streak" style="top:8%"></span>
  <span class="xg-streak" style="top:22%"></span>
  <span class="xg-streak" style="top:38%"></span>
  <span class="xg-streak" style="top:54%"></span>
  <span class="xg-streak" style="top:70%"></span>
  <span class="xg-streak" style="top:86%"></span>
</div>
<div class="xg-arrival" data-xg-arrival role="status" aria-live="polite" aria-hidden="true"></div>
<div class="xg-doors" data-xg-doors aria-hidden="true">
  <div class="xg-door left">
    <span class="xg-rivet a"></span>
    <span class="xg-rivet b"></span>
  </div>
  <div class="xg-door right">
    <span class="xg-rivet a"></span>
    <span class="xg-rivet b"></span>
  </div>
</div>
<div class="xg-door-seam" data-xg-seam></div>
<div class="xg-door-flash" data-xg-flash></div>
```

- [ ] **4.2: Append doors/streaks/toast styles + floor stage to `elevator.css`**

Append to the end of `src/components/elevator/elevator.css`:

```css
/* ---------- Stage / floors ---------- */
.xg-stage {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  overflow: hidden;
}
.xg-floor {
  position: absolute;
  inset: 0;
  padding: 56px 72px 56px 250px;
  overflow-y: auto;
  overflow-x: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.xg-floor.active { opacity: 1; pointer-events: auto; }
.xg-floor::-webkit-scrollbar { width: 6px; }
.xg-floor::-webkit-scrollbar-thumb { background: var(--xg-border); }

@keyframes xg-arrive-up {
  0%   { transform: translateY(60px) scale(1.015); filter: blur(2px); opacity: 0; }
  35%  { opacity: 1; }
  70%  { transform: translateY(-6px) scale(1); filter: blur(0); }
  100% { transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes xg-arrive-down {
  0%   { transform: translateY(-60px) scale(1.015); filter: blur(2px); opacity: 0; }
  35%  { opacity: 1; }
  70%  { transform: translateY(6px) scale(1); filter: blur(0); }
  100% { transform: translateY(0) scale(1); filter: blur(0); }
}
.xg-floor.arriving-up   { animation: xg-arrive-up   720ms cubic-bezier(.2,.7,.25,1) both; }
.xg-floor.arriving-down { animation: xg-arrive-down 720ms cubic-bezier(.2,.7,.25,1) both; }

/* ---------- Streaks ---------- */
.xg-streaks {
  position: fixed; inset: 0;
  z-index: 600;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
}
.xg-streaks.fire { opacity: 1; }
.xg-streak {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--xg-cool) 40%, var(--xg-cool) 60%, transparent);
  box-shadow: 0 0 12px var(--xg-cool);
  opacity: 0;
}
.xg-streaks.fire.up   .xg-streak { animation: xg-streak-up   650ms ease-out forwards; }
.xg-streaks.fire.down .xg-streak { animation: xg-streak-down 650ms ease-out forwards; }
@keyframes xg-streak-up {
  0%   { transform: translateY(110vh); opacity: 0; }
  20%  { opacity: 0.9; }
  100% { transform: translateY(-30vh); opacity: 0; }
}
@keyframes xg-streak-down {
  0%   { transform: translateY(-30vh); opacity: 0; }
  20%  { opacity: 0.9; }
  100% { transform: translateY(110vh); opacity: 0; }
}

/* ---------- Arrival toast ---------- */
.xg-arrival {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.92);
  z-index: 803;
  background: rgba(13,15,26,0.85);
  border: 1px solid var(--xg-accent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 14px 26px;
  border-radius: 4px;
  font-family: var(--font-mono);
  color: var(--xg-text);
  letter-spacing: 4px;
  font-size: 13px;
  box-shadow: 0 0 30px var(--xg-accent-soft), inset 0 1px 0 rgba(255,255,255,0.08);
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
}
.xg-arrival.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}
.xg-arrival .arrow-icon {
  color: var(--xg-cool);
  margin-right: 10px;
  display: inline-block;
}
.xg-arrival .floor-num { color: var(--xg-industrial); margin-right: 8px; }

/* ---------- Doors ---------- */
.xg-doors {
  position: fixed; inset: 0;
  z-index: 800;
  pointer-events: none;
  display: flex;
}
.xg-door {
  width: 50%;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 6px),
    linear-gradient(180deg, #2a2d3e 0%, #1a1c2a 50%, #25283a 100%);
  position: relative;
  transition: transform 700ms cubic-bezier(0.7, 0, 0.3, 1);
  box-shadow: inset 0 0 80px rgba(0,0,0,0.5);
}
html[data-theme="light"] .xg-door {
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 6px),
    linear-gradient(180deg, #d8dbe4 0%, #b8bbc8 50%, #cdd0db 100%);
}
.xg-door.left { transform: translateX(-100%); }
.xg-door.right { transform: translateX(100%); }
.xg-doors.closing .xg-door.left,
.xg-doors.closing .xg-door.right { transform: translateX(0); }
.xg-doors.opening .xg-door.left { transform: translateX(-100%); transition-duration: 600ms; }
.xg-doors.opening .xg-door.right { transform: translateX(100%); transition-duration: 600ms; }
.xg-door .xg-rivet { position: absolute; }
.xg-door.left .xg-rivet.a { top: 18px; right: 18px; }
.xg-door.left .xg-rivet.b { bottom: 18px; right: 18px; }
.xg-door.right .xg-rivet.a { top: 18px; left: 18px; }
.xg-door.right .xg-rivet.b { bottom: 18px; left: 18px; }

.xg-door-seam {
  position: fixed;
  top: 0; bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--xg-cool);
  box-shadow: 0 0 24px var(--xg-cool), 0 0 48px var(--xg-cool);
  opacity: 0;
  z-index: 801;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.xg-doors.closing ~ .xg-door-seam,
.xg-doors.opening ~ .xg-door-seam { opacity: 1; }
.xg-door-flash {
  position: fixed; inset: 0;
  background: white;
  opacity: 0;
  z-index: 802;
  pointer-events: none;
}
.xg-door-flash.fire { animation: xg-flash 360ms ease-out; }
@keyframes xg-flash {
  0% { opacity: 0; }
  20% { opacity: 0.4; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .xg-door,
  .xg-doors.closing .xg-door,
  .xg-doors.opening .xg-door {
    transition: opacity 200ms ease !important;
    transform: translateX(-100%) !important;
  }
  .xg-doors.closing .xg-door.left,
  .xg-doors.closing .xg-door.right { transform: none !important; opacity: 1; }
  .xg-panel.shake { animation: none; }
  .xg-floor.arriving-up,
  .xg-floor.arriving-down { animation: none; }
}
```

- [ ] **4.3: Write `elevator.client.ts`**

`src/components/elevator/elevator.client.ts` — full controller. Uses module-scope state + DOM event delegation. Detects whether floors are present (home page) or not (deep route) and adapts.

```ts
type FloorIdx = 0 | 1 | 2 | 3 | 4 | 5;
type HashCode = '' | '01' | '02' | '03' | '04' | 'TOP';

const HASH_BY_IDX: Record<FloorIdx, HashCode> = {
  0: '', 1: '01', 2: '02', 3: '03', 4: '04', 5: 'TOP',
};
const IDX_BY_HASH: Record<string, FloorIdx> = {
  '': 0, '01': 1, '02': 2, '03': 3, '04': 4, 'TOP': 5,
};

const FLOOR_LABELS_FR: Record<FloorIdx, string> = {
  0: 'ACCUEIL', 1: 'CV', 2: 'ARTICLES', 3: 'PROJETS', 4: 'FORMATIONS', 5: 'CONTACT',
};
const FLOOR_LABELS_EN: Record<FloorIdx, string> = {
  0: 'HOME', 1: 'RESUME', 2: 'POSTS', 3: 'PROJECTS', 4: 'TRAINING', 5: 'CONTACT',
};
const FLOOR_CODES: Record<FloorIdx, string> = {
  0: 'RDC', 1: '01', 2: '02', 3: '03', 4: '04', 5: 'TOP',
};

function getLocale(): 'fr' | 'en' {
  return document.documentElement.lang === 'en' ? 'en' : 'fr';
}

function readHashFloor(): FloorIdx {
  const raw = location.hash.replace(/^#/, '').toUpperCase();
  return (IDX_BY_HASH[raw] ?? 0) as FloorIdx;
}

function setLCD(code: string) {
  document.querySelectorAll<HTMLElement>('[data-xg-lcd]').forEach((el) => {
    el.textContent = code;
  });
}

function highlightHex(idx: FloorIdx) {
  document.querySelectorAll<HTMLElement>('[data-xg-floor-btns] .xg-hex').forEach((b) => {
    const f = Number(b.dataset.floor);
    b.classList.toggle('active', f === idx);
  });
  document.querySelectorAll<HTMLElement>('[data-xg-floor-btns] .xg-hex-row').forEach((r) => {
    const f = Number(r.dataset.floor);
    r.classList.toggle('is-active', f === idx);
  });
}

function setArrowDisabled(idx: FloorIdx) {
  const up = document.querySelector<HTMLButtonElement>('[data-xg-up]');
  const down = document.querySelector<HTMLButtonElement>('[data-xg-down]');
  if (up) up.disabled = idx >= 5;
  if (down) down.disabled = idx <= 0;
}

function isHomePage(): boolean {
  return document.querySelectorAll<HTMLElement>('[data-xg-floor-section]').length > 0;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let busy = false;
let current: FloorIdx = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function goTo(target: FloorIdx, opts: { animate?: boolean } = {}) {
  if (busy) return;
  if (!isHomePage()) {
    location.href = `/${getLocale() === 'en' ? 'en/' : ''}${HASH_BY_IDX[target] ? '#' + HASH_BY_IDX[target] : ''}`;
    return;
  }
  if (target === current) return;
  busy = true;
  const direction = target > current ? 'up' : 'down';
  const previous = current;
  current = target;

  const sections = document.querySelectorAll<HTMLElement>('[data-xg-floor-section]');
  const panel = document.querySelector<HTMLElement>('[data-xg-panel]');
  const doors = document.querySelector<HTMLElement>('[data-xg-doors]');
  const seam = document.querySelector<HTMLElement>('[data-xg-seam]');
  const flash = document.querySelector<HTMLElement>('[data-xg-flash]');
  const streaks = document.querySelector<HTMLElement>('[data-xg-streaks]');
  const arrival = document.querySelector<HTMLElement>('[data-xg-arrival]');

  if (reduced || opts.animate === false) {
    sections.forEach((s) => s.classList.toggle('active', Number(s.dataset.floor) === target));
    setLCD(FLOOR_CODES[target]);
    highlightHex(target);
    setArrowDisabled(target);
    history.replaceState(null, '', '#' + HASH_BY_IDX[target]);
    busy = false;
    return;
  }

  // Streaks
  streaks?.classList.remove('up', 'down', 'fire');
  void streaks?.offsetWidth;
  streaks?.classList.add('fire', direction);

  // Close doors
  doors?.classList.remove('opening');
  doors?.classList.add('closing');
  if (seam) seam.style.opacity = '1';

  await wait(720);

  // Swap content
  sections.forEach((s) => {
    s.classList.remove('arriving-up', 'arriving-down');
    s.classList.toggle('active', Number(s.dataset.floor) === target);
  });
  setLCD(FLOOR_CODES[target]);
  highlightHex(target);
  setArrowDisabled(target);
  const active = Array.from(sections).find((s) => Number(s.dataset.floor) === target);
  active?.classList.add(direction === 'up' ? 'arriving-up' : 'arriving-down');

  // Arrival toast
  if (arrival) {
    const labels = getLocale() === 'en' ? FLOOR_LABELS_EN : FLOOR_LABELS_FR;
    arrival.innerHTML = `<span class="arrow-icon">${direction === 'up' ? '▲' : '▼'}</span><span class="floor-num">${FLOOR_CODES[target]}</span>${labels[target]}`;
    arrival.classList.add('show');
    setTimeout(() => arrival.classList.remove('show'), 1100);
  }

  // Move focus to the active floor's heading for screen readers
  const heading = active?.querySelector<HTMLElement>('h1, h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  // Flash + shake
  flash?.classList.remove('fire');
  void flash?.offsetWidth;
  flash?.classList.add('fire');
  panel?.classList.add('shake');
  setTimeout(() => panel?.classList.remove('shake'), 460);
  setTimeout(() => streaks?.classList.remove('fire', 'up', 'down'), 700);

  await wait(80);

  // Open doors
  doors?.classList.remove('closing');
  doors?.classList.add('opening');
  if (seam) seam.style.opacity = '0';

  // Update hash without polluting history
  history.replaceState(null, '', '#' + HASH_BY_IDX[target]);

  await wait(620);
  busy = false;
}

function bindPanel() {
  document.querySelectorAll<HTMLAnchorElement>('[data-xg-floor-btns] .xg-hex').forEach((a) => {
    a.addEventListener('click', (ev) => {
      if (!isHomePage()) return; // let the anchor navigate normally
      ev.preventDefault();
      const idx = Number(a.dataset.floor) as FloorIdx;
      goTo(idx);
    });
  });
  document.querySelector<HTMLButtonElement>('[data-xg-up]')?.addEventListener('click', () => {
    if (!isHomePage()) return;
    goTo(Math.min(current + 1, 5) as FloorIdx);
  });
  document.querySelector<HTMLButtonElement>('[data-xg-down]')?.addEventListener('click', () => {
    if (!isHomePage()) return;
    goTo(Math.max(current - 1, 0) as FloorIdx);
  });
  document.addEventListener('keydown', (e) => {
    if (!isHomePage()) return;
    const target = e.target as HTMLElement | null;
    if (target?.matches('input, textarea')) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); goTo(Math.min(current + 1, 5) as FloorIdx); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); goTo(Math.max(current - 1, 0) as FloorIdx); }
    else if (e.key >= '0' && e.key <= '5') goTo(Number(e.key) as FloorIdx);
  });
  window.addEventListener('hashchange', () => {
    if (!isHomePage()) return;
    const idx = readHashFloor();
    if (idx !== current) goTo(idx);
  });
}

function bindThemeToggle() {
  const btn = document.querySelector<HTMLButtonElement>('[data-xg-theme-toggle]');
  if (!btn) return;
  const sync = () => {
    const t = document.documentElement.dataset.theme || 'dark';
    btn.querySelector<HTMLElement>('.tt-icon')!.textContent = t === 'light' ? '☀' : '☾';
    btn.querySelector<HTMLElement>('.tt-label')!.textContent = t === 'light' ? 'LIGHT' : 'DARK';
  };
  sync();
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('xg-theme', next);
    localStorage.setItem('theme', next); // keep legacy key in sync for now
    sync();
  });
}

function bindAccentSwatches() {
  const tweaks = document.querySelector<HTMLElement>('[data-xg-tweaks]');
  if (!tweaks) return;
  tweaks.querySelectorAll<HTMLButtonElement>('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const accent = sw.dataset.accent || 'prusse';
      document.documentElement.dataset.accent = accent;
      localStorage.setItem('xg-accent', accent);
      tweaks.querySelectorAll<HTMLButtonElement>('.swatch').forEach((s) => {
        s.setAttribute('aria-pressed', s === sw ? 'true' : 'false');
      });
    });
  });
  // Sync initial pressed state from current data-accent
  const cur = document.documentElement.dataset.accent || 'prusse';
  tweaks.querySelectorAll<HTMLButtonElement>('.swatch').forEach((s) => {
    s.setAttribute('aria-pressed', s.dataset.accent === cur ? 'true' : 'false');
  });
}

function init() {
  bindPanel();
  bindThemeToggle();
  bindAccentSwatches();
  if (isHomePage()) {
    current = readHashFloor();
    // Render initial state without animation
    const sections = document.querySelectorAll<HTMLElement>('[data-xg-floor-section]');
    sections.forEach((s) => s.classList.toggle('active', Number(s.dataset.floor) === current));
    setLCD(FLOOR_CODES[current]);
    highlightHex(current);
    setArrowDisabled(current);
    // If we landed with a non-RDC hash, replay arrival animation once
    if (current !== 0 && !reduced) {
      const direction = current > 0 ? 'up' : 'down';
      const active = Array.from(sections).find((s) => Number(s.dataset.floor) === current);
      active?.classList.add(direction === 'up' ? 'arriving-up' : 'arriving-down');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging from devtools
declare global { interface Window { xgElevator: { goTo: typeof goTo } } }
window.xgElevator = { goTo };
```

- [ ] **4.4: Mount the controller and doors via a temp preview**

To smoke-test phase 4 without touching `BaseLayout` yet, in `src/pages/index.astro` add the same temp imports as in 3.7, plus the doors and the script:

```astro
import ElevatorPanel from '../components/elevator/ElevatorPanel.astro';
import ElevatorHUD from '../components/elevator/ElevatorHUD.astro';
import ElevatorTweaks from '../components/elevator/ElevatorTweaks.astro';
import ElevatorDoors from '../components/elevator/ElevatorDoors.astro';
```

Just before `</BaseLayout>`:

```astro
<style is:global>@import '../components/elevator/elevator.css';</style>
<ElevatorHUD locale={locale} />
<ElevatorPanel locale={locale} />
<ElevatorTweaks locale={locale} />
<ElevatorDoors />

<!-- Temp dummy floor sections to test navigation -->
<section data-xg-floor-section data-floor="0" class="xg-floor active">
  <h1>Floor 0 — RDC</h1>
</section>
<section data-xg-floor-section data-floor="1" class="xg-floor"><h1>Floor 1 — CV</h1></section>
<section data-xg-floor-section data-floor="2" class="xg-floor"><h1>Floor 2 — Articles</h1></section>
<section data-xg-floor-section data-floor="3" class="xg-floor"><h1>Floor 3 — Projets</h1></section>
<section data-xg-floor-section data-floor="4" class="xg-floor"><h1>Floor 4 — Formations</h1></section>
<section data-xg-floor-section data-floor="5" class="xg-floor"><h1>Floor 5 — TOP</h1></section>

<script>
  import '../components/elevator/elevator.client.ts';
</script>
```

- [ ] **4.5: Smoke-test the controller**

```bash
pnpm dev
```

Open `http://localhost:4321/`. Verify, in order:

1. Click hex `01` — doors close, streaks fly upward, flash, panel shakes, doors open on "Floor 1 — CV", LCD reads `01`, the toast `▲ 01 CV` appears briefly, hash becomes `#01`.
2. Click `▼` — go back to `01` from `02`, doors animate downward, streaks fly down, LCD reads `01`.
3. Press `3` — jump to floor 3, doors animate.
4. Press `ArrowUp` — go to floor 4.
5. Press `0` — return to RDC (floor 0).
6. With keyboard focus on a hex button, press `Enter` — same effect as click.
7. Toggle theme — html element gets `data-theme="light"`, palette swap is instant, button label flips to `LIGHT`. Reload — choice persists.
8. Click each accent swatch — `--xg-accent` value changes (visible on the active hex's glow). Reload — choice persists.
9. Visit `http://localhost:4321/#03` directly — page loads with floor 3 active, LCD reads `03`. (Replay-arrival animation may fire if not reduced-motion.)
10. Open DevTools console: `window.xgElevator.goTo(5)` — jumps to TOP.

- [ ] **4.6: Smoke-test reduced-motion**

In DevTools, enable "Emulate CSS prefers-reduced-motion: reduce" (Rendering panel). Reload. Click hex 02 — it should switch instantly with a 200ms opacity fade, no doors/streaks/flash.

- [ ] **4.7: Revert the temp preview, keep real components**

In `src/pages/index.astro`, remove all the temp-preview code added in 4.4 (and the leftovers from 3.7 if not removed). The file should be back to its baseline state. The `elevator/` components and CSS stay untouched.

- [ ] **4.8: Verify build**

```bash
pnpm build
```

Expected: build passes. Site looks like baseline (controller exists but isn't mounted yet).

- [ ] **4.9: Commit**

```bash
git add src/components/elevator/
git commit -m "$(cat <<'EOF'
feat(elevator): wire navigation, animations, hash sync, persistence

Adds ElevatorDoors overlay (doors + streaks + flash + arrival toast)
and elevator.client.ts controller. The controller drives floor changes
on the home (door/streak/flash animations + arriving content), keeps
the URL hash and LCD in sync, handles ArrowUp/Down/0-5 keyboard,
persists theme (xg-theme) and accent (xg-accent) to localStorage, and
falls back to plain anchor navigation when no floor sections are
present (deep routes). Honors prefers-reduced-motion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — The six floors

**Goal:** Author the six floor components from real content (collections + i18n), extend the `projects` schema with a `status` field, populate the new home page (`src/pages/index.astro` for FR and `src/pages/en/index.astro` for EN). The home now contains the elevator visual + chrome + floors.

> The chrome (panel, HUD, tweaks, doors) is still injected per-page in this phase, NOT yet via `BaseLayout`. The migration to `BaseLayout` happens in phase 6.

**Files:**
- Modify: `src/content/config.ts` (add `status` to `projects`)
- Modify: `src/i18n/fr.ts` and `src/i18n/en.ts` (add full keyset)
- Create: `src/components/floors/FloorHero.astro`
- Create: `src/components/floors/FloorCV.astro`
- Create: `src/components/floors/FloorArticles.astro`
- Create: `src/components/floors/FloorProjects.astro`
- Create: `src/components/floors/FloorTraining.astro`
- Create: `src/components/floors/FloorContact.astro`
- Create: `src/components/floors/floors.css` (floor backgrounds + per-floor visual flair)
- Modify: `src/pages/index.astro` (rewrite as elevator home, FR)
- Modify: `src/pages/en/index.astro` (rewrite as elevator home, EN)

### Tasks

- [ ] **5.1: Extend `projects` schema**

In `src/content/config.ts`, find the `projects = defineCollection({ ... })` block (lines 41–52). Inside `schema: z.object({ ... })`, add the new field after `order`:

```ts
    order: z.number().default(0),
    status: z.enum(['running', 'deployed', 'wip']).default('deployed'),
```

> Existing project markdown files have no `status` field; the default `'deployed'` keeps them valid.

- [ ] **5.2: Add the full elevator i18n keyset to `src/i18n/fr.ts`**

Append inside the exported object (right after the chrome keys added in 3.2, before the closing `} as const;`):

```ts
  // Elevator — RDC
  elevator_rdc_meta: "RDC · Hall · Guadeloupe · 16°15'N 61°35'W",
  elevator_rdc_h1_part1: 'Xavier ',
  elevator_rdc_h1_stroke: 'GUERET',
  elevator_rdc_h1_part2: 'DevOps ',
  elevator_rdc_h1_accent: 'Engineer.',
  elevator_rdc_sub: "Passionné d'automatisation. Sur la voie de Kubernetes, Python, Ansible, Terraform — en quête de la maîtrise ultime pour automatiser tout ce qui bouge et garder l'esprit zen. De retour en Guadeloupe 🌴, mon île natale, où le code se déploie au rythme des Alizés.",
  elevator_rdc_hint_navigate: '↑ ↓  NAVIGUER',
  elevator_rdc_hint_floors: '06 ÉTAGES',

  // Elevator — Floor 01 CV
  elevator_f01_tag: 'ÉTAGE 01 · SALLE DE CONTRÔLE',
  elevator_f01_title: 'CV.',
  elevator_f01_desc: 'Profil, technologies, certifications.',
  elevator_f01_download_pdf: 'Télécharger en PDF ↗',
  elevator_f01_view_full_cv: 'Voir le CV complet ↗',
  elevator_f01_profil_h: '// PROFIL',
  elevator_f01_profil_body: "Ingénieur DevOps en progression, issu du développement Java, avec une solide expérience en automatisation et en intégration continue. Évolution vers le DevOps via la gestion d'environnements Linux, le déploiement d'applications sur OpenShift et Kubernetes, et la mise en place d'infrastructures reproductibles avec Ansible et Terraform. Recherche un environnement technique stimulant favorisant la montée en compétences et le partage de bonnes pratiques.",
  elevator_f01_apt_h: '$ apt list --installed',
  elevator_f01_apt_1_pkg: 'automatisation',
  elevator_f01_apt_1_ver: 'terraform / ansible',
  elevator_f01_apt_1_status: 'infrastructures reproductibles',
  elevator_f01_apt_2_pkg: 'ci-cd',
  elevator_f01_apt_2_ver: 'jenkins / gitlab-ci / gh-actions',
  elevator_f01_apt_2_status: 'intégration & déploiement continus',
  elevator_f01_apt_3_pkg: 'containerisation',
  elevator_f01_apt_3_ver: 'docker / kubernetes',
  elevator_f01_apt_3_status: 'openshift, k8s, cloud-native',
  elevator_f01_apt_4_pkg: 'scriptage',
  elevator_f01_apt_4_ver: 'bash / python',
  elevator_f01_apt_4_status: 'automation · outillage · API',
  elevator_f01_certs_h: '// CERTIFICATIONS',

  // Elevator — Floor 02 Articles
  elevator_f02_tag: 'ÉTAGE 02 · SALLE SERVEURS',
  elevator_f02_title: 'Articles.',
  elevator_f02_desc: "Mes derniers articles DevOps — notes de terrain, retours d'expérience, expérimentations.",
  elevator_f02_view_all: 'Voir tous les articles →',
  elevator_f02_state_published: 'PUBLIÉ',

  // Elevator — Floor 03 Projets
  elevator_f03_tag: 'ÉTAGE 03 · ATELIER · BLUEPRINT',
  elevator_f03_title: 'Projets.',
  elevator_f03_desc: "Boîtes à fusibles. Chaque projet a un état d'exploitation — comme un service en production.",
  elevator_f03_state_running: 'RUNNING',
  elevator_f03_state_deployed: 'DEPLOYED',
  elevator_f03_state_wip: 'WIP',

  // Elevator — Floor 04 Formations
  elevator_f04_tag: 'ÉTAGE 04 · DOCUMENTATION',
  elevator_f04_title: 'FORMATIONS',
  elevator_f04_desc: 'cursus partagés via TiPunchLabs — apprentissage par la pratique',
  elevator_f04_man_name: 'NAME',
  elevator_f04_man_synopsis: 'SYNOPSIS',
  elevator_f04_man_description: 'DESCRIPTION',
  elevator_f04_man_available: 'FORMATIONS DISPONIBLES',
  elevator_f04_man_philosophy: 'PHILOSOPHIE',
  elevator_f04_man_seealso: 'SEE ALSO',
  elevator_f04_man_name_body: 'tipunchlabs/formation — formations DevOps publiées par Xavier GUERET',
  elevator_f04_man_synopsis_body: '<code>formation</code> [<strong>--python</strong>] [<strong>--filerouge</strong>] [<strong>--debutant</strong>]',
  elevator_f04_man_description_body: "Plateforme de formations DevOps publiées sur <code>github.com/TiPunchLabs</code>. Approche pratique — un cas concret, un repo, un fil rouge, des commits qui racontent l'apprentissage.",
  elevator_f04_man_philosophy_body: "« Automatiser, c'est la clé pour un développement chill : moins de stress, plus de flow, et des déploiements qui se font les doigts dans le code ! »",
  elevator_f04_man_seealso_body: '<code>posts(1)</code>, <code>projects(1)</code>, <code>tipunchlabs.fr(7)</code>',

  // Elevator — TOP Contact
  elevator_top_tag: 'TOP · ROOFTOP · GUADELOUPE 🌴',
  elevator_top_h2_part1: 'Le toit. ',
  elevator_top_h2_glow: 'Parlons-en.',
  elevator_top_sub: "Vous êtes monté jusqu'ici. Bravo. C'est le seul étage où le turquoise existe — la couleur de la mer vue depuis le toit. Une mission, une collaboration, un ti-punch ? Le code se déploie ici au rythme des Alizés.",
  elevator_top_form_title: '// TRANSMETTRE',
  elevator_top_field_name: 'NOM',
  elevator_top_field_name_ph: 'Votre nom',
  elevator_top_field_email: 'EMAIL',
  elevator_top_field_email_ph: 'vous@domaine.com',
  elevator_top_field_message: 'MESSAGE',
  elevator_top_field_message_ph: "Le projet, l'idée, le besoin…",
  elevator_top_send: 'Transmettre →',
  elevator_top_lat: 'LAT',
  elevator_top_lon: 'LON',
  elevator_top_mailto_subject: 'Contact via xgueret.github.io',
```

- [ ] **5.3: Add the full elevator i18n keyset to `src/i18n/en.ts`**

Append the same keys with English values:

```ts
  // Elevator — RDC
  elevator_rdc_meta: "GROUND · HALL · GUADELOUPE · 16°15'N 61°35'W",
  elevator_rdc_h1_part1: 'Xavier ',
  elevator_rdc_h1_stroke: 'GUERET',
  elevator_rdc_h1_part2: 'DevOps ',
  elevator_rdc_h1_accent: 'Engineer.',
  elevator_rdc_sub: "Automation enthusiast. On the path to mastering Kubernetes, Python, Ansible, Terraform — chasing the ultimate ability to automate anything that moves and keep the mind zen. Back in Guadeloupe 🌴, my native island, where code deploys to the rhythm of the trade winds.",
  elevator_rdc_hint_navigate: '↑ ↓  NAVIGATE',
  elevator_rdc_hint_floors: '06 FLOORS',

  // Elevator — Floor 01 CV
  elevator_f01_tag: 'FLOOR 01 · CONTROL ROOM',
  elevator_f01_title: 'Resume.',
  elevator_f01_desc: 'Profile, technologies, certifications.',
  elevator_f01_download_pdf: 'Download as PDF ↗',
  elevator_f01_view_full_cv: 'View full resume ↗',
  elevator_f01_profil_h: '// PROFILE',
  elevator_f01_profil_body: "DevOps engineer in progress, with a Java development background and solid experience in automation and continuous integration. Moved into DevOps through Linux environment management, OpenShift and Kubernetes deployments, and reproducible infrastructure with Ansible and Terraform. Looking for a stimulating technical environment that fosters skill growth and best-practice sharing.",
  elevator_f01_apt_h: '$ apt list --installed',
  elevator_f01_apt_1_pkg: 'automation',
  elevator_f01_apt_1_ver: 'terraform / ansible',
  elevator_f01_apt_1_status: 'reproducible infrastructures',
  elevator_f01_apt_2_pkg: 'ci-cd',
  elevator_f01_apt_2_ver: 'jenkins / gitlab-ci / gh-actions',
  elevator_f01_apt_2_status: 'continuous integration & delivery',
  elevator_f01_apt_3_pkg: 'containers',
  elevator_f01_apt_3_ver: 'docker / kubernetes',
  elevator_f01_apt_3_status: 'openshift, k8s, cloud-native',
  elevator_f01_apt_4_pkg: 'scripting',
  elevator_f01_apt_4_ver: 'bash / python',
  elevator_f01_apt_4_status: 'automation · tooling · APIs',
  elevator_f01_certs_h: '// CERTIFICATIONS',

  // Elevator — Floor 02 Articles
  elevator_f02_tag: 'FLOOR 02 · SERVER ROOM',
  elevator_f02_title: 'Posts.',
  elevator_f02_desc: 'My latest DevOps posts — field notes, war stories, experiments.',
  elevator_f02_view_all: 'View all posts →',
  elevator_f02_state_published: 'PUBLISHED',

  // Elevator — Floor 03 Projects
  elevator_f03_tag: 'FLOOR 03 · WORKSHOP · BLUEPRINT',
  elevator_f03_title: 'Projects.',
  elevator_f03_desc: 'Fuse boxes. Each project has an operational state — like a production service.',
  elevator_f03_state_running: 'RUNNING',
  elevator_f03_state_deployed: 'DEPLOYED',
  elevator_f03_state_wip: 'WIP',

  // Elevator — Floor 04 Training
  elevator_f04_tag: 'FLOOR 04 · DOCUMENTATION',
  elevator_f04_title: 'TRAINING',
  elevator_f04_desc: 'curricula shared via TiPunchLabs — learning by doing',
  elevator_f04_man_name: 'NAME',
  elevator_f04_man_synopsis: 'SYNOPSIS',
  elevator_f04_man_description: 'DESCRIPTION',
  elevator_f04_man_available: 'AVAILABLE TRAININGS',
  elevator_f04_man_philosophy: 'PHILOSOPHY',
  elevator_f04_man_seealso: 'SEE ALSO',
  elevator_f04_man_name_body: 'tipunchlabs/training — DevOps trainings published by Xavier GUERET',
  elevator_f04_man_synopsis_body: '<code>training</code> [<strong>--python</strong>] [<strong>--filerouge</strong>] [<strong>--beginner</strong>]',
  elevator_f04_man_description_body: "DevOps training platform published on <code>github.com/TiPunchLabs</code>. Practical approach — a real case, a repo, a thread, commits that tell the learning story.",
  elevator_f04_man_philosophy_body: "« Automation is the key to chill development: less stress, more flow, deploys you can do with your fingertips on the keys! »",
  elevator_f04_man_seealso_body: '<code>posts(1)</code>, <code>projects(1)</code>, <code>tipunchlabs.fr(7)</code>',

  // Elevator — TOP Contact
  elevator_top_tag: 'TOP · ROOFTOP · GUADELOUPE 🌴',
  elevator_top_h2_part1: 'The roof. ',
  elevator_top_h2_glow: "Let's talk.",
  elevator_top_sub: "You made it all the way up. Bravo. This is the only floor where turquoise exists — the color of the sea seen from the roof. A mission, a collaboration, a ti-punch? Code deploys here to the rhythm of the trade winds.",
  elevator_top_form_title: '// TRANSMIT',
  elevator_top_field_name: 'NAME',
  elevator_top_field_name_ph: 'Your name',
  elevator_top_field_email: 'EMAIL',
  elevator_top_field_email_ph: 'you@domain.com',
  elevator_top_field_message: 'MESSAGE',
  elevator_top_field_message_ph: 'The project, the idea, the need…',
  elevator_top_send: 'Transmit →',
  elevator_top_lat: 'LAT',
  elevator_top_lon: 'LON',
  elevator_top_mailto_subject: 'Contact via xgueret.github.io',
```

- [ ] **5.4: Create `src/components/floors/` directory + `floors.css`**

```bash
mkdir -p src/components/floors
```

`src/components/floors/floors.css` — backgrounds + visual flair per floor, scoped to `.xg-floor.f-*`:

```css
.xg-floor.f-rdc {
  background: var(--xg-bg);
  display: flex; flex-direction: column; align-items: flex-start;
}
.xg-rdc-portrait {
  width: 130px; height: 130px;
  border-radius: 50%;
  overflow: hidden;
  background: #13131f url('/images/moi.png') center/cover no-repeat;
  box-shadow: 0 0 0 1px var(--xg-border);
  margin-bottom: 28px;
  position: relative;
}
.xg-rdc-portrait::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(168,85,247,0.18), rgba(56,189,248,0.10));
  mix-blend-mode: color;
  pointer-events: none;
}
.xg-rdc-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--xg-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex; gap: 16px; align-items: center;
  margin-bottom: 32px;
}
.xg-rdc-meta::before {
  content: ''; width: 28px; height: 1px; background: var(--xg-accent);
}
.xg-rdc h1 {
  font-family: var(--font-display);
  font-size: clamp(56px, 8vw, 128px);
  font-weight: 600;
  line-height: 0.92;
  letter-spacing: -0.04em;
  margin: 0 0 28px;
  max-width: 14ch;
  color: var(--xg-text);
}
.xg-rdc h1 .stroke {
  -webkit-text-stroke: 1.5px var(--xg-text);
  color: transparent;
}
.xg-rdc h1 .accent { color: var(--xg-accent); }
.xg-rdc-sub {
  font-size: 18px;
  color: var(--xg-muted);
  max-width: 56ch;
  line-height: 1.6;
  margin-bottom: 40px;
}

.xg-floor.f-01 {
  background:
    linear-gradient(rgba(11,11,18,0.96), rgba(11,11,18,0.96)),
    repeating-linear-gradient(0deg, transparent 0 39px, rgba(56,189,248,0.06) 39px 40px),
    repeating-linear-gradient(90deg, transparent 0 39px, rgba(56,189,248,0.06) 39px 40px);
}
.xg-floor.f-02 {
  background: var(--xg-bg);
  position: relative;
}
.xg-floor.f-02::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(90deg, transparent 0 60px, rgba(56,189,248,0.10) 60px 61px, transparent 61px 120px);
  pointer-events: none;
}
.xg-floor.f-03 {
  background:
    linear-gradient(rgba(11,11,18,0.94), rgba(11,11,18,0.94)),
    repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,0.05) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.05) 23px 24px);
}
.xg-floor.f-04 {
  background: #050609;
  font-family: var(--font-mono);
}
.xg-floor.f-04 .xg-floor-title {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 500;
}
.xg-floor.f-top {
  background:
    radial-gradient(ellipse 800px 400px at 50% 100%, rgba(45,212,191,0.15) 0%, transparent 70%),
    linear-gradient(180deg, #050511 0%, #0a0d1f 70%, #0e1822 100%);
  position: relative;
}

.xg-floor-header { margin-bottom: 40px; }
.xg-floor-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--xg-cool);
  letter-spacing: 3px;
  margin-bottom: 12px;
}
.xg-floor-title {
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin: 0 0 12px;
  line-height: 1;
  color: var(--xg-text);
}
.xg-floor-desc {
  color: var(--xg-muted);
  font-size: 15px;
  max-width: 60ch;
  line-height: 1.6;
}
.xg-floor-desc a {
  color: var(--xg-cool);
  text-decoration: none;
  border-bottom: 1px dashed var(--xg-cool);
}

.xg-fuse-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 22px;
  max-width: 1100px;
}
@media (max-width: 800px) {
  .xg-fuse-grid { grid-template-columns: 1fr; }
  .xg-floor { padding: 80px 20px 110px; }
}

.xg-apt-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 12px;
  max-width: 760px;
}
@media (max-width: 800px) { .xg-apt-stack { grid-template-columns: 1fr; } }

/* Floor TOP — palm tree + contact card */
.xg-top-stars {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 13% 22%, rgba(255,255,255,0.7), transparent 60%),
    radial-gradient(1.5px 1.5px at 47% 38%, rgba(255,255,255,0.8), transparent 60%),
    radial-gradient(1.5px 1.5px at 88% 12%, rgba(45,212,191,0.7), transparent 60%),
    radial-gradient(1px 1px at 22% 52%, rgba(255,255,255,0.4), transparent 60%);
  pointer-events: none;
}
.xg-top-palm {
  position: absolute;
  right: 8%; bottom: 0;
  height: 70%;
  pointer-events: none;
  opacity: 0.85;
}
.xg-top-meta {
  color: var(--xg-top);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
}
.xg-top-h2 {
  font-family: var(--font-display);
  font-size: 88px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 12px 0 18px;
  max-width: 12ch;
  color: var(--xg-text);
}
.xg-top-h2 .glow { color: var(--xg-top); text-shadow: 0 0 30px rgba(45,212,191,0.5); }
.xg-top-sub { color: #9aa5b3; max-width: 50ch; line-height: 1.6; margin-bottom: 36px; }
.xg-contact-card {
  max-width: 460px;
  background: rgba(13,18,28,0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(45,212,191,0.25);
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 0 40px rgba(45,212,191,0.15), inset 0 1px 0 rgba(255,255,255,0.03);
}
.xg-contact-card h4 {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--xg-top);
  letter-spacing: 3px;
  margin: 0 0 18px;
}
.xg-field { display: block; margin-bottom: 14px; }
.xg-field-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  color: #6b7585;
  letter-spacing: 2px;
  margin-bottom: 6px;
}
.xg-field input, .xg-field textarea {
  width: 100%;
  background: rgba(11,11,18,0.6);
  border: 1px solid rgba(45,212,191,0.18);
  color: var(--xg-text);
  padding: 10px 12px;
  font-family: var(--font-sans);
  font-size: 14px;
  border-radius: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.xg-field input:focus, .xg-field textarea:focus {
  outline: none;
  border-color: var(--xg-top);
  box-shadow: 0 0 0 2px rgba(45,212,191,0.2);
}
.xg-field textarea { resize: vertical; min-height: 90px; }
.xg-send-btn {
  background: var(--xg-top);
  color: #042725;
  border: none;
  padding: 11px 22px;
  border-radius: 4px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(45,212,191,0.4);
  letter-spacing: 0.5px;
}
.xg-send-btn:hover { background: #5eead4; box-shadow: 0 0 30px rgba(45,212,191,0.6); }
.xg-top-coords {
  margin-top: 18px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: #6b7585;
  letter-spacing: 1px;
}
.xg-top-coords span { color: var(--xg-top); }
```

- [ ] **5.5: Write `FloorHero.astro`**

`src/components/floors/FloorHero.astro` — RDC.

```astro
---
import { type Locale, t } from '../../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
---
<section class="xg-floor f-rdc xg-rdc" data-xg-floor-section data-floor="0">
  <div class="xg-rdc-portrait" aria-hidden="true"></div>
  <div class="xg-rdc-meta">{t(locale, 'elevator_rdc_meta')}</div>
  <h1>
    {t(locale, 'elevator_rdc_h1_part1')}<span class="stroke">{t(locale, 'elevator_rdc_h1_stroke')}</span><br/>
    {t(locale, 'elevator_rdc_h1_part2')}<span class="accent">{t(locale, 'elevator_rdc_h1_accent')}</span>
  </h1>
  <p class="xg-rdc-sub">{t(locale, 'elevator_rdc_sub')}</p>
  <div style="display:flex; gap:14px; align-items:center;">
    <div style="font-family:var(--font-mono); font-size:11px; color:var(--xg-muted); letter-spacing:2px;">
      {t(locale, 'elevator_rdc_hint_navigate')}
    </div>
    <div style="width:1px; height:14px; background:var(--xg-border);"></div>
    <div style="font-family:var(--font-mono); font-size:11px; color:var(--xg-muted); letter-spacing:2px;">
      {t(locale, 'elevator_rdc_hint_floors')}
    </div>
  </div>
</section>
```

- [ ] **5.6: Write `FloorCV.astro`**

`src/components/floors/FloorCV.astro` — Floor 01. Static apt-list + certs from i18n. Certs are hardcoded inline (4 entries).

```astro
---
import { type Locale, t, localePrefix } from '../../i18n';
import AptItem from '../ui/AptItem.astro';
import GitLogRow from '../ui/GitLogRow.astro';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const cvHref = `${localePrefix(locale)}/cv/`;
const pdfHref = `/assets/cv.${locale}.pdf`;
---
<section class="xg-floor f-01" data-xg-floor-section data-floor="1">
  <header class="xg-floor-header">
    <div class="xg-floor-tag">{t(locale, 'elevator_f01_tag')}</div>
    <h2 class="xg-floor-title">{t(locale, 'elevator_f01_title')}</h2>
    <p class="xg-floor-desc">
      {t(locale, 'elevator_f01_desc')}{' '}
      <a href={pdfHref} target="_blank" rel="noopener">{t(locale, 'elevator_f01_download_pdf')}</a>{' · '}
      <a href={cvHref}>{t(locale, 'elevator_f01_view_full_cv')}</a>
    </p>
  </header>

  <h3 style="font-family:var(--font-mono); font-size:11px; color:var(--xg-cool); letter-spacing:3px; margin:0 0 14px;">
    {t(locale, 'elevator_f01_profil_h')}
  </h3>
  <p style="max-width:720px; line-height:1.7; color:#c4c8de; font-size:14.5px; margin:0 0 32px;">
    {t(locale, 'elevator_f01_profil_body')}
  </p>

  <h3 style="font-family:var(--font-mono); font-size:11px; color:var(--xg-muted); letter-spacing:3px; margin:0 0 14px;">
    {t(locale, 'elevator_f01_apt_h')}
  </h3>
  <div class="xg-apt-stack" style="margin-bottom:32px;">
    <AptItem pkg={t(locale, 'elevator_f01_apt_1_pkg')} ver={t(locale, 'elevator_f01_apt_1_ver')} percent={92} status={t(locale, 'elevator_f01_apt_1_status')} />
    <AptItem pkg={t(locale, 'elevator_f01_apt_2_pkg')} ver={t(locale, 'elevator_f01_apt_2_ver')} percent={88} status={t(locale, 'elevator_f01_apt_2_status')} />
    <AptItem pkg={t(locale, 'elevator_f01_apt_3_pkg')} ver={t(locale, 'elevator_f01_apt_3_ver')} percent={90} status={t(locale, 'elevator_f01_apt_3_status')} />
    <AptItem pkg={t(locale, 'elevator_f01_apt_4_pkg')} ver={t(locale, 'elevator_f01_apt_4_ver')} percent={86} status={t(locale, 'elevator_f01_apt_4_status')} />
  </div>

  <h3 style="font-family:var(--font-mono); font-size:11px; color:var(--xg-industrial); letter-spacing:3px; margin:0 0 14px;">
    {t(locale, 'elevator_f01_certs_h')}
  </h3>

  <div class="gitlog" role="list">
    <GitLogRow hash="CKA"  date="2023" message="Certified Kubernetes Administrator" href="https://www.credly.com/badges/dfcc38d2-4c29-4da4-9483-d96de72a1f29/public_url" />
    <GitLogRow hash="CKAD" date="2025" message="Certified Kubernetes Application Developer" href="https://www.credly.com/badges/d4b18a00-4c59-4a0f-a5fb-35e6b4b8236f/public_url" />
    <GitLogRow hash="TF-A" date="2023" message="HashiCorp Terraform Associate (002)" href="https://www.credly.com/badges/a20c23e0-e453-433d-a100-e7056fab84be/public_url" />
    <GitLogRow hash="RHCS" date="2022" message="Red Hat Certified Specialist in Ansible Automation" />
  </div>
</section>
```

- [ ] **5.7: Write `FloorArticles.astro`**

`src/components/floors/FloorArticles.astro` — Floor 02. Reads 6 latest posts dynamically.

```astro
---
import { getCollection } from 'astro:content';
import { type Locale, t, localePrefix, formatDate } from '../../i18n';
import FuseCard from '../ui/FuseCard.astro';

interface Props { locale: Locale; }
const { locale } = Astro.props;

const allPosts = await getCollection('posts', ({ id, data }) => {
  return id.startsWith(`${locale}/`) && !data.draft && !data.archived;
});
const recentPosts = allPosts
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .slice(0, 6);

const postsListHref = `${localePrefix(locale)}/posts/`;
---
<section class="xg-floor f-02" data-xg-floor-section data-floor="2">
  <header class="xg-floor-header">
    <div class="xg-floor-tag">{t(locale, 'elevator_f02_tag')}</div>
    <h2 class="xg-floor-title">{t(locale, 'elevator_f02_title')}</h2>
    <p class="xg-floor-desc">
      {t(locale, 'elevator_f02_desc')}{' '}
      <a href={postsListHref}>{t(locale, 'elevator_f02_view_all')}</a>
    </p>
  </header>

  <div class="xg-fuse-grid">
    {recentPosts.map((post) => {
      const slug = post.id.replace(`${locale}/`, '').replace(/\.md$/, '');
      const href = `${localePrefix(locale)}/posts/${slug}/`;
      const dateStr = formatDate(post.data.date, locale);
      const tag = post.data.categories?.[0]?.toUpperCase() ?? '';
      const label = `// ${dateStr}${tag ? ' · ' + tag : ''}`;
      const cover = post.data.image;
      return (
        <FuseCard
          href={href}
          label={label}
          title={post.data.title}
          description={post.data.description}
          cover={cover}
          state="deployed"
          stateLabel={t(locale, 'elevator_f02_state_published')}
        />
      );
    })}
  </div>
</section>
```

- [ ] **5.8: Write `FloorProjects.astro`**

`src/components/floors/FloorProjects.astro` — Floor 03. Reads from `projects` collection sorted by `order`. Maps `data.status` to FuseCard state + localized label.

```astro
---
import { getCollection } from 'astro:content';
import { type Locale, t } from '../../i18n';
import FuseCard from '../ui/FuseCard.astro';

interface Props { locale: Locale; }
const { locale } = Astro.props;

const allProjects = await getCollection('projects', ({ id }) => id.startsWith(`${locale}/`));
const projects = allProjects.sort((a, b) => a.data.order - b.data.order);

const stateLabel: Record<'running' | 'deployed' | 'wip', string> = {
  running:  t(locale, 'elevator_f03_state_running'),
  deployed: t(locale, 'elevator_f03_state_deployed'),
  wip:      t(locale, 'elevator_f03_state_wip'),
};
---
<section class="xg-floor f-03" data-xg-floor-section data-floor="3">
  <header class="xg-floor-header">
    <div class="xg-floor-tag">{t(locale, 'elevator_f03_tag')}</div>
    <h2 class="xg-floor-title">{t(locale, 'elevator_f03_title')}</h2>
    <p class="xg-floor-desc">{t(locale, 'elevator_f03_desc')}</p>
  </header>

  <div class="xg-fuse-grid">
    {projects.map((p, i) => {
      const fuseLabel = `// FUSE-${String(i + 1).padStart(2, '0')} · ${p.data.category.toUpperCase()}`;
      const href = p.data.url || p.data.github;
      return (
        <FuseCard
          href={href}
          label={fuseLabel}
          title={p.data.title}
          description={p.data.description}
          state={p.data.status}
          stateLabel={stateLabel[p.data.status]}
        />
      );
    })}
  </div>
</section>
```

- [ ] **5.9: Write `FloorTraining.astro`**

`src/components/floors/FloorTraining.astro` — Floor 04. Reads `training` collection. Uses `set:html` to allow inline `<code>`/`<strong>` markup in i18n strings.

```astro
---
import { getCollection } from 'astro:content';
import { type Locale, t } from '../../i18n';
import ManPageBlock from '../ui/ManPageBlock.astro';

interface Props { locale: Locale; }
const { locale } = Astro.props;

const trainings = (await getCollection('training', ({ id, data }) => {
  return id.startsWith(`${locale}/`) && !data.draft;
})).sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));
---
<section class="xg-floor f-04" data-xg-floor-section data-floor="4">
  <header class="xg-floor-header">
    <div class="xg-floor-tag" style="color:#6b7585;">{t(locale, 'elevator_f04_tag')}</div>
    <h2 class="xg-floor-title">
      {t(locale, 'elevator_f04_title')}({trainings.length})
    </h2>
    <p class="xg-floor-desc" style="font-family:var(--font-mono); font-size:12px;">
      {t(locale, 'elevator_f04_desc')}
    </p>
  </header>

  <div class="manpage">
    <ManPageBlock heading={t(locale, 'elevator_f04_man_name')}>
      <Fragment set:html={t(locale, 'elevator_f04_man_name_body')} />
    </ManPageBlock>
    <ManPageBlock heading={t(locale, 'elevator_f04_man_synopsis')}>
      <Fragment set:html={t(locale, 'elevator_f04_man_synopsis_body')} />
    </ManPageBlock>
    <ManPageBlock heading={t(locale, 'elevator_f04_man_description')}>
      <Fragment set:html={t(locale, 'elevator_f04_man_description_body')} />
    </ManPageBlock>
    <ManPageBlock heading={t(locale, 'elevator_f04_man_available')}>
      {trainings.map((tr) => (
        <div style="margin-bottom:14px;">
          <strong>{tr.data.title}</strong><br/>
          {tr.data.description}<br/>
          {tr.data.tags.length > 0 && <code>tags: {tr.data.tags.join(' · ')}</code>}
          {tr.data.tags.length > 0 && tr.data.externalLink && <br/>}
          {tr.data.externalLink && <code>repo : {tr.data.externalLink.replace(/^https?:\/\//, '')}</code>}
        </div>
      ))}
    </ManPageBlock>
    <ManPageBlock heading={t(locale, 'elevator_f04_man_philosophy')}>
      <Fragment set:html={t(locale, 'elevator_f04_man_philosophy_body')} />
    </ManPageBlock>
    <ManPageBlock heading={t(locale, 'elevator_f04_man_seealso')}>
      <Fragment set:html={t(locale, 'elevator_f04_man_seealso_body')} />
    </ManPageBlock>
  </div>
</section>
```

- [ ] **5.10: Write `FloorContact.astro`**

`src/components/floors/FloorContact.astro` — TOP. Form opens a `mailto:` on submit (preserves the look of an interactive form, no backend needed).

```astro
---
import { type Locale, t } from '../../i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const mailto = '971xavier.gueret@gmail.com';
const subject = encodeURIComponent(t(locale, 'elevator_top_mailto_subject'));
---
<section class="xg-floor f-top" data-xg-floor-section data-floor="5">
  <div class="xg-top-stars" aria-hidden="true"></div>
  <svg class="xg-top-palm" viewBox="0 0 240 400" aria-hidden="true">
    <path d="M120 400 Q 116 320, 122 240 Q 128 160, 124 80" stroke="#0a0d18" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M120 400 Q 116 320, 122 240 Q 128 160, 124 80" stroke="#142028" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
    <g stroke="#0a0d18" stroke-width="2" fill="none">
      <path d="M114 340 Q 120 343, 126 340"/>
      <path d="M114 290 Q 120 293, 128 290"/>
      <path d="M115 240 Q 121 243, 129 240"/>
      <path d="M117 190 Q 122 193, 128 190"/>
      <path d="M119 140 Q 123 143, 127 140"/>
    </g>
    <g stroke="#0a0d18" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M124 80 Q 70 50, 18 70"/>
      <path d="M124 80 Q 80 30, 50 0"/>
      <path d="M124 80 Q 170 50, 220 60"/>
      <path d="M124 80 Q 180 30, 215 0"/>
      <path d="M124 80 Q 130 60, 124 10"/>
      <path d="M124 80 Q 90 90, 30 110"/>
      <path d="M124 80 Q 165 90, 220 105"/>
    </g>
  </svg>

  <div class="xg-top-meta">{t(locale, 'elevator_top_tag')}</div>
  <h2 class="xg-top-h2">
    {t(locale, 'elevator_top_h2_part1')}<br/>
    <span class="glow">{t(locale, 'elevator_top_h2_glow')}</span>
  </h2>
  <p class="xg-top-sub">{t(locale, 'elevator_top_sub')}</p>

  <form class="xg-contact-card" data-xg-contact-form data-mailto={mailto} data-subject-encoded={subject}>
    <h4>{t(locale, 'elevator_top_form_title')}</h4>
    <div class="xg-field">
      <label class="xg-field-label" for="xg-name">{t(locale, 'elevator_top_field_name')}</label>
      <input id="xg-name" name="name" type="text" placeholder={t(locale, 'elevator_top_field_name_ph')} required />
    </div>
    <div class="xg-field">
      <label class="xg-field-label" for="xg-email">{t(locale, 'elevator_top_field_email')}</label>
      <input id="xg-email" name="email" type="email" placeholder={t(locale, 'elevator_top_field_email_ph')} required />
    </div>
    <div class="xg-field">
      <label class="xg-field-label" for="xg-message">{t(locale, 'elevator_top_field_message')}</label>
      <textarea id="xg-message" name="message" placeholder={t(locale, 'elevator_top_field_message_ph')} required></textarea>
    </div>
    <button class="xg-send-btn" type="submit">{t(locale, 'elevator_top_send')}</button>
    <div class="xg-top-coords">
      <span>{t(locale, 'elevator_top_lat')}</span> 16.2650° N &nbsp;·&nbsp; <span>{t(locale, 'elevator_top_lon')}</span> 61.5510° W
    </div>
  </form>
</section>

<script>
  document.querySelectorAll<HTMLFormElement>('[data-xg-contact-form]').forEach((form) => {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') ?? '');
      const email = String(fd.get('email') ?? '');
      const message = String(fd.get('message') ?? '');
      const mailto = form.dataset.mailto || '';
      const subject = form.dataset.subjectEncoded || '';
      const body = encodeURIComponent(`${message}\n\n— ${name} <${email}>`);
      window.location.href = `mailto:${mailto}?subject=${subject}&body=${body}`;
    });
  });
</script>
```

- [ ] **5.11: Rewrite `src/pages/index.astro` as the FR home**

Replace the entire file contents with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ElevatorPanel from '../components/elevator/ElevatorPanel.astro';
import ElevatorHUD from '../components/elevator/ElevatorHUD.astro';
import ElevatorTweaks from '../components/elevator/ElevatorTweaks.astro';
import ElevatorDoors from '../components/elevator/ElevatorDoors.astro';
import FloorHero from '../components/floors/FloorHero.astro';
import FloorCV from '../components/floors/FloorCV.astro';
import FloorArticles from '../components/floors/FloorArticles.astro';
import FloorProjects from '../components/floors/FloorProjects.astro';
import FloorTraining from '../components/floors/FloorTraining.astro';
import FloorContact from '../components/floors/FloorContact.astro';
import { t } from '../i18n';

const locale = 'fr';
---
<BaseLayout title={t(locale, 'siteTitle')} description={t(locale, 'siteDescription')} locale={locale}>
  <style is:global>
    @import '../components/elevator/elevator.css';
    @import '../components/floors/floors.css';
    body { overflow: hidden; height: 100%; }
    main#main-content { padding: 0 !important; }
  </style>

  <ElevatorHUD locale={locale} />
  <ElevatorPanel locale={locale} currentFloor={0} />
  <ElevatorTweaks locale={locale} />

  <div class="xg-stage">
    <FloorHero locale={locale} />
    <FloorCV locale={locale} />
    <FloorArticles locale={locale} />
    <FloorProjects locale={locale} />
    <FloorTraining locale={locale} />
    <FloorContact locale={locale} />
  </div>

  <ElevatorDoors />

  <script>
    import '../components/elevator/elevator.client.ts';
  </script>
</BaseLayout>
```

- [ ] **5.12: Rewrite `src/pages/en/index.astro` as the EN home**

Replace the entire file with the same as 5.11 except `const locale = 'en';` and adjust import path to `../../layouts/...` etc:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ElevatorPanel from '../../components/elevator/ElevatorPanel.astro';
import ElevatorHUD from '../../components/elevator/ElevatorHUD.astro';
import ElevatorTweaks from '../../components/elevator/ElevatorTweaks.astro';
import ElevatorDoors from '../../components/elevator/ElevatorDoors.astro';
import FloorHero from '../../components/floors/FloorHero.astro';
import FloorCV from '../../components/floors/FloorCV.astro';
import FloorArticles from '../../components/floors/FloorArticles.astro';
import FloorProjects from '../../components/floors/FloorProjects.astro';
import FloorTraining from '../../components/floors/FloorTraining.astro';
import FloorContact from '../../components/floors/FloorContact.astro';
import { t } from '../../i18n';

const locale = 'en';
---
<BaseLayout title={t(locale, 'siteTitle')} description={t(locale, 'siteDescription')} locale={locale}>
  <style is:global>
    @import '../../components/elevator/elevator.css';
    @import '../../components/floors/floors.css';
    body { overflow: hidden; height: 100%; }
    main#main-content { padding: 0 !important; }
  </style>

  <ElevatorHUD locale={locale} />
  <ElevatorPanel locale={locale} currentFloor={0} homeHref="/en" />
  <ElevatorTweaks locale={locale} />

  <div class="xg-stage">
    <FloorHero locale={locale} />
    <FloorCV locale={locale} />
    <FloorArticles locale={locale} />
    <FloorProjects locale={locale} />
    <FloorTraining locale={locale} />
    <FloorContact locale={locale} />
  </div>

  <ElevatorDoors />

  <script>
    import '../../components/elevator/elevator.client.ts';
  </script>
</BaseLayout>
```

- [ ] **5.13: Verify build**

```bash
pnpm build
```

Expected: build passes. If you see errors about missing `data.status` in `projects` collection, it means an existing project markdown is invalid — open the offending file and add `status: deployed` (or check the Zod default applied; default should kick in for files without the field).

- [ ] **5.14: Visual check FR + EN home**

```bash
pnpm dev
```

- `http://localhost:4321/` — full elevator with 6 floors, RDC active. Click each hex, verify floor content matches the mockup.
- `http://localhost:4321/en/` — same in English. Verify each floor's copy is translated.
- `http://localhost:4321/#03` — should land on floor 3 with the door animation replaying.
- `http://localhost:4321/en/#TOP` — same, in English.
- Click an article on floor 02 — should navigate to `/posts/<slug>/` (currently old style; phase 7 reskins it).
- Submit the contact form on floor TOP — should open the system mail client with `mailto:971xavier.gueret@gmail.com?subject=Contact%20via%20xgueret.github.io&body=...`.

- [ ] **5.15: Commit**

```bash
git add src/content/config.ts src/i18n/ src/components/floors/ src/pages/index.astro src/pages/en/index.astro
git commit -m "$(cat <<'EOF'
feat(home): elevator-themed home with six floors (FR + EN)

Replaces the home page with the six-floor elevator experience: RDC
hero, CV (apt-list + gitlog certs), Articles (6 latest from posts
collection), Projects (fuse grid from projects collection driven by a
new status field), Training (man-page from training collection),
Contact (palm + mailto form). Adds the full elevator i18n keyset for
both locales. Extends the projects schema with an optional
status: 'running' | 'deployed' | 'wip' field defaulting to 'deployed'.

The elevator chrome is still mounted per-page in this commit; the next
commit moves it to BaseLayout and wires the persistent panel on every
page.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — BaseLayout migration + chatbot/Navbar/Hero/React removal

**Goal:** Make the elevator chrome (HUD + panel + tweaks) appear on every page through `BaseLayout`. Remove the chatbot React island, the old Navbar, the old Hero, and the React integration from the Astro config and `package.json`.

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `astro.config.mjs`
- Modify: `package.json` (remove `@astrojs/react`, `react`, `react-dom`)
- Modify: `src/pages/index.astro` and `src/pages/en/index.astro` (remove duplicate chrome mounts now in BaseLayout)
- Delete: `src/components/Navbar.astro`
- Delete: `src/components/Hero.astro`
- Delete: `src/components/DarkModeToggle.astro`
- Delete: `src/components/chatbot/` (entire directory)

### Tasks

- [ ] **6.1: Add a `currentFloor` prop to `BaseLayout`**

`BaseLayout.astro` should accept a `currentFloor` prop (0..5 or `undefined`). Deep-route pages will pass it; the home pages don't need to (they own their own panel rendering inside the page for the controller to wire to). However, since the panel is rendered globally now, we need a way to skip rendering it twice on the home.

Strategy: render the chrome via `BaseLayout` everywhere, BUT:
- The home pages have already removed their own `<ElevatorPanel>` in 6.4 below
- Floor sections still own `data-xg-floor-section`; the controller still finds them via the home's `<div class="xg-stage">`

In `src/layouts/BaseLayout.astro`:

1. Remove the `Navbar` import and usage (lines 3 and 81).
2. Remove the `ChatWidget` import and usage (lines 6 and 86).
3. Remove the `recentPosts` query (lines 28–39).
4. Add new imports right after the SEO import:

```ts
import ElevatorHUD from '../components/elevator/ElevatorHUD.astro';
import ElevatorPanel from '../components/elevator/ElevatorPanel.astro';
import ElevatorTweaks from '../components/elevator/ElevatorTweaks.astro';
```

5. Extend the `Props` interface with `currentFloor?: number` and `homeHref?: string`:

```ts
interface Props {
  title: string;
  description?: string;
  locale: Locale;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  authorName?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>;
  currentFloor?: number;
  homeHref?: string;
}
```

6. Destructure them: replace the existing destructuring line with:

```ts
const { title, description, locale, canonicalUrl, ogImage, ogType, publishedTime, authorName, tags, jsonLd, currentFloor, homeHref } = Astro.props;
```

7. In the body, replace the line `<Navbar locale={locale} />` with the chrome mounts. The new body section reads:

```astro
<body class="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[var(--z-skip-link)] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-white focus:rounded-md focus:text-sm focus:font-medium">
    {t(locale, 'skipToContent')}
  </a>
  <ElevatorHUD locale={locale} />
  <ElevatorPanel locale={locale} currentFloor={currentFloor ?? 0} homeHref={homeHref ?? (locale === 'en' ? '/en' : '')} />
  <ElevatorTweaks locale={locale} />
  <main id="main-content" class="flex-1">
    <slot />
  </main>
  <Footer locale={locale} />
  <script>
    import '../components/elevator/elevator.client.ts';
  </script>
</body>
```

8. The link to elevator.css must be reachable globally. Add at the top of the file's `<head>` block (just under the existing SEO import line, or just before `</head>`):

```astro
<style is:global>
  @import '../components/elevator/elevator.css';
</style>
```

9. Remove the `pt-[var(--navbar-height)]` from `<main>` since there's no Navbar anymore (already handled in step 7's `<main>` rewrite — confirm `pt-[var(--navbar-height)]` is gone).

- [ ] **6.2: Remove the chatbot, Navbar, Hero, DarkModeToggle**

```bash
trash src/components/chatbot
trash src/components/Navbar.astro
trash src/components/Hero.astro
trash src/components/DarkModeToggle.astro
```

> Per `~/.claude/rules/safe-delete.md`, use `trash` (trash-cli), not `rm`.

- [ ] **6.3: Uninstall React + React integration**

```bash
pnpm remove @astrojs/react react react-dom
```

- [ ] **6.4: Strip React from `astro.config.mjs`**

In `src/../astro.config.mjs` (project root):

1. Remove the import `import react from '@astrojs/react';`
2. Remove `react()` from the `integrations` array.

The file should look like:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xgueret.github.io',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr', en: 'en' },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
```

- [ ] **6.5: Remove duplicate chrome mounts from home pages**

In `src/pages/index.astro` (FR home), remove these lines (now provided by BaseLayout):

```
import ElevatorPanel from '../components/elevator/ElevatorPanel.astro';
import ElevatorHUD from '../components/elevator/ElevatorHUD.astro';
import ElevatorTweaks from '../components/elevator/ElevatorTweaks.astro';
```

```
<ElevatorHUD locale={locale} />
<ElevatorPanel locale={locale} currentFloor={0} />
<ElevatorTweaks locale={locale} />
```

```
<script>
  import '../components/elevator/elevator.client.ts';
</script>
```

Also remove the `<style is:global>@import '../components/elevator/elevator.css';@import '../components/floors/floors.css';...</style>` block, except for the `floors.css` import and the body-overflow rule (those are home-only). Replace with:

```astro
<style is:global>
  @import '../components/floors/floors.css';
  body { overflow: hidden; height: 100%; }
  main#main-content { padding: 0 !important; }
</style>
```

The home file now boils down to:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ElevatorDoors from '../components/elevator/ElevatorDoors.astro';
import FloorHero from '../components/floors/FloorHero.astro';
import FloorCV from '../components/floors/FloorCV.astro';
import FloorArticles from '../components/floors/FloorArticles.astro';
import FloorProjects from '../components/floors/FloorProjects.astro';
import FloorTraining from '../components/floors/FloorTraining.astro';
import FloorContact from '../components/floors/FloorContact.astro';
import { t } from '../i18n';
const locale = 'fr';
---
<BaseLayout title={t(locale, 'siteTitle')} description={t(locale, 'siteDescription')} locale={locale} currentFloor={0}>
  <style is:global>
    @import '../components/floors/floors.css';
    body { overflow: hidden; height: 100%; }
    main#main-content { padding: 0 !important; }
  </style>
  <noscript>
    <style>
      body { overflow: auto !important; height: auto !important; }
      .xg-floor { position: relative !important; opacity: 1 !important; pointer-events: auto !important; padding: 56px 24px !important; }
      .xg-doors, .xg-streaks, .xg-arrival, .xg-door-flash, .xg-door-seam, .xg-tweaks { display: none !important; }
    </style>
  </noscript>

  <div class="xg-stage">
    <FloorHero locale={locale} />
    <FloorCV locale={locale} />
    <FloorArticles locale={locale} />
    <FloorProjects locale={locale} />
    <FloorTraining locale={locale} />
    <FloorContact locale={locale} />
  </div>

  <ElevatorDoors />
</BaseLayout>
```

Apply the equivalent change to `src/pages/en/index.astro` (paths use `../../`).

- [ ] **6.6: Remove the chatbot i18n keys**

Open `src/i18n/fr.ts`. Delete the lines under the `// Chatbot` comment (chatbotTitle, chatbotSubtitle, chatbotPlaceholder, chatbotWelcome, chatbotRecentArticles, chatbotViewAll, chatbotNoAnswer). Same in `src/i18n/en.ts`.

- [ ] **6.7: Remove the legacy navbar height var if unused**

In `src/styles/global.css`, the `--navbar-height: 72px;` line in `:root` (line 33) is no longer referenced. Remove that single line. Don't touch other `--color-*` variables yet — they're still used by deep routes.

- [ ] **6.8: Verify build**

```bash
pnpm build
```

Expected: build passes. There must be no error mentioning `react`, `Navbar`, `Hero`, `DarkModeToggle`, `chatbot`, or `--navbar-height`. If any deep-route page (`/about`, `/cv`, `/contact`, etc.) still imports a deleted component, fix that page to remove the import. (Note: `/about` and `/contact` are kept for now and will be turned into stubs in phase 8 — they should not import `Navbar` since `BaseLayout` no longer renders one. They also shouldn't import `Hero`. If they do, remove the imports.)

If `pnpm build` reports unused imports, remove them in the offending pages.

- [ ] **6.9: Visual smoke check across the site**

```bash
pnpm dev
```

Visit:
- `/` — elevator works, HUD top-right, panel left, tweaks bottom-right
- `/en/` — same in EN
- `/posts/` — old listing visible (not yet reskinned), but elevator panel + HUD now visible on the page; clicking a hex should navigate to `/#XX`
- `/posts/<any-slug>/` — old article view + elevator panel; clicking hex navigates to home
- `/cv/` — old layout + elevator panel
- `/projects` — old layout + elevator panel
- `/training` — old layout + elevator panel
- `/categories/` — old layout + elevator panel

Expected:
- The elevator chrome is visible on every page.
- Clicking a hex from any deep route takes you to `/#XX` (or `/en/#XX`) and the home animates to that floor.
- The chatbot is gone.
- The old top Navbar is gone.

If the old `/contact` page renders a hero or navbar, it's because it imported a now-deleted component. Strip those imports.

- [ ] **6.10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(layout): mount elevator chrome globally; drop React + Navbar + Hero + chatbot

Moves the ElevatorHUD, ElevatorPanel, and ElevatorTweaks into
BaseLayout so every page (home + deep routes) renders the persistent
elevator panel. Hex anchors on deep routes navigate to /#XX (or
/en/#XX) so the home animates to the requested floor on arrival.

Removes the React island chatbot (and its i18n keys), the old Navbar,
the old Hero, and the DarkModeToggle component (folded into the HUD).
Uninstalls @astrojs/react, react, and react-dom.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Reskin deep routes

**Goal:** Bring the new palette/typography/components to `/posts/`, `/posts/[slug]`, `/categories/*`, `/projects`, `/training`, `/cv`. No logic changes — only CSS class swaps and `--color-*` → `--xg-*` migrations in templates.

The strategy is to use the `--xg-*` tokens throughout the listings and rebuild card components on top of `FuseCard` where it makes sense, while keeping search and pagination logic untouched.

**Files (modified):**
- `src/components/ArticleCard.astro` (replace internals with FuseCard wrapper)
- `src/components/ArticlesGrid.astro` (use updated ArticleCard, restyle wrapper)
- `src/components/Pagination.astro` (token migration)
- `src/components/CategoriesCloud.astro` (token migration)
- `src/components/TrainingsGrid.astro` (token migration; switch to FuseCard if it produces a coherent visual)
- `src/components/ProjectsGrid.astro` (token migration; keep search + show-more)
- `src/components/Footer.astro` (slim restyle)
- `src/components/LanguageSwitcher.astro` (mini restyle)
- `src/layouts/PageLayout.astro` (slim wrapper)
- `src/layouts/PostLayout.astro` (slim wrapper)
- `src/pages/posts/[...page].astro`, `src/pages/en/posts/[...page].astro`
- `src/pages/posts/[...slug].astro`, `src/pages/en/posts/[...slug].astro`
- `src/pages/categories/index.astro`, `src/pages/en/categories/index.astro`
- `src/pages/categories/[...path].astro`, `src/pages/en/categories/[...path].astro`
- `src/pages/projects.astro`, `src/pages/en/projects.astro`
- `src/pages/training/index.astro`, `src/pages/en/training/index.astro`
- `src/pages/cv.astro`, `src/pages/en/cv.astro`

> The deep routes use Tailwind v4 arbitrary values like `bg-[var(--color-bg)]`. Migration: search-and-replace `--color-bg` → `--xg-bg`, `--color-bg-alt` → `--xg-surface`, `--color-bg-section` → `--xg-card`, `--color-text` → `--xg-text`, `--color-text-muted` → `--xg-muted`, `--color-text-light` → `--xg-muted`, `--color-border` → `--xg-border`, `--color-accent` → `--xg-accent`, `--color-accent-hover` → `--xg-accent-soft`, `--color-primary` → `--xg-text`, `--color-primary-dark` → `--xg-bg`. The legacy CSS variables remain in `global.css` until phase 8 to keep older references valid during refactor.

### Tasks

- [ ] **7.1: Set deep-route LCD via per-page `currentFloor`**

For each deep-route page, pass the right `currentFloor` to `BaseLayout` so the LCD shows the right code:

| File | currentFloor |
|---|---|
| `src/pages/posts/[...page].astro` and EN equivalent | `2` |
| `src/pages/posts/[...slug].astro` and EN equivalent | `2` |
| `src/pages/categories/index.astro` and EN equivalent | `2` |
| `src/pages/categories/[...path].astro` and EN equivalent | `2` |
| `src/pages/projects.astro` and EN equivalent | `3` |
| `src/pages/training/index.astro` and EN equivalent | `4` |
| `src/pages/cv.astro` and EN equivalent | `1` |

In each file's `<BaseLayout>` invocation, add the `currentFloor={N}` prop. Example for `src/pages/cv.astro`:

```astro
<PageLayout title={t(locale, 'cv')} description={t(locale, 'cvDescription')} locale={locale} currentFloor={1} jsonLd={jsonLd}>
```

(`PageLayout`/`PostLayout` need to forward this prop — see 7.2.)

- [ ] **7.2: Forward `currentFloor` from PageLayout/PostLayout to BaseLayout**

Open `src/layouts/PageLayout.astro` (and `PostLayout.astro`). Add `currentFloor?: number` to the Props interface, destructure it, and pass it to the wrapped `<BaseLayout currentFloor={currentFloor}>`.

For example, in `src/layouts/PageLayout.astro`:

```ts
interface Props {
  title: string;
  description?: string;
  locale: Locale;
  // ...existing fields
  currentFloor?: number;
  jsonLd?: Record<string, unknown>;
}
const { title, description, locale, currentFloor, jsonLd /*, ...rest */ } = Astro.props;
```

```astro
<BaseLayout title={title} description={description} locale={locale} currentFloor={currentFloor} jsonLd={jsonLd}>
  <slot />
</BaseLayout>
```

Apply equivalent change to `PostLayout.astro`.

- [ ] **7.3: Migrate `--color-*` tokens in deep-route components**

For each file in this list:

- `src/components/ArticleCard.astro`
- `src/components/ArticlesGrid.astro`
- `src/components/Pagination.astro`
- `src/components/CategoriesCloud.astro`
- `src/components/TrainingsGrid.astro`
- `src/components/ProjectsGrid.astro`
- `src/components/Footer.astro`
- `src/components/LanguageSwitcher.astro`
- `src/layouts/PageLayout.astro`
- `src/layouts/PostLayout.astro`
- All page files in `src/pages/posts/`, `src/pages/categories/`, `src/pages/training/`, `src/pages/cv.astro`, `src/pages/projects.astro`, and their `en/` equivalents

apply the substitutions listed in the phase preamble. Run the following from the repo root, one at a time, reviewing each diff carefully before moving on (NOT a sed batch — confirm visually each replacement is contextually correct, especially `--color-primary` → `--xg-text` which is a semantic change):

```bash
grep -rln "var(--color-bg)" src/
```

Edit each match: replace `var(--color-bg)` with `var(--xg-bg)`.

```bash
grep -rln "var(--color-bg-alt)" src/
```

Replace with `var(--xg-surface)`. Continue for each token in the table.

After all substitutions, run:

```bash
grep -rln "var(--color-" src/
```

Expected: only matches inside `src/styles/global.css` (the legacy declarations themselves). If any other file still references `--color-*`, confirm it's intentional or finish the migration.

- [ ] **7.4: Replace `ArticleCard` internals with `FuseCard`**

`src/components/ArticleCard.astro` should now wrap `FuseCard`. Open the file (read its current shape first), and replace its body with:

```astro
---
import { type Locale, t, formatDate } from '../i18n';
import FuseCard from './ui/FuseCard.astro';

interface Props {
  locale: Locale;
  href: string;
  title: string;
  description?: string;
  date: Date;
  image?: string;
  category?: string;
}
const { locale, href, title, description, date, image, category } = Astro.props;
const dateStr = formatDate(date, locale);
const label = `// ${dateStr}${category ? ' · ' + category.toUpperCase() : ''}`;
---
<FuseCard
  href={href}
  label={label}
  title={title}
  description={description}
  cover={image}
  state="deployed"
  stateLabel={t(locale, 'elevator_f02_state_published')}
/>
```

Update `ArticlesGrid.astro` to call `<ArticleCard>` with the new prop names (or leave the existing call site unchanged if the call already passes these props — read it first and adapt).

- [ ] **7.5: Restyle `Footer.astro` to slim industrial**

Open `src/components/Footer.astro`. Read its current contents. Replace the inner markup with:

```astro
---
import { type Locale, t } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher.astro';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="xg-footer">
  <div class="left">
    <span class="copy">© {year} Xavier GUERET · {t(locale, 'allRightsReserved')}</span>
  </div>
  <div class="right">
    <LanguageSwitcher locale={locale} />
    <a href="https://github.com/xgueret" target="_blank" rel="noopener" class="ghlink">GitHub ↗</a>
  </div>
</footer>

<style>
  .xg-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-top: 1px solid var(--xg-border);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    color: var(--xg-muted);
    background: var(--xg-bg);
  }
  .xg-footer .right { display: flex; gap: 14px; align-items: center; }
  .xg-footer .ghlink {
    color: var(--xg-cool);
    text-decoration: none;
  }
  .xg-footer .ghlink:hover { color: var(--xg-text); }
  @media (max-width: 800px) {
    .xg-footer { flex-direction: column; gap: 8px; padding: 14px; padding-bottom: 90px; /* leave room for bottom panel */ }
  }
</style>
```

- [ ] **7.6: Restyle `LanguageSwitcher.astro` (mini)**

Open `src/components/LanguageSwitcher.astro`. Replace its template with:

```astro
---
import { type Locale, t, getAlternateLocale, localizedPath } from '../i18n';
interface Props { locale: Locale; pathname?: string; }
const { locale, pathname } = Astro.props;
const alt = getAlternateLocale(locale);
const path = pathname ?? Astro.url.pathname;
const altPath = localizedPath(alt, path);
const label = alt === 'en' ? 'EN' : 'FR';
---
<a class="xg-lang" href={altPath} aria-label={t(locale, alt === 'en' ? 'switchToEn' : 'switchToFr')}>
  {label}
</a>

<style>
  .xg-lang {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 2px;
    color: var(--xg-text);
    background: var(--xg-surface);
    border: 1px solid var(--xg-border);
    border-radius: 3px;
    padding: 3px 8px;
    text-decoration: none;
    transition: border-color 0.15s, color 0.15s;
  }
  .xg-lang:hover { border-color: var(--xg-accent); color: var(--xg-accent); }
</style>
```

- [ ] **7.7: Verify build**

```bash
pnpm build
```

Expected: build passes. Check that the deep-route templates don't error on the missing `pt-[var(--navbar-height)]` (already removed), the missing `Navbar` (already removed), or any leftover `--color-*` references.

- [ ] **7.8: Visual check deep routes**

```bash
pnpm dev
```

Verify each deep route in both locales:
- `/posts/`, `/en/posts/` — listing styled with industrial palette, FuseCard look on each post
- `/posts/<slug>/`, `/en/posts/<slug>/` — article reads with new fonts/palette
- `/categories/`, `/en/categories/` — cloud styled with new palette
- `/categories/<cat>`, `/en/categories/<cat>` — category page styled
- `/projects`, `/en/projects` — list with search + show-more works, new palette
- `/training`, `/en/training` — training list with new palette
- `/cv`, `/en/cv` — CV markdown body + PDF button with new palette

For each: the elevator panel (left desktop, bottom mobile) shows the right LCD code (1 for cv, 2 for posts/categories, 3 for projects, 4 for training).

- [ ] **7.9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
style(routes): reskin deep routes to elevator palette

Migrates --color-* token references to --xg-* across deep-route pages
and components. ArticleCard now renders via FuseCard. Footer is slim
and industrial. LanguageSwitcher is a mini hex pill. PageLayout and
PostLayout forward the new currentFloor prop so the elevator panel's
LCD reflects the route (cv→01, posts/categories→02, projects→03,
training→04). The legacy --color-* variables remain in global.css
until phase 8 to keep transition-time references valid.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Retire `/about` and `/contact`, polish, final QA

**Goal:** Replace `/about` and `/contact` with meta-refresh redirect stubs (FR + EN), purge the legacy `--color-*` palette and any leftover Tailwind config that no longer applies, verify acceptance criteria from the spec.

**Files:**
- Modify: `src/pages/about.astro`, `src/pages/en/about.astro` (rewrite as meta-refresh stubs)
- Modify: `src/pages/contact.astro`, `src/pages/en/contact.astro` (rewrite as meta-refresh stubs)
- Modify: `src/styles/global.css` (remove orphan `--color-*` block, keep `@theme`, fonts, prose overrides)
- Modify or delete: `tailwind.config.mjs`

### Tasks

- [ ] **8.1: Replace `/about` (FR) with a meta-refresh stub**

Open `src/pages/about.astro`. Replace the entire file with:

```astro
---
// /about retired in elevator redesign — redirects to floor 01 (CV)
const target = '/#01';
---
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content={`0; url=${target}`} />
    <link rel="canonical" href="https://xgueret.github.io/" />
    <title>Redirection…</title>
  </head>
  <body>
    <p>Redirection vers <a href={target}>{target}</a>…</p>
    <script>window.location.replace('/#01');</script>
  </body>
</html>
```

- [ ] **8.2: Replace `/en/about` with a meta-refresh stub**

Open `src/pages/en/about.astro`. Replace the entire file with:

```astro
---
const target = '/en/#01';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content={`0; url=${target}`} />
    <link rel="canonical" href="https://xgueret.github.io/en/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>Redirecting to <a href={target}>{target}</a>…</p>
    <script>window.location.replace('/en/#01');</script>
  </body>
</html>
```

- [ ] **8.3: Replace `/contact` (FR) with a meta-refresh stub**

Open `src/pages/contact.astro`. Replace the entire file with:

```astro
---
const target = '/#TOP';
---
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content={`0; url=${target}`} />
    <link rel="canonical" href="https://xgueret.github.io/" />
    <title>Redirection…</title>
  </head>
  <body>
    <p>Redirection vers <a href={target}>{target}</a>…</p>
    <script>window.location.replace('/#TOP');</script>
  </body>
</html>
```

- [ ] **8.4: Replace `/en/contact` with a meta-refresh stub**

Open `src/pages/en/contact.astro`. Replace with:

```astro
---
const target = '/en/#TOP';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content={`0; url=${target}`} />
    <link rel="canonical" href="https://xgueret.github.io/en/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>Redirecting to <a href={target}>{target}</a>…</p>
    <script>window.location.replace('/en/#TOP');</script>
  </body>
</html>
```

- [ ] **8.5: Confirm no remaining `--color-*` references outside `global.css`**

```bash
grep -rln "var(--color-" src/
```

Expected: only `src/styles/global.css` matches. If anything else matches, finish the migration before deleting the legacy block.

- [ ] **8.6: Remove the legacy `--color-*` palette from `global.css`**

In `src/styles/global.css`, delete:

1. The entire `@layer base { :root { ... } .dark { ... } body { ... } }` block (the parts that set `--color-*` tokens — keep only what's still needed).

After cleanup, the file should still contain:
- `@import` lines for fonts (Plus Jakarta Sans + Space Grotesk + JetBrains Mono)
- The `@theme { ... }` block (with `--color-navy*` if still used — they were defined but `--color-navy` and `--color-accent` here are only used for theme tokens; they can stay if needed by Tailwind v4, otherwise remove)
- The `--xg-*` palette blocks (added in phase 1)
- The `body { font-family: ...; }` rule (keep)
- The `.btn`, `.btn-primary`, `.btn-outline` classes (still used by `/cv` PDF download button) — change their `var(--color-*)` references to `var(--xg-*)` here too
- The `.category-pill` class — change to use `--xg-*`
- The `.dark .prose` block — change to use `--xg-*`
- The `prefers-reduced-motion` block — keep

After editing, the simplified `global.css` should look like:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/plus-jakarta-sans/800.css';
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/600.css';

@theme {
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --z-skip-link: 60;
}

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
  --xg-rivet: #3a3d52;
  --xg-metal-1: #2a2d3e;
  --xg-metal-2: #1a1c2a;
}
html[data-theme="light"] {
  --xg-bg: #f4f5f8;
  --xg-surface: #ffffff;
  --xg-card: #ffffff;
  --xg-border: #d8dbe4;
  --xg-text: #1a1c2a;
  --xg-muted: #4a5266;
  --xg-accent: #7c3aed;
  --xg-accent-soft: #7c3aed22;
  --xg-cool: #0284c7;
  --xg-industrial: #c2410c;
  --xg-top: #0d9488;
  --xg-rivet: #c7cad5;
  --xg-metal-1: #e1e3eb;
  --xg-metal-2: #d0d3de;
}
html[data-accent="prusse"] { --xg-accent: #1d4e89; --xg-accent-soft: #1d4e8933; }
html[data-accent="violet"] { --xg-accent: #a855f7; --xg-accent-soft: #a855f733; }
html[data-accent="amber"]  { --xg-accent: #fb923c; --xg-accent-soft: #fb923c33; }

body {
  font-family: var(--font-sans);
  background-color: var(--xg-bg);
  color: var(--xg-text);
  line-height: 1.6;
}

.btn {
  display: inline-flex; align-items: center; gap: 0.75rem;
  padding: 1rem 2rem; font-size: 1.0625rem; font-weight: 600;
  border-radius: 0.5rem; cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, outline-color 0.2s;
  border: 2px solid transparent; text-decoration: none;
}
.btn:focus-visible { outline: 2px solid var(--xg-accent); outline-offset: 2px; }
.btn-primary {
  background-color: var(--xg-accent);
  color: white;
  border-color: var(--xg-accent);
}
.btn-primary:hover { background-color: var(--xg-accent-soft); border-color: var(--xg-accent-soft); }
.btn-outline {
  background-color: transparent;
  color: var(--xg-text);
  border-color: var(--xg-border);
}
.btn-outline:hover { background-color: var(--xg-surface); border-color: var(--xg-muted); }

.category-pill {
  background: hsl(var(--pill-hue), 30%, 25%);
  color: hsl(var(--pill-hue), 50%, 80%);
  border: 1px solid hsl(var(--pill-hue), 25%, 35%);
}

.prose {
  --tw-prose-body: var(--xg-muted);
  --tw-prose-headings: var(--xg-text);
  --tw-prose-links: var(--xg-cool);
  --tw-prose-bold: var(--xg-text);
  --tw-prose-code: var(--xg-cool);
  --tw-prose-pre-bg: var(--xg-card);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

> Note: `.dark` class is kept on `<html>` by the FOUC script for backward compat but no longer drives any rule — that's fine, it's a no-op selector now. We could remove `classList.toggle('dark')` from the inline script, but leaving it makes the migration safer if any third-party tool ever inspects it.

- [ ] **8.7: Remove `tailwind.config.mjs` if obsolete**

```bash
cat tailwind.config.mjs
```

If the file only contains a `max-w-site` extension and `safelist` (typical of the existing project per memory), confirm via `grep -rln "max-w-site" src/` whether anything still uses it. If empty:

```bash
trash tailwind.config.mjs
```

Otherwise: keep, but migrate any color references inside it to match the new palette.

- [ ] **8.8: Verify build**

```bash
pnpm build
```

Expected: build passes, no errors. Site is fully migrated.

- [ ] **8.9: Run the spec acceptance checklist manually**

With `pnpm dev` running, walk through every item in the spec's section 10 (acceptance criteria). For each:

1. `pnpm build` succeeds → already done in 8.8.
2. Home `/` shows 6 floors with all interactions working → click hex 0..5, ▲/▼, Arrow keys, digit keys, hash deep link.
3. Home `/en/` mirrors `/` in English → repeat the above on `/en/`.
4. Deep routes render with new palette + persistent panel → visit `/posts/`, `/posts/<slug>/`, `/categories/`, `/projects`, `/training`, `/cv`. Confirm panel is visible and LCD shows correct floor code.
5. Hex on deep route → home animates to that floor → from `/posts/<slug>/`, click hex `03` → expect to land on `/#03` with door animation.
6. `/about` and `/contact` redirect → visit each, confirm browser ends on `/#01` and `/#TOP`. Same for `/en/about` and `/en/contact`.
7. Theme + accent persistence → toggle DARK/LIGHT, switch accent to amber, hard reload → choices persisted.
8. No FOUC → with throttled CPU + slow 3G in DevTools, reload home — initial paint should NOT flash white-then-dark; should be dark from frame 0 (because the inline FOUC script in `BaseLayout` runs before paint).
9. `prefers-reduced-motion` → enable in DevTools; navigate floors; verify no door/streak/flash, only opacity fade.
10. Lighthouse audit on `/` and one post → in DevTools → Lighthouse → run for Mobile + Desktop. Note the a11y score (target ≥ 95).
11. Console errors → open DevTools console on `/`, `/posts/`, `/posts/<slug>/`, `/cv`, `/projects`, `/training`. No red errors.
12. Chatbot is gone → `grep -rln chatbot src/` returns nothing; `grep -E "react|@astrojs/react" package.json` returns nothing.

If any item fails, fix it before committing. Common issues + remedies:
- **Item 5 fails (hash navigation broken from deep route):** the `xg-hex` anchor's `href` includes the home prefix; if you're on `/en/posts/foo/` and click `01`, you should go to `/en/#01`. Check `ElevatorPanel.astro` `homeHref` defaulting in `BaseLayout` (it must be `/en` for EN routes). The fix is in `BaseLayout` step 6.1.7 — verify `homeHref` is computed from the `locale` prop.
- **Item 8 fails (FOUC):** confirm the `<script is:inline>` in `BaseLayout.astro` runs before any link to `global.css` in `<head>`. The script should be in `<head>`, not at the bottom of `<body>`.
- **Item 11 fails with `404 on chunk-*.js`:** stale dist? Run `pnpm build` again after clearing `.astro` cache: `trash .astro dist && pnpm build`.

- [ ] **8.10: Commit final polish**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(redirects): retire /about + /contact; finish palette migration

Both /about and /en/about become 0-second meta-refresh stubs to /#01
(CV floor). Both /contact and /en/contact redirect to /#TOP. Removes
the orphan --color-* palette from global.css now that no template
depends on it; the .btn, .category-pill, and .prose helpers are
ported to --xg-* tokens. Removes obsolete tailwind.config.mjs if it
was only used for max-w-site.

Acceptance criteria from the spec (section 10) verified manually:
build passes, all 6 floors functional in FR+EN, deep routes reskinned
with persistent elevator panel, theme + accent persisted, redirects
work, no FOUC, prefers-reduced-motion respected, no console errors.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Done

After phase 8 you have 8 commits on `main`, the elevator redesign is shipped, and every spec acceptance criterion is met. The user can run `pnpm dev` and walk through the building one more time, then push to `origin main` to trigger the GitHub Pages deploy.

```bash
git log --oneline -10
```

Expected last 8 commits (ordered newest first):
```
feat(redirects): retire /about + /contact; finish palette migration
style(routes): reskin deep routes to elevator palette
refactor(layout): mount elevator chrome globally; drop React + Navbar + Hero + chatbot
feat(home): elevator-themed home with six floors (FR + EN)
feat(elevator): wire navigation, animations, hash sync, persistence
feat(elevator): add static panel, HUD, and tweaks chrome
feat(ui): add atomic UI primitives for elevator redesign
chore(deps): add display fonts and elevator theming tokens
```
