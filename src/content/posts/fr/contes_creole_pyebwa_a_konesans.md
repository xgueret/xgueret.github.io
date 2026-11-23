---
title: "Pyébwa a Konesans : des contes guadeloupéens en 3D, en kréyòl et en français"
date: "2026-11-20"
author: "Xavier GUERET"
description: "Premier volet de la série « Culture et IA » : un arbre de contes en Three.js où chaque livre ouvre son propre monde, page par page, en kréyòl, en français ou en bilingue — et comment des agents IA l'ont construit sans jamais toucher seuls à la langue."
tags:
  - "Three.js"
  - "TypeScript"
  - "Kréyòl"
  - "ia"
  - "claude-code"
  - "Open Source"
categories:
  - "Culture et IA"
  - "vibecoding"
  - "Projets Personnels"
image: "/images/posts/contes_creole_pyebwa_a_konesans.png"
imageAlt: "L'arbre de contes Pyébwa a Konesans : un flamboyant sur un morne, des cartes-livres suspendues à ses branches, le Konteur assis à son pied avec sa lanterne"
draft: false
toc: true
series: "Culture et IA"
seriesOrder: 1
---
*Épisode 1 de la série **« Culture et IA »** — ce que l'IA peut faire pour une culture et une langue, et surtout ce qu'elle ne doit pas faire à leur place.*

## Yé krik ! — Yé krak !

En Guadeloupe, un conte commence par un appel et une réponse. Le conteur lance « Yé krik ! », l'assistance répond « Yé krak ! », et l'histoire peut démarrer. Ces contes se transmettent d'abord à l'oral, et le **kréyòl** guadeloupéen avec eux.

Je voulais un endroit où un enfant puisse retrouver ce rituel sur un écran : entendre l'appel, choisir une histoire, la lire en créole, en français ou dans les deux. Pas une page de texte avec trois illustrations, mais un monde dans lequel on entre.

Le résultat, c'est [Pyébwa a Konesans](https://contes-creoles.netlify.app/) — *l'arbre des connaissances*. Le code est ouvert, sous licence MIT : [TiPunchLabs/contes-creole](https://github.com/TiPunchLabs/contes-creole).

---

## Un arbre, des livres, des mondes

On arrive au pied d'un flamboyant planté sur un morne. Le titre annonce la règle du jeu :

> **Chak fèy sé on kont.** — *Chaque feuille est un conte.*

On tourne autour de l'arbre en faisant défiler la page. Sur smartphone, on fait tourner la scène en glissant le doigt de droite à gauche ou de gauche à droite, et le même geste tourne les pages d'un conte. Des cartes-livres pendent aux branches ; un clic, et la caméra plonge dans le monde du conte. `Échap` ou le bouton retour, et on revient à l'arbre.

Au pied du tronc est assis le **Konteur**, sa lanterne posée à côté de lui. Survolez-le : la lanterne s'allume et il lance « Yé krik !… ». Cliquez : il vous ouvre un conte au hasard.

Aujourd'hui, deux livres sont publiés :

- **Ti Kannot é Gwo Rako** (*Larivyè-la té swèf*, thème *Dlo · L'eau*) — un tout petit oiseau qui sait écouter, un énorme crabe qui veut toujours plus d'eau, et une rivière qui s'assèche. Douze pages, sur une île peinte à l'aquarelle.
- **Mila et le lambi qui avait perdu son chant** (*Un soir, au bord de la mer*) — un lambi resté muet, et une plongée sous la mer. Douze pages elles aussi.

Le haut de l'arbre est réservé à une troisième carte, vide : *Le prochain conte — Histoire à inventer*. J'y reviens plus bas.

---

## Trois façons de lire

Chaque conte se lit en **Kréyòl**, en **Français** ou en **Bileng**. En mode bilingue, le texte kréyòl s'affiche avec la traduction française en dessous. Le choix de langue est conservé d'un livre à l'autre pendant la session.

Le premier paragraphe de Ti Kannot, dans les deux langues :

> *On lè, adan on ti bouk ki té ant gwo pyébwa, flè wouj é montangn vè, té ni on bèl larivyè ki té ka travèsé bwa-la avan i té ka alé jwenn lanmè.*
>
> Il était une fois, dans un petit village entouré de grands arbres, de fleurs rouges et de collines vertes, une rivière qui traversait la forêt avant de rejoindre la mer.

Côté accessibilité, les cartes de l'arbre ne sont pas que des objets 3D : chacune a un point d'entrée accessible au clavier, la carte de texte est annoncée aux lecteurs d'écran (`aria-live`), et si WebGL reste indisponible, un message explique quoi faire au lieu d'un écran noir. Sous `prefers-reduced-motion`, la caméra de Ti Kannot coupe d'un plan à l'autre au lieu de glisser.

Pour la classe, il existe une option **Scène seule** : elle masque la carte de texte et ne laisse que le décor, les boutons de page et la langue. L'enseignant raconte, les élèves regardent le monde.

---

## Sous le capot

### Un univers par livre

Le site est en **TypeScript** strict, construit avec **Vite**, et toute la 3D passe par **Three.js** (r186), sans framework d'interface. L'architecture tient en une idée : **l'arbre et chaque livre sont des univers isolés**.

```
src/
├── app/            # le shell : machine à états tree | dive | book | rise,
│                   # registre des livres, parseur Markdown, interface de lecture
├── shared/         # boîte à outils : RNG à graine, maths, helpers Three.js
├── tree/           # l'univers de l'arbre : paysage, flamboyant, Konteur, cartes
└── books/
    ├── ti-kannot/  # book.ts, story/{gcf,fr}.md, cover, staging, world/
    └── mila/       # book.ts, story/{gcf,fr}.md, cover, world/
```

Un livre, c'est un dossier avec un manifeste `book.ts` :

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

Le registre découvre les dossiers, les trie par `order` et ne charge le monde d'un livre qu'au moment où on y plonge. L'isolation n'est pas une convention : **ESLint** (`no-restricted-imports`) interdit à un univers d'importer autre chose que ses propres fichiers, `@shared/*` et le contrat du shell. Ajouter un conte, c'est ajouter un dossier, sans toucher aux autres.

Mila va plus loin : c'est un livre **immersif**, qui apporte sa propre interface de lecture, son ambiance sonore et ses contrôles. Le shell lui laisse la main et ne garde que la carte dans l'arbre, la plongée, le retour et le sélecteur de langue.

### Le texte reste du texte

Les contes ne sont pas codés en dur dans les scènes. Chaque langue est un fichier Markdown, `story/gcf.md` (obligatoire) et `story/fr.md`, découpé en pages :

```markdown
---
lang: gcf
title: Ti Kannot é Gwo Rako
---

## Larivyè Klè {#ye-krik}
```

Le mot-clé `gcf` est le code du créole guadeloupéen. Le kréyòl est la langue de référence d'un conte, et le français vient s'y aligner page par page.

### Rien n'est modélisé à la main

Il n'y a aucun modèle 3D importé. Le flamboyant, les palmiers, l'île, la rivière et le ciel sont **générés par le code**, avec un générateur pseudo-aléatoire à graine propre à chaque univers. Même graine, même ordre de construction : le même arbre à chaque visite. Les seules images sont le Konteur, une photo détourée affichée face à la caméra, et les illustrations des couvertures, recadrées dans un canvas 2D.

Le tout est testé par **Vitest** (55 fichiers de tests au 22 novembre 2026), vérifié par la CI GitHub Actions et publié en statique sur **Netlify**, sans backend ni secret.

---

## La langue n'est pas un détail d'implémentation

C'est la partie du projet dont je suis le plus content, et celle où la prudence compte le plus. Un modèle de langage écrit volontiers « du créole ». Il mélange aussi volontiers le guadeloupéen avec le martiniquais ou l'haïtien, ou francise une tournure sans s'en rendre compte.

Le dépôt a donc un référentiel linguistique, dans `docs/kreyol/` : orthographe (conventions du **GEREC**), notes de grammaire, glossaire du projet, variantes acceptées et exclues, hiérarchie des sources de A à E. Et surtout un fichier de règles pour les agents, `AGENT_RULES.md`, qu'ils doivent lire avant de toucher la moindre phrase en kréyòl. Quelques règles, telles qu'écrites :

- ne **jamais mélanger les créoles** : une forme attestée en martiniquais ou en haïtien n'est pas une correction valable en guadeloupéen ;
- ne **jamais « corriger » le kréyòl sans source** : un cas que les sources ne tranchent pas va dans `variants.md`, marqué *À VALIDER PAR UN LOCUTEUR / RÉVISEUR CRÉOLOPHONE*, et le texte ne bouge pas ;
- ne **jamais traiter une variante régionale comme une faute** (Grande-Terre, Basse-Terre, Marie-Galante, Les Saintes, La Désirade).

Les décisions de langue restent humaines. Le nom même du projet en témoigne : *Pyébwa a Konesans* a été fixé par une décision éditoriale, après un audit linguistique, et non par un agent. Le kréyòl de Mila est ma traduction de travail, et le dépôt le dit tel quel : sa validation linguistique est en attente.

---

## Les contes des classes

La troisième carte de l'arbre, *Le prochain conte*, mène à une page à part : [Les contes des classes](https://contes-creoles.netlify.app/contes-des-classes/). C'est une invitation aux enseignants du primaire :

> Vos élèves imaginent une histoire, en français, en créole guadeloupéen ou dans les deux langues. Contes Créoles peut lui donner vie dans le Pyébwa a Konesans, avec sa propre couverture, ses personnages et son univers.

L'architecture est prête pour ça : un conte de classe est un dossier de livre comme les autres. La page ne collecte rien elle-même, elle renvoie vers un formulaire de contact.

---

## Le rôle du vibecoding dans ce projet

Pyébwa a Konesans a été construit en grande partie en vibecoding avec **Claude Code**, et de manière de plus en plus structurée au fil des semaines.

Le point de départ est une maquette faite avec **Claude Design** : un export autonome de 2,1 Mo, avec React et Babel chargés depuis un CDN et toute la scène Three.js dans un seul fichier. Elle a servi de référence visuelle, puis a été portée en Vite + TypeScript, découpée en univers, débarrassée de ses dépendances CDN. Les premières grandes étapes ont chacune une spécification et un plan écrits avant le code (`docs/superpowers/`).

Les évolutions récentes passent par des **missions**, orchestrées par **agent-workflow**, mon poste de pilotage pour faire travailler plusieurs agents IA sur plusieurs projets à la fois (il aura bientôt son propre article) : une session Claude Code pilote cadre la demande, une autre l'exécute sur une branche dédiée, **Codex** la relit (trois revues au maximum), et la mission se termine sur un rapport avec un verdict et des preuves : captures, mesures de fréquence d'images, résultats de tests. Pour l'ambiance sous-marine de Mila, par exemple, l'exécutant a étudié un projet open source ([Abyssal Garden](https://github.com/Noniv/abyssal-garden), licence MIT) cloné en lecture seule, documenté ce qu'il en retenait, et mesuré l'impact sur les performances avant et après.

Ce que les agents ne font pas : décider. Le merge, la mise en production, l'acceptation artistique et tout ce qui touche à la langue me reviennent. Au 22 novembre 2026, la branche principale compte 310 commits ; plus de 250 portent la signature d'un modèle Claude, et aucun n'a été fusionné sans moi. Pour un projet de cette taille (deux mondes 3D complets, un arbre animé, trois modes de lecture) en un peu moins de deux mois, je n'aurais jamais pu le faire seul sur mon temps libre.

---

## Et la suite

Deux autres livres attendent déjà dans le dépôt, avec leur manifeste mais sans monde. Ils ne sont pas affichés tant qu'ils ne sont pas prêts. Le vrai prochain jalon, c'est un conte écrit par une classe.

Le site est en ligne sur [contes-creoles.netlify.app](https://contes-creoles.netlify.app/) et le code sur [GitHub](https://github.com/TiPunchLabs/contes-creole). Si vous êtes enseignant en Guadeloupe, ou créolophone et prêt à relire du kréyòl, vous savez où frapper.
