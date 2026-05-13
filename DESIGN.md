---
name: Xavier GUERET — Personal Site
description: DevOps engineer blog & portfolio, written from Guadeloupe at dawn
colors:
  sable-creme: "oklch(97% 0.012 65)"
  coquille: "oklch(94% 0.010 65)"
  border-sable: "oklch(89% 0.012 65)"
  encre-ocean: "oklch(22% 0.025 220)"
  encre-ocean-muted: "oklch(45% 0.030 220)"
  encre-ocean-light: "oklch(53% 0.028 220)"
  teal-ocean: "oklch(38% 0.10 220)"
  teal-ocean-deep: "oklch(28% 0.09 220)"
  teal-ocean-light: "oklch(65% 0.13 220)"
  corail-soleil: "oklch(66% 0.17 35)"
  corail-soleil-deep: "oklch(55% 0.16 35)"
  nuit-ocean: "oklch(15% 0.02 220)"
  nuit-ocean-surface: "oklch(20% 0.025 220)"
  nuit-ocean-border: "oklch(28% 0.03 220)"
  available-emerald: "oklch(72% 0.18 145)"
typography:
  display:
    fontFamily: "'Source Serif 4', 'Source Serif Pro', Georgia, serif"
    fontSize: "clamp(2.75rem, 7vw, 5rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Source Serif 4', Georgia, serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, 'Inter Tight', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "Geist, 'Inter Tight', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Geist, 'Inter Tight', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  "4xl": "96px"
components:
  button-primary:
    backgroundColor: "{colors.teal-ocean}"
    textColor: "{colors.sable-creme}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.teal-ocean-deep}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.teal-ocean}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-outline-hover:
    backgroundColor: "{colors.coquille}"
  button-coral:
    backgroundColor: "{colors.corail-soleil}"
    textColor: "{colors.encre-ocean}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  article-card:
    backgroundColor: "{colors.sable-creme}"
    textColor: "{colors.encre-ocean}"
    rounded: "{rounded.lg}"
    padding: "0"
  availability-pill:
    backgroundColor: "{colors.coquille}"
    textColor: "{colors.encre-ocean}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  section-eyebrow:
    textColor: "{colors.teal-ocean}"
    typography: "{typography.label}"
  navbar-link:
    textColor: "{colors.encre-ocean-muted}"
    typography: "{typography.body}"
---

# Design System: Xavier GUERET — Personal Site

> **Note on the frontmatter format.** Colors are stored as `oklch()` because OKLCH is the system's source of truth (perceptually uniform, predictable contrast, designed for warm/cool tension across dark and light themes). Stitch's linter accepts hex sRGB only and will warn on these values; the warning is accepted. The sidecar at `.impeccable/design.json` carries the canonical OKLCH values plus tonal ramps.

## 1. Overview

**Creative North Star: "Les Alizés au clavier."**

The system is a personal site written from Guadeloupe at dawn — when the ocean is still dark, the sand is already warm, and the sky is opening. It is not a SaaS dashboard wearing a tropical sticker. The warm sand of the page and the cool ink of the type set up the system's defining tension: **warm/cool**, exactly as the trade winds meet the sea. Every visual decision answers to that scene.

The system explicitly rejects what `PRODUCT.md` calls out: it is **not** the generic developer portfolio (centered hero + icon-title cards + Plus Jakarta Sans), **not** SaaS corporate (navy + slate + Facebook-blue accent), **not** Klim-style editorial-magazine (display italic + ruled columns + mono labels), **not** hacker-terminal (black + green glow + monospace everywhere). The voice that already lives in the copy ("au rythme des Alizés", "esprit zen", "les doigts dans le code") drives every visual choice. If the visual stops sounding like the copy, the visual is wrong.

The register is **brand**: design IS the product. The aesthetic is **committed**, not restrained — teal-océan carries 30–60% of any given page; it is voice, not trim. Motion is **restrained**: state transitions only, no entrance choreography, no scroll-trigger. The reading task is the primary task, and the system's job is to disappear into it.

**Key Characteristics:**
- **Warm sand fields** (`sable-crème`, `coquille`) replace `#ffffff` and slate-50 as default backgrounds.
- **Deep teal-océan** as the committed brand color, carried on hero, navigation, primary CTAs.
- **Corail soleil** as a 5%-or-less accent: a single signal, never wallpaper.
- **Serif display + sans body**, neither in the impeccable reflex-reject list.
- **Flat by default**: depth comes from warm/cool color tension, not shadows.
- **Italic carries the soft voice**; the roman cut carries the technical voice.
- **Mono is reserved for code** inside articles. Mono in navigation, eyebrows, metadata = costume.

The tokens in this file live in `src/styles/global.css` and are shared across every route in the site. Homepage scope decisions cascade through PostLayout, About, CV, Projects by design — that is the point of a design system.

------

## 2. Colors: The Dawn Palette

A palette built around one scene: looking east at 6 a.m. — warm sand under bare feet, cool ink in the still-dark water, a coral sun about to break the horizon. Hues are deliberately split warm (`hue 65`) for surfaces and cool (`hue 220`) for type, so the page breathes in two registers at once.

### Primary

- **Teal Océan** (`oklch(38% 0.10 220)`): the committed brand color. Navbar background, primary CTA, hero accent, section anchor states, focus rings on the warm fields. Carries 30–60% of any given screen.
- **Teal Océan Deep** (`oklch(28% 0.09 220)`): hover state of `teal-ocean`, deeper variant for high-contrast dark surfaces.
- **Teal Océan Light** (`oklch(65% 0.13 220)`): on `nuit-ocean` dark mode where the base teal would lose contrast.

### Secondary

- **Corail Soleil** (`oklch(70% 0.17 35)`): the 5% accent. Used on the one element per fold that must be noticed — typically the italic accent word in the hero (`automatiser.`), an inline link emphasis, or an exceptional flag. Never decorative, never repeated.
- **Corail Soleil Deep** (`oklch(55% 0.16 35)`): hover state for corail-on-light buttons or links.

### Neutral (warm, hue 65)

- **Sable Crème** (`oklch(97% 0.012 65)`): default page background in light mode. Replaces `#ffffff` everywhere. Warm enough to read as cream, not enough to read as beige.
- **Coquille** (`oklch(94% 0.010 65)`): section-alt background, button-outline hover, card surface against teal blocks.
- **Border Sable** (`oklch(89% 0.012 65)`): every border in light mode. 1px solid, never wider.

### Neutral (cool, hue 220)

- **Encre Océan** (`oklch(22% 0.025 220)`): primary body text, headings. Cool-blue tint, never a flat slate. This is the "ink" half of the warm/cool pairing.
- **Encre Océan Muted** (`oklch(45% 0.030 220)`): secondary text, paragraph copy, descriptions.
- **Encre Océan Light** (`oklch(58% 0.025 220)`): tertiary text, captions, metadata, timestamps.

### Dark Mode (the night ocean)

The dark theme is a **distinct scene**, not a hue-inverted derivative. Same dawn, viewed from later in the night — the ocean dominates, the sand is barely a glow, the coral is still there but quieter.

- **Nuit Océan** (`oklch(15% 0.02 220)`): page background. Deep, cool, but not black; carries a faint teal tint.
- **Nuit Océan Surface** (`oklch(20% 0.025 220)`): section-alt, card surface.
- **Nuit Océan Border** (`oklch(28% 0.03 220)`): borders, dividers.
- **Sable Crème** stays as primary text in dark mode, giving the inverted warm/cool tension.
- **Teal Océan Light** replaces the base teal for CTAs and accents on dark surfaces.
- **Corail Soleil** stays the same — coral works on both warm and cool grounds.

### Functional

- **Available Emerald** (`oklch(72% 0.18 145)`): the availability dot in the navigation pill only. Pure functional signal — never used as decoration.

### Named Rules

**The Warm/Cool Rule.** Backgrounds are warm (hue 65). Text is cool (hue 220). The tension between them is the system's signature. Never tint both toward the same hue; never use a fully-neutral gray (`oklch(L 0 0)`).

**The 30-60 Teal Rule.** Teal-Océan must carry 30–60% of any given fold's visible area: navbar, hero block, primary CTA, or a band of section background — pick one or two per screen, never zero, never the entire page. Restraint here is failure of the brand register.

**The 5% Coral Rule.** Corail Soleil is a one-shot accent: a single state, a single element, never repeated within a fold. If you find yourself reaching for it twice on the same screen, the brand color (teal) is doing the wrong job.

**The No-White Rule.** `#ffffff` is banned. So is `#000000`. So is `color: white;` as a literal value. All neutrals must come from the named tokens above.

------

## 3. Typography

**Display Font:** Source Serif 4 (Adobe / Open Font License) with Georgia and `serif` fallbacks. Italic cut required.
**Body Font:** Geist (Vercel / Open Font License) with Inter Tight and system-ui fallbacks.
**Mono Font:** JetBrains Mono — reserved for code blocks in articles only.

**Character:** Source Serif 4 is a humanist serif with a confident italic and a clean roman cut. It does the work of carrying the warm, oral half of the brand voice without falling into the Fraunces / Newsreader / Cormorant editorial-magazine reflex. Geist gives the body a neutral, modern grotesque grounding that reads well at 17px and pairs with the serif without competing. The two families speak two roles, not two voices.

### Hierarchy

- **Display** (Source Serif 4, weight 600, `clamp(2.75rem, 7vw, 5rem)`, line-height 0.95, `letter-spacing: -0.02em`): hero H1 only. Used as a 2-3-line stacked block where the italic accent word (`automatiser.`) carries the oral voice.
- **Headline** (Source Serif 4, weight 500, `clamp(1.5rem, 3vw, 2rem)`, line-height 1.2): section H2s. Roman cut, no italic. Replaces the current `text-3xl font-bold` sans treatment.
- **Title** (Geist, weight 600, 1.125rem, line-height 1.35): article card titles, related-content titles. Sans, not serif — keeps card grids breathable.
- **Body** (Geist, weight 400, 1.0625rem, line-height 1.6): paragraph copy. Max line length 65–75ch; on hero copy use `max-width: 560px`. Article body inherits.
- **Label** (Geist, weight 500, 0.8125rem, `letter-spacing: 0.01em`): metadata, eyebrows (in their new form), pill text. Sentence case, never UPPERCASE. The `letter-spacing: 0.01em` is enough to feel intentional without pulling toward editorial-magazine `0.2em` tracking.
- **Mono** (JetBrains Mono, weight 400, 0.9375rem, line-height 1.55): inline code in articles, code blocks. Nowhere else.

### Named Rules

**The Italic Voice Rule.** The italic cut of the display serif carries the soft, oral, Caribbean-voice half of the brand. The roman cut carries the technical half. Reach for italic only when the word *is* the voice (e.g. `automatiser.`). Italic in body, italic in labels, italic in nav: all forbidden.

**The Mono Restraint Rule.** Monospace is reserved for actual code inside articles and for explicit terminal mockups. Mono in eyebrows, dates, tags, metadata, navigation, body copy, headings: forbidden. It signals "DevOps costume", not credibility.

**The Sentence-Case Rule.** Eyebrows, labels, button text, navigation: sentence case (`Articles récents`), never UPPERCASE, never `Title Case`. The `letter-spacing: 0.2em` uppercase tracking of the editorial-magazine reflex is forbidden.

**The 65ch Rule.** Body line length never exceeds 75ch and rarely drops below 60ch. The hero description uses `max-width: 560px` — about 67ch at 17px Geist. PostLayout uses the same constraint via Tailwind Typography's `max-w-prose`.

------

## 4. Elevation

The system is **flat by default**. Depth is conveyed by warm/cool color tension (warm sand surface against cool ink text, or against a deep teal block), not by shadows. The page reads three-dimensionally because the two color families have different temperatures, not because anything is lifted.

Shadows exist for **focus states only**, never for hover, never as ambient decoration. Hover treatments use color or border shifts, not lift.

### Shadow Vocabulary

- **focus-ring** (`box-shadow: 0 0 0 3px oklch(38% 0.10 220 / 0.35)`): the only ambient-shadow-like token in the system. Applied on `:focus-visible` of every interactive element. Replaces the current `focus-visible:ring-2` mixture and unifies it on the brand teal.

That's it. No `shadow-sm`, no `shadow-lg`, no `shadow-2xl`. The `hover:shadow-lg` lift pattern currently used on cards is removed in the new system.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. There is no ambient elevation in the system. Shadows appear only as a focus signal, never as visual hierarchy.

**The No-Lift Hover Rule.** Hover transforms must change at most one property: color, or border, or background. Stacking `translateY(-4px) + shadow-lg + scale(1.05)` is forbidden. One property, one transition.

------

## 5. Components

### Buttons

Three variants, no more. All share the same shape (`rounded.md` = 8px), padding (`12px 24px`), and Geist body type at weight 600. They differ only in color.

- **Shape:** 8px corner radius (`rounded.md`). Never `rounded-full` for buttons (that's pill territory).
- **Primary (`button-primary`):** background `teal-ocean`, text `sable-creme`. Hover: background shifts to `teal-ocean-deep`. The hero's "Me contacter" CTA, the article-list "Voir tous les articles".
- **Outline (`button-outline`):** transparent background, 1px border in `teal-ocean`, text `teal-ocean`. Hover: background fills with `coquille`. Secondary CTAs ("Voir le CV", "Voir toutes les formations").
- **Coral (`button-coral`):** background `corail-soleil`, text `encre-ocean`. Reserved for the rare one-shot CTA where the brand teal would not be enough — typically a single "Disponible" call-to-action on the contact page. Subject to The 5% Coral Rule.

Focus: every button shows the `focus-ring` shadow.

### Section Eyebrow (replaces the filet+caps pattern)

The current `SectionEyebrow.astro` uses a 40px horizontal rule + uppercase 0.2em tracking — the second-order editorial-magazine reflex. The new eyebrow is **plain text**, sentence-case, in `teal-ocean`, set in the `label` role. No rule. No uppercase. No tracking-wider.

```
Articles récents
Quels sont mes derniers articles DevOps ?
```

Becomes:

```
Articles récents          ← label, teal-ocean, sentence-case
Ce que j'écris en ce moment  ← headline, encre-ocean
```

### Article Card

- **Shape:** `rounded.lg` (12px). Surface `sable-creme`. Border `border-sable`. No internal shadow at rest.
- **Image:** 16:9 ratio (replacing the current `aspect-[3/1]`). Cover image when available, otherwise a flat block of `coquille` — never a colored placeholder using the brand teal (overuse breaks The 30-60 Teal Rule).
- **Title:** `title` role (Geist 600, 1.125rem).
- **Body:** `body` role muted (Geist 400, 1.0625rem, color `encre-ocean-muted`).
- **Read more:** inline link in `teal-ocean`, no separate CTA button.
- **Hover:** **border shifts to `teal-ocean` only.** No translateY, no scale, no shadow. One property.
- **Focus:** the link inside the card carries the `focus-ring`.

### Article List (alternative to grid, used on homepage)

Where the homepage currently shows a 2×2 card grid for both Articles and Trainings, articles in the new system render as an **editorial list**: each row is title (headline role, large) + date + reading time + 2-line summary. Trainings stay as a card grid but distinct: compact horizontal strip of 3 items max, with platform logos. **Different visual treatments for different content types.**

### Availability Pill

- **Shape:** `rounded.pill` (9999px).
- **Background:** `coquille` (light) / `nuit-ocean-surface` (dark). **No more navy-on-emerald.**
- **Text:** `encre-ocean`, label role.
- **Dot:** 8px `available-emerald` circle, no glow, no box-shadow ring. The dot is the signal; the glow was costume.
- **Active state:** 1px border in `teal-ocean`.

### Navigation Bar

- **Background:** `sable-creme` with a 1px bottom border in `border-sable` (light) / `nuit-ocean` with 1px bottom in `nuit-ocean-border` (dark). The navy navbar is removed.
- **Brand text:** "Xavier GUERET", set in Source Serif 4 weight 500, color `encre-ocean`.
- **Link text:** Geist body, color `encre-ocean-muted`. Hover/active: color shifts to `encre-ocean`, with a 2px bottom border in `teal-ocean` on the active link (replaces `bg-white/15`).
- **Mobile:** menu opens as full-height drawer; same color logic, no extra navy.

### Hero Blockquote (replaces the side-stripe pattern)

The current `border-l-4 border-[var(--color-accent)] pl-5` blockquote is removed (side-stripe ban). The new treatment:

- The attribution ("Un jour, quelqu'un a dit") set in the `label` role above the quote, `encre-ocean-muted`.
- The quote itself set in display role italic, 1.5rem, color `encre-ocean`, no border, no left padding, just a 24px indent on the left.
- The closing source line set in body role, no quote marks needed at this scale.

### Named Rules

**The No Side-Stripe Rule.** `border-left` or `border-right` greater than 1px as a colored accent is forbidden on every component: cards, list items, callouts, alerts, blockquotes. Use full 1px borders, background tints, leading numerals, or nothing.

**The One-Hover Rule.** Hover on any component transitions exactly one property: color, border, or background. Never `translateY` + `shadow` + `scale`.

**The Sentence-Case Buttons Rule.** Button labels are sentence-case ("Me contacter", "Voir tous les articles"), never UPPERCASE, never `Title Case`.

------

## 6. Do's and Don'ts

### Do

- **Do** use OKLCH for every color token. Hex codes in component CSS are an implementation artifact; the source of truth is OKLCH.
- **Do** put `teal-ocean` on 30–60% of every fold (navbar + one block, hero band, primary CTA + section anchor — pick combinations).
- **Do** keep `corail-soleil` to one element per fold maximum.
- **Do** tint warm neutrals to `hue 65` and cool neutrals to `hue 220`. Never both to the same hue.
- **Do** pair Source Serif 4 (display) with Geist (body). Italic of the display cut for one accent word at a time.
- **Do** size body type at 1.0625rem with `line-height: 1.6` and `max-width` clamped near 65ch.
- **Do** set buttons, eyebrows, labels, and nav links in sentence case.
- **Do** make hovers shift exactly one property — color OR border OR background.
- **Do** redesign dark mode as its own scene ("the night ocean"), not a hue-inverted derivative.
- **Do** use the `focus-ring` token (3px teal halo) on every interactive element.

### Don't

- **Don't** ship `#ffffff`, `#000000`, or `color: white;` in any production code. The `sable-creme` and `encre-ocean` tokens replace them.
- **Don't** use Plus Jakarta Sans, Inter, Outfit, DM Sans, Space Grotesk, Instrument Sans, Fraunces, Newsreader, Cormorant, or any other family in the impeccable reflex-reject list. The current `@fontsource/plus-jakarta-sans` import is removed.
- **Don't** ship the navy + Facebook-blue palette (`#1e293b` + `#3b5998`). That combination is named anti-reference 2 in `PRODUCT.md`. Removed entirely from `global.css`.
- **Don't** use `border-left-4` or `border-right-4` (or any side-stripe ≥2px) as a colored accent. The current hero blockquote and PostLayout prose blockquote are rewritten.
- **Don't** use `background-clip: text` with a gradient (gradient text).
- **Don't** use `backdrop-blur` decoratively (glassmorphism).
- **Don't** stack hover effects: `translateY` + `shadow` + `scale` together is forbidden. One property per hover.
- **Don't** use `animate-bounce` or any bouncy/elastic easing. Motion uses `ease-out` exponential curves only (`cubic-bezier(0.22, 1, 0.36, 1)` or steeper).
- **Don't** UPPERCASE eyebrows with `tracking-[0.2em]` — that is the editorial-magazine second-order trap PRODUCT.md anti-reference 3 calls out.
- **Don't** put monospace on anything that isn't actual code or a terminal mockup. No mono nav, no mono eyebrows, no mono dates.
- **Don't** repeat the same card grid layout for two content types in a row (articles + trainings as identical `md:grid-cols-2 aspect-[3/1] rounded-xl` blocks). Differentiate visually.
- **Don't** invent a "Skills" section with progress bars or a "Years of experience" counter. Show, don't tell (PRODUCT.md Design Principle 5).
- **Don't** ship a Kubernetes wheel, Docker whale, or terminal-screenshot hero. DevOps credibility lives in article titles, not iconography (PRODUCT.md Design Principle 3).
- **Don't** drift toward editorial-magazine-on-recovery from corporate-navy (display serif + italic + drop caps + ruled columns). Both are anti-references; the dawn-palette is the third path.
