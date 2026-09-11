# Plates cap and projects page — design spec

> **Date**: 2026-09-10
> **Branch**: `refonte` (follows the monochrome redesign, spec of 2026-09-09)
> **Status**: approved in chat ("goahead")

------

## 1. Goal

Make the number of 3D plates drawn on the home page a single constant, chosen at random among the featured projects at runtime, with the section height and camera travel derived from it; and give every project a home again on a `/projects/` page (FR) and `/en/projects/` (EN) styled like the blog listing, linked from the projects section.

## 2. Decisions

| # | Decision |
|---|---|
| 1 | `MAX_PLATES` lives in `src/lib/plates.ts` (importable by both Astro components and the client script). It ships at **6**: with six featured projects the home renders exactly as today. Lowering it is a one-line change. |
| 2 | Selection is random **at runtime** among the `featured` entries, taken in their featured order (plate 01..N numbering follows the selection, not the pool). When `MAX_PLATES >= pool size` the pool is used unchanged, so no randomness is visible at 6. |
| 3 | `#tp-work` height and the camera travel derive from the plate count: height `40 + 50 × count` vh (340 vh at 6, as the mockup), travel `CAMERA_START_Z − (CARD_FIRST_Z − (count − 1) × CARD_GAP_Z) + 1.5` (58 at 6, as the mockup). |
| 4 | The hidden accessibility grid (`#tp-projects`) keeps listing the whole featured pool; the fallback and no-JS paths show all of it. |
| 5 | The projects section gets a "Voir tous les projets ↗" link in the HUD's top-right column, under "Défiler ↓", with `pointer-events:auto`. |
| 6 | `/projects/` and `/en/projects/` list every entry of the `projects` collection, grouped Open source / Site web, ordered by `order` then title, each row: index, title (link ↗ to `github ?? url`), description, tag chips. Same shell, header and typography as the blog listing (`.tp-label`, `.tp-h2`, `[data-split]`, `.tp-link`). |
| 7 | The `/projects` → `/#tp-work` redirects (both locales) are removed since the pages exist again. `llms.txt` lists the two pages; `CLAUDE.md` describes the constant. |

## 3. Out of scope

Motifs for the four non-featured projects (they never become plates), search/filter on the projects page, a projects category in the nav (the "Projets" anchor keeps pointing at `#tp-work`).

## 4. Verification

`astro check`, build, the three check scripts; the mobile frame-time script (`scratchpad/mobile-frames.cjs`) unchanged at 6 plates; a temporary build with `MAX_PLATES = 3` showing three plates, HUD `/03`, a shorter section and the camera stopping past the last plate; `/projects/` and `/en/projects/` render ten entries, language switcher round-trips, the HUD link resolves, one `h1`, no horizontal overflow at 360 px.
