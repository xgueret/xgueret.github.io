---
title: "Pyébwa a Konesans: Guadeloupean tales in 3D, in Kréyòl and French"
date: "2026-11-20"
author: "Xavier GUERET"
description: "Part one of the 'Culture and AI' series: a Three.js tree of tales where each book opens its own world, page by page, in Kréyòl, French or both — and how AI agents built it without ever being trusted alone with the language."
tags:
  - "Three.js"
  - "TypeScript"
  - "Kréyòl"
  - "ai"
  - "claude-code"
  - "Open Source"
categories:
  - "Culture and AI"
  - "vibecoding"
  - "Personal Projects"
image: "/images/posts/contes_creole_pyebwa_a_konesans.png"
imageAlt: "The Pyébwa a Konesans tree of tales: a flamboyant tree on a hill, book cards hanging from its branches, the Konteur sitting at its foot with his lantern"
draft: false
toc: true
series: "Culture and AI"
seriesOrder: 1
---
*Episode 1 of the **"Culture and AI"** series — what AI can do for a culture and a language, and above all what it must not do in their place.*

## Yé krik! — Yé krak!

In Guadeloupe, a tale starts with a call and a response. The storyteller calls "Yé krik!", the audience answers "Yé krak!", and the story can begin. These tales travel by word of mouth first, and Guadeloupean **Kréyòl** travels with them.

I wanted a place where a child could find that ritual on a screen: hear the call, pick a story, read it in Creole, in French, or in both. Not a page of text with three pictures, but a world you step into.

The result is [Pyébwa a Konesans](https://contes-creoles.netlify.app/) — *the tree of knowledge*. The code is open, under the MIT license: [TiPunchLabs/contes-creole](https://github.com/TiPunchLabs/contes-creole).

---

## A tree, some books, some worlds

You arrive at the foot of a flamboyant tree on a hill. The title states the rules:

> **Chak fèy sé on kont.** — *Every leaf is a tale.*

You climb around the tree by scrolling (or swiping on a phone). Book cards hang from its branches; one click and the camera dives into the tale's world. `Esc` or the back button takes you back up to the tree.

At the foot of the trunk sits the **Konteur**, the storyteller, his lantern beside him. Hover over him: the lantern lights up and he calls "Yé krik!…". Click: he opens a random tale for you.

Two books are published today:

- **Ti Kannot é Gwo Rako** (*Larivyè-la té swèf*, theme *Dlo · L'eau*) — a tiny bird who knows how to listen, a huge crab who always wants more water, and a river running dry. Twelve pages, on a watercolour island.
- **Mila et le lambi qui avait perdu son chant** (*Mila and the conch that lost its song*) — a silent conch shell and a dive under the sea. Twelve pages too.

The top of the tree holds a third, empty card: *Le prochain conte — Histoire à inventer* (the next tale, still to be invented). More on that below.

---

## Three ways to read

Every tale reads in **Kréyòl**, **Français** or **Bileng**. In bilingual mode, the Kréyòl text shows with the French translation underneath. The language choice carries over from one book to the next during the session.

The first paragraph of Ti Kannot, in both languages:

> *On lè, adan on ti bouk ki té ant gwo pyébwa, flè wouj é montangn vè, té ni on bèl larivyè ki té ka travèsé bwa-la avan i té ka alé jwenn lanmè.*
>
> Il était une fois, dans un petit village entouré de grands arbres, de fleurs rouges et de collines vertes, une rivière qui traversait la forêt avant de rejoindre la mer.

(Once upon a time, in a small village among tall trees, red flowers and green hills, there was a river that ran through the forest before it reached the sea.)

On accessibility, the cards on the tree are not just 3D objects: each one has a keyboard entry point, the text card is announced to screen readers (`aria-live`), and if WebGL stays unavailable, a message explains what to do instead of a black screen. Under `prefers-reduced-motion`, Ti Kannot's camera cuts from shot to shot instead of gliding.

For the classroom, there is a **Scène seule** (scene only) option: it hides the text card and leaves the scenery, the page buttons and the language. The teacher tells the story, the pupils look at the world.

---

## Under the hood

### One universe per book

The site is strict **TypeScript**, built with **Vite**, and all the 3D goes through **Three.js** (r186), with no UI framework. The architecture boils down to one idea: **the tree and every book are isolated universes**.

```
src/
├── app/            # the shell: tree | dive | book | rise state machine,
│                   # book registry, Markdown parser, reading UI
├── shared/         # toolbox: seeded RNG, maths, Three.js helpers
├── tree/           # the tree universe: landscape, flamboyant, Konteur, cards
└── books/
    ├── ti-kannot/  # book.ts, story/{gcf,fr}.md, cover, staging, world/
    └── mila/       # book.ts, story/{gcf,fr}.md, cover, world/
```

A book is a folder with a `book.ts` manifest:

```typescript
export default defineBook({
  id: "ti-kannot",
  order: 1,
  ready: true,
  card: { title: "Ti Kannot é Gwo Rako", sub: "Larivyè-la té swèf", theme: "Dlo · L’eau" },
  cover: paintCover,
  world: () => import("./world/index"),
});
```

The registry discovers the folders, sorts them by `order`, and only loads a book's world when you dive into it. The isolation is not a convention: **ESLint** (`no-restricted-imports`) forbids a universe from importing anything but its own files, `@shared/*` and the shell's contract. Adding a tale means adding a folder, without touching the others.

Mila goes further: it is an **immersive** book that brings its own reading interface, its own soundscape and its own controls. The shell steps aside and keeps only the card on the tree, the dive, the way back and the language switch.

### Text stays text

The tales are not hard-coded into the scenes. Each language is a Markdown file, `story/gcf.md` (required) and `story/fr.md`, split into pages:

```markdown
---
lang: gcf
title: Ti Kannot é Gwo Rako
---

## Larivyè Klè {#ye-krik}
```

`gcf` is the language code for Guadeloupean Creole. Kréyòl is a tale's reference language, and French lines up with it page by page.

### Nothing is modelled by hand

There is no imported 3D model. The flamboyant, the palm trees, the island, the river and the sky are **generated in code**, with a seeded pseudo-random generator owned by each universe. Same seed, same build order: the same tree on every visit. The only pictures are the Konteur, a cut-out photo facing the camera, and the cover illustrations, cropped in a 2D canvas.

It is all tested with **Vitest** (54 test files), checked by GitHub Actions CI, and served as static files from **Netlify**, with no backend and no secrets.

---

## The language is not an implementation detail

This is the part of the project I'm happiest with, and the one where caution matters most. A language model will happily write "Creole". It will just as happily blend Guadeloupean with Martinican or Haitian, or turn a phrase into French without noticing.

So the repository has a language reference in `docs/kreyol/`: spelling (**GEREC** conventions), grammar notes, a project glossary, accepted and excluded variants, and a source hierarchy from A to E. Above all, it has a rules file for agents, `AGENT_RULES.md`, which they must read before touching a single sentence of Kréyòl. A few of the rules, as written:

- **never mix creoles**: a form attested in Martinican or Haitian Creole is not a valid correction in Guadeloupean;
- **never "fix" Kréyòl without a source**: a case the sources cannot settle goes into `variants.md`, flagged *À VALIDER PAR UN LOCUTEUR / RÉVISEUR CRÉOLOPHONE* (to be checked by a Creole speaker), and the text stays as it is;
- **never treat a regional variant as a mistake** (Grande-Terre, Basse-Terre, Marie-Galante, Les Saintes, La Désirade).

Language decisions stay human. The project's own name shows it: the tree was first called *Pyébwa a Sav*, the language audit flagged the meaning of *Sav* as uncertain, and an editorial decision renamed it *Pyébwa a Konesans*. Mila's Kréyòl is my working translation, and the repository says so plainly: its linguistic validation is still pending.

---

## Tales from the classroom

The third card on the tree, *Le prochain conte*, leads to a page of its own: [Les contes des classes](https://contes-creoles.netlify.app/contes-des-classes/) (tales from the classroom). It is an invitation to primary school teachers: their pupils imagine a story, in French, in Guadeloupean Creole or in both, and the project gives it a life in the Pyébwa a Konesans, with its own cover, characters and world.

The architecture is ready for it: a class tale is a book folder like any other. The page collects nothing itself; it points to a contact form.

---

## The role of vibecoding in this project

Pyébwa a Konesans was largely built through vibecoding with **Claude Code**, in a way that grew more structured week after week.

The starting point was a mockup made with **Claude Design**: a 2.1 MB self-contained export, with React and Babel loaded from a CDN and the whole Three.js scene in a single file. It served as the visual reference, then was ported to Vite + TypeScript, split into universes, and stripped of its CDN dependencies. The first big steps each got a written spec and plan before any code (`docs/superpowers/`).

Recent changes go through **missions**, run from **agent-workflow**, my control room for driving several AI agents across several projects at once (it will get its own article soon): a pilot Claude Code session frames the request, another one runs it on a dedicated branch, **Codex** reviews it (three reviews at most), and the mission ends with a report carrying a verdict and evidence: screenshots, frame-rate measurements, test results. For Mila's underwater atmosphere, for instance, the executor studied an open source project (Abyssal Garden, MIT license) cloned read-only, wrote down what it took from it, and measured performance before and after.

What the agents don't do: decide. Merging, going live, artistic sign-off and anything touching the language are mine. Of the 297 commits on the main branch, more than 240 carry a Claude model's signature, and none was merged without me. For a project this size (two full 3D worlds, an animated tree, three reading modes) in a little under two months, I could never have done it alone in my spare time.

---

## What's next

Two more books are already waiting in the repository, with their manifest but no world. They stay hidden until they are ready. The real next milestone is a tale written by a class.

The site is live at [contes-creoles.netlify.app](https://contes-creoles.netlify.app/) and the code is on [GitHub](https://github.com/TiPunchLabs/contes-creole). If you teach in Guadeloupe, or speak Creole and are willing to proofread some Kréyòl, you know where to knock.
