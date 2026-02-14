---
title: "ckad-dojo : un simulateur d'examen CKAD en local"
date: "2026-02-13"
author: "Xavier GUERET"
description: "9 dojos, 178 questions, scoring automatique et interface web — comment j'ai construit un simulateur d'examen CKAD pour s'entraîner dans des conditions réalistes."
tags:
  - "Kubernetes"
  - "CKAD"
  - "Python"
  - "Bash"
  - "Open Source"
categories:
  - "github"
image: "/images/posts/ckad-dojo.png"
---
## Le problème de départ

Quand j'ai commencé à préparer la certification CKAD, j'ai vite constaté un manque : il n'y avait pas vraiment de simulateur local qui reproduise les conditions de l'examen. Les plateformes en ligne sont souvent payantes, limitées dans le temps, et surtout on ne peut pas les relancer à volonté pour retravailler ses points faibles.

Ce que je voulais, c'était un outil que je pouvais lancer sur mon cluster local, avec un vrai timer de 2 heures, des questions qui mettent en place leur propre environnement Kubernetes, et un scoring automatique pour savoir exactement où j'en suis. Alors je l'ai construit.

## Ce qu'est ckad-dojo

[ckad-dojo](https://github.com/TiPunchLabs/ckad-dojo) est un simulateur d'examen CKAD qui tourne entièrement en local. On lance une commande, ça déploie l'environnement Kubernetes nécessaire (namespaces, ressources, releases Helm), ça ouvre une interface web avec un timer de 120 minutes et un terminal intégré, et à la fin on peut scorer ses réponses avec plus de 400 critères évalués automatiquement.

L'idée de base est simple : reproduire au maximum l'expérience de l'examen réel — questions à gauche, terminal à droite, countdown qui tourne.

## Les 9 dojos

Le contenu est organisé en 9 "dojos", chacun inspiré de créatures de la mythologie japonaise. Chaque dojo est un examen complet et indépendant avec son propre thème de nommage pour les ressources Kubernetes.

Les trois premiers sont les gardiens célestes (Shishin) :

- **Suzaku** (Phénix Vermillon) — 21 questions, thème constellations
- **Byakko** (Tigre Blanc) — 20 questions, thème mythologie grecque
- **Genbu** (Tortue Noire) — 20 questions, thème mythologie nordique

Les six suivants sont des créatures du folklore japonais :

- **Kappa** — 17 questions, thème rivières et eau
- **Kirin** — 20 questions, thème océan
- **Tengu** — 20 questions, thème montagne
- **Tanuki** — 20 questions, thème forêt
- **Inari** — 20 questions, thème moissons
- **Ryujin** — 20 questions, thème mer et profondeurs

Au total : 178 questions qui couvrent l'ensemble du programme CKAD — pods, deployments, jobs, Helm, probes, services, storage, ConfigMaps, NetworkPolicies, sidecars, init containers, et plus.

## Intégration de contributions externes

Un point important du projet : tous les dojos n'ont pas été écrits de zéro. Certains s'appuient sur le travail d'autres membres de la communauté Kubernetes, et c'est assumé et crédité.

Le **Dojo Kappa** (simulation 4) est adapté du dépôt [CKAD-Practice-Questions](https://github.com/aravind4799/CKAD-Practice-Questions) de [@aravind4799](https://github.com/aravind4799). Ses questions avaient une approche pragmatique que j'ai trouvée complémentaire à mes propres exercices.

Les **Dojos Tengu, Tanuki, Inari et Ryujin** (simulations 6 à 9) sont adaptés du dépôt [CKAD-exercises](https://github.com/dgkanatsios/CKAD-exercises) de [@dgkanatsios](https://github.com/dgkanatsios), un classique bien connu de la communauté CKAD. Son travail couvrait des pans entiers du programme que j'avais envie d'intégrer plutôt que de réinventer.

Dans les deux cas, l'intégration ne s'est pas limitée à un copier-coller. Chaque question a été adaptée au format ckad-dojo : reformatée en Markdown, dotée de scripts de scoring automatique avec des critères de validation précis, équipée de manifestes de setup pour créer l'environnement nécessaire, et renommée selon le thème du dojo. C'est un vrai travail d'adaptation, mais la matière première vient bien de ces contributeurs et c'est important de le reconnaître.

## Comment ça marche

### Lancer un examen

```bash
# Via la CLI Python (recommandé)
uv run ckad-dojo

# Ou directement en Bash
./scripts/ckad-exam.sh
```

Ça ouvre l'interface web sur `http://localhost:9090`. Le layout est en deux panneaux : les questions à gauche, un terminal intégré (via ttyd) à droite. Le timer démarre, et c'est parti.

### Le scoring

À tout moment, on peut évaluer ses réponses :

```bash
uv run ckad-dojo score -e ckad-simulation1
```

Le scoring vérifie chaque critère : est-ce que le pod existe, dans le bon namespace, avec les bons labels, la bonne image, les bonnes probes ? Chaque question a entre 1 et 10 critères, et on obtient un score détaillé avec le pourcentage et le verdict pass/fail (seuil à 66%, comme le vrai examen).

### L'interface web

Le timer change de couleur en fonction du temps restant :

- Normal au-dessus de 15 minutes
- Jaune à 15 minutes
- Orange à 5 minutes
- Rouge à 1 minute

On peut naviguer entre les questions, les marquer pour relecture (touche F), et passer de l'une à l'autre avec les flèches du clavier.

## L'outillage

Le projet utilise une CLI Python unifiée (`ckad_dojo.py`) construite avec `argparse` et gérée par `uv`. Elle orchestre les scripts Bash qui font le travail réel (setup, scoring, cleanup). L'interface web est en vanilla JS avec un serveur Python standard library — pas de framework, pas de dépendance externe.

Côté qualité de code : pre-commit avec `shellcheck`, `shfmt`, `flake8`, `yamllint`, `markdownlint`, et `gitleaks` pour la détection de secrets. Le projet inclut aussi des tests unitaires pour les fonctions Bash partagées.

## Licence et philosophie

Le projet est sous licence **CC BY-NC-SA 4.0** — libre pour un usage personnel et éducatif, avec obligation de créditer et de partager sous la même licence. Le choix de cette licence plutôt que MIT reflète la nature éducative du contenu : les questions et solutions ont une vraie valeur pédagogique, et l'idée est qu'elles restent accessibles à tous sans être récupérées à des fins commerciales.

Le dépôt est sur [TiPunchLabs/ckad-dojo](https://github.com/TiPunchLabs/ckad-dojo) — les retours, signalements de bugs et contributions sont les bienvenus.
