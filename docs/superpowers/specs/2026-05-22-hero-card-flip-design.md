# Hero portrait → flip card with skill gauges — Design

> **Status**: Approved (2026-05-22)
> **Branch**: `feat/card-flip`
> **Scope**: Replace the static hero portrait with a 3D flip card that reveals 6 skill gauges on the back face.

------

## 🎯 Goal

Transform the hero portrait (currently a static `<picture>` with an offset ocean accent block behind) into an interactive card that flips on hover/tap/keyboard to reveal Xavier's 6 core skills as horizontal animated gauges. The accent block stays fixed behind the flipping card to keep visual depth during animation.

## 🧠 Mental model

```
┌─────────────────────────────────────┐
│ Hero section                        │
│                                     │
│ ┌──────────┐    ┌───────────────┐  │
│ │ Headline │    │  ┌──────────┐ │  │
│ │ + quote  │    │  │ Card 3D  │ │  │ ← rotates on Y axis
│ │ + CTAs   │    │  │ flips    │ │  │
│ │          │    │  └──────────┘ │  │
│ │          │    │ ▒▒ accent ▒▒▒▒│  │ ← STAYS FIXED behind
│ └──────────┘    └───────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

------

## 🏗️ Architecture

### New files

- `src/components/HeroPortraitCard.astro` — the flip card (perspective wrapper + 3D inner + 2 faces + inline `<script>`).
- `src/data/heroSkills.ts` — typed array of 6 skills (key + level). Single source of truth for values.

### Modified files

- `src/components/Hero.astro` — replace the `<picture>...</picture>` block (lines 59–79) with `<HeroPortraitCard locale={locale} />`. The accent block sibling (lines 55–58) stays untouched.
- `src/i18n/fr.ts` and `src/i18n/en.ts` — add `skills.title`, `skills.back`, and one label per skill key.

### Component structure

```
HeroPortraitCard.astro
└── <button type="button" aria-pressed="false" aria-label="…" class="card-perspective">
    └── div.card-3d                      ← rotateY toggled
        ├── div.face-front               ← backface-visibility: hidden
        │   ├── <picture> (existing img sources)
        │   └── span.flip-affordance (↻ icon, hover/focus only)
        └── div.face-back                ← rotateY(180deg), backface-visibility: hidden
            ├── h3 (Source Serif, "Compétences" / "Skills")
            ├── ul (6 li.skill-gauge)
            │   └── li
            │       ├── div.gauge-row (label + value)
            │       └── div.gauge-track > div.gauge-fill (width: ${level}%)
            └── p.flip-hint (← retour / ← back)
```

### Why no React island

Project rule (CLAUDE.md): React only for the chatbot. Pure CSS 3D + ~30 lines of vanilla JS in an Astro `<script>` is enough for this interaction. Zero bundle cost.

------

## 📊 Data

### `src/data/heroSkills.ts`

```ts
export type HeroSkill = { key: string; level: number };

export const HERO_SKILLS: HeroSkill[] = [
  { key: 'kubernetes',    level: 90 },
  { key: 'docker',        level: 90 },
  { key: 'terraform',     level: 85 },
  { key: 'ansible',       level: 85 },
  { key: 'githubActions', level: 85 },
  { key: 'python',        level: 75 },
];
```

**Editing rules:**

- Change a `%` → edit one number here. No other file to touch.
- Add/remove a skill → add/remove a line here AND a matching `skills.<key>` entry in both `fr.ts` and `en.ts`.
- The component clamps `level` to `[0, 100]` defensively before writing to inline style.

### i18n additions

Both `src/i18n/fr.ts` and `src/i18n/en.ts`:

```ts
'skills.title':         'Compétences' | 'Skills',
'skills.back':          '← Retour'    | '← Back',
'skills.aria.flip':     'Voir mes compétences' | 'Show my skills',
'skills.kubernetes':    'Kubernetes',
'skills.docker':        'Docker',
'skills.terraform':     'Terraform',
'skills.ansible':       'Ansible',
'skills.githubActions': 'GitHub Actions',
'skills.python':        'Python',
```

------

## 🎨 Visual & interaction

### Front face (rest state)

- `<picture>` with same AVIF/WebP/PNG sources as today (`/images/moi-600.avif`, etc.).
- `aspect-[3/4] rounded-lg object-cover`. **Pixel-identical** to current build when at rest.
- `loading="eager" fetchpriority="high"` preserved (LCP element).
- Affordance: small `↻` icon, 14px `text-[var(--color-sand)]`, in a `bg-[var(--color-ocean-deep)]/60` circle, bottom-right corner, `opacity-0` by default, `opacity-100` on `:hover`/`:focus-visible` of the wrapper, `transition: opacity 200ms`.

### Back face

- Background: `bg-[var(--color-ocean-deep)]` (token confirmed in `src/styles/global.css:22`).
- Padding: `p-8 lg:p-10`.
- Title: Source Serif 4, `text-xl`, `text-[var(--color-sand)]`, `mb-6`.
- Skill list: `<ul class="flex flex-col gap-4">`.
- Per skill:
  - Row: `flex justify-between items-baseline mb-1.5`
    - Label: Geist Sans 14px `text-[var(--color-sand)]`.
    - Value: JetBrains Mono 12px `text-[var(--color-sand)]/70`, format `"NN%"`.
  - Track: `h-1 rounded-full bg-[var(--color-sand)]/15 overflow-hidden`.
  - Fill: `h-full rounded-full bg-[var(--color-coral)] origin-left`, inline `style="width: ${clamp(level)}%"`.
- Footer: JetBrains Mono 11px `text-[var(--color-sand)]/60`, content from `t(locale, 'skills.back')`.

### Animation timings

| Element     | Property    | Duration | Easing                          | Delay                          |
|-------------|-------------|----------|----------------------------------|--------------------------------|
| `.card-3d`  | `transform` | 700ms    | `cubic-bezier(0.4, 0.0, 0.2, 1)` | 0                              |
| `.gauge-fill` | `width`   | 900ms    | `ease-out`                       | `100ms * index` (staggered)    |
| `.flip-affordance` | `opacity` | 200ms | `ease`                          | 0                              |

The gauge fills are initially at `width: 0` and transition to `width: ${level}%` when the parent gets `.is-flipped`. Achieved via CSS:

```css
.card-3d:not(.is-flipped) .gauge-fill { width: 0; }
.card-3d.is-flipped .gauge-fill { width: var(--level); }
```

`--level` is set per-element via inline `style="--level: 90%"`. Stagger delay set via `style="--level: 90%; transition-delay: 0ms"` (index-based).

### Triggers

| Input          | Behaviour                                                                 |
|----------------|---------------------------------------------------------------------------|
| Mouse hover    | `pointerenter` adds `.is-flipped`; `pointerleave` removes it              |
| Touch tap      | `click` toggles `.is-flipped` (sticky)                                    |
| Keyboard       | `<button>` native: Enter/Space toggle `.is-flipped`                       |
| Focus          | `:focus-visible` shows coral 2px outline, offset 4px                      |

JS implementation note: filter `pointerenter`/`pointerleave` by `event.pointerType === 'mouse'` to prevent touch devices from triggering hover-leave on tap-out.

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .card-3d { transform: none !important; transition: opacity 150ms; }
  .face-back { opacity: 0; }
  .card-3d.is-flipped .face-front { opacity: 0; }
  .card-3d.is-flipped .face-back { opacity: 1; }
  .gauge-fill { transition: none; }
}
```

→ flip is replaced by an opacity crossfade; gauges render filled instantly.

------

## ♿ Accessibility

### Semantics

- Outer wrapper = native `<button type="button">` — free Enter/Space/focus/tab.
- `aria-pressed="false"` at rest, `"true"` when `.is-flipped`. JS toggles in sync with the class.
- `aria-label={t(locale, 'skills.aria.flip')}` — localized, more useful than relying on inner text.
- Front `<img>` keeps its `alt={t(locale, 'author')}`.
- Back `<ul>` with 6 `<li>` semantically conveys "list of 6 skills".
- `<div class="gauge-track">` and `.gauge-fill` are `aria-hidden="true"` — decorative; the `<p>` already announces label + percentage.

### Focus

- `:focus-visible` only (no outline on mouse click). Coral 2px ring, 4px offset.
- Focus stays on the button through the flip — no programmatic focus shift.

### Contrast

- `var(--color-sand)` (`oklch(97% 0.012 65)`) on `var(--color-ocean-deep)` (`oklch(28% 0.09 220)`): ≥ 12:1 — well above WCAG AA. To re-verify at implementation time with a contrast checker.
- Coral fill on sand/15 track is decorative; percentage value lives in the text node, so contrast requirement does not apply to the bar itself.

### No-JS

If `<script>` fails or is disabled: front face renders normally, button is inert. No broken portrait, no missing image. Acceptable graceful degradation.

------

## ✅ Verification

### Build

1. `pnpm build` — passes without errors or new warnings.
2. `pnpm dev` — no server-side console errors.
3. Astro `check` (if available in project) — typecheck clean on `heroSkills.ts` and component.

### Browser (manual, golden path)

1. **Chrome desktop, FR `/`**: hover → flip forward, leave → flip back. 6 gauges fill staggered after flip. Title "Compétences".
2. **Chrome desktop, EN `/en/`**: same, title "Skills", labels in EN.
3. **Chrome mobile emulation**: tap toggles sticky. No double-fire from residual hover state.
4. **Keyboard only**: Tab reaches the card (coral focus ring visible); Enter flips; Space flips.
5. **DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`**: flip becomes opacity crossfade, no 3D rotation, gauges render instantly filled.
6. **Lighthouse a11y on `/` and `/en/`**: still 100. No new violations.
7. **DOM inspect**: `<button aria-pressed="false">` at rest, `aria-label` present and locale-correct.

### Visual regression checks

- The accent ocean block does NOT rotate with the card.
- Front face is pixel-identical to current build when at rest (compare screenshots).
- Gauge labels readable on ocean-deep.

### Out of scope (intentionally)

- No unit test for `clamp(0, 100)` — trivial.
- No cross-browser matrix beyond Chrome baseline. Firefox/Safari validated once at preview time.
- No animated reveal beyond the gauges themselves (no extra confetti / particle effects).

------

## 🚫 Non-goals

- Do not add React for this. Keep the architecture rule "React = chatbot only".
- Do not move skills into a Content Collection. 6 inline entries do not justify Zod schemas.
- Do not animate the accent block (Q4 choice: stays fixed).
- Do not auto-flip on scroll (Q1 choice: user-triggered only).

------

> **Document created on**: 2026-05-22
> **Author**: Xavier Gueret (via Claude)
> **Version**: 1.0 — design approved before implementation
