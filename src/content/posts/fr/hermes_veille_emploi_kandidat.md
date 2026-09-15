---
title: "Automatiser une veille emploi avec un agent IA auto-hébergé et MCP"
date: "2026-09-14"
author: "Xavier GUERET"
description: "Deuxième volet de la série « Hermes Agent » : brancher un agent IA sur un outil métier existant via son serveur MCP, écrire le brief d'une tâche planifiée, et ce qu'il faut prévoir pour qu'elle n'écrive pas n'importe quoi dans votre base."
tags:
  - "ia"
  - "MCP"
  - "automatisation"
  - "local-first"
  - "HomeLab"
  - "Telegram"
categories:
  - "Hermes Agent"
  - "Intelligence Artificielle"
  - "Projets Personnels"
  - "DevOps"
image: "/images/posts/hermes_veille_emploi_kandidat.png"
draft: false
toc: true
series: "Hermes Agent"
seriesOrder: 2
---
*Épisode 2 de la série **« Hermes Agent »**.*

Je voulais automatiser ma veille d'offres d'emploi : qu'elle s'exécute chaque lundi à 8 h, qu'elle filtre sur mes critères, et qu'elle enregistre ce qu'elle retient directement dans Kandidat, mon outil de suivi de candidatures.

Les deux briques nécessaires tournaient déjà sur mon homelab, chacune de son côté. Il restait à les relier, puis à écrire les règles.

## Ce qui tournait déjà des deux côtés

[Kandidat](/blog/kandidat/) est mon outil de suivi de candidatures : une API REST, une base, un tableau de bord, et les règles métier qui vont avec (statuts valides, catégories d'entreprises, lien entre une candidature et l'entreprise ciblée). En mars, je lui avais ajouté un serveur MCP exposant 23 outils typés, pour le piloter depuis Claude Code.

Hermes Agent, déployé en août sur sa propre VM, sait consommer MCP et planifier des tâches.

Si vous envisagez le même genre de montage, faites l'inventaire avant d'écrire du code. Un outil qui expose déjà une API propre et des règles métier explicites est à moitié intégré : ce qui reste, c'est une déclaration, pas un développement. Je n'ai écrit ni scraper ni script d'insertion.

## API brute ou MCP

L'agent a un terminal. Rien ne m'empêchait de lui donner l'URL de l'API et de le laisser construire ses requêtes.

|  | API brute | MCP |
|---|---|---|
| Requêtes | improvisées à partir de la prose | outils typés, paramètres contraints |
| Désactiver une opération | impossible | `hermes tools disable kandidat:delete_candidature` |
| Règles métier | à redire dans le prompt | restent dans Kandidat |
| Surface exposée | toute l'API | les outils que vous activez |

La ligne qui tranche est la deuxième. Avec MCP, retirer `delete_candidature` retire la capacité. Avec l'API brute, vous ne disposez que d'une consigne dans un prompt, et vous n'avez aucun levier une fois l'agent lancé.

## Brancher le serveur sur l'agent

Une commande, avec le nom du serveur, son URL et les outils à activer :

```bash
hermes mcp add kandidat --url https://kandidat-mcp.internal/mcp --connect-timeout 20
```

Sa sortie dit exactement ce qui a été écrit, et ce qui a été refusé :

```
Note: 7 managed setting(s) were not saved (managed by your administrator):
  dashboard.public_url, model.default, model.provider,
  providers.deepseek.base_url, providers.deepseek.default_model,
  providers.deepseek.key_env, providers.deepseek.name

✓ Saved 'kandidat' to config.yaml (23/23 tools enabled)
```

Les sept clés refusées sont celles qu'Ansible épingle dans mon montage : fournisseur d'inférence, secrets, URL du tableau de bord. La déclaration MCP n'en fait pas partie, elle appartient à l'agent. Elle survit donc à un playbook rejoué.

Vérifiez que la liaison répond avant d'écrire la moindre ligne de brief :

```bash
hermes mcp list
hermes mcp test kandidat
```

Un point à connaître : cette déclaration vit dans le volume de données de l'agent, hors du dépôt d'infrastructure. Prévoyez de la reposer si vous reconstruisez la VM.

## Écrire le brief

C'est là que le travail se concentre, pas dans la plomberie.

Une tâche planifiée s'exécute sans personne en face d'elle. L'agent ne peut pas demander une précision, et personne ne relit ses décisions pendant qu'il les prend. Si vous écrivez un brief de ce type, partez du principe que toute décision absente du texte sera prise au hasard.

Le mien tient en cinq familles de règles :

- **Un profil de référence qui fait autorité.** L'agent lit deux fichiers de son espace de travail, un CV condensé et un profil plus lucide que le CV. En cas de contradiction, le profil tranche.
- **Des familles de postes avec des bornes asymétriques.** Beaucoup d'années sur une technologie rendent une offre senior recevable ; peu d'années sur une autre impose d'écarter les offres qui en demandent davantage.
- **Une règle de localisation** qui accepte le présentiel sur une zone et exige le télétravail total ailleurs. « Même partiel ou occasionnel » y figure, parce que c'est la formulation que les annonces utilisent pour rester floues.
- **Un plafond de trois offres**, avec la consigne de n'en retenir aucune plutôt qu'une mauvaise. Sans ce plafond, l'agent optimise pour avoir trouvé quelque chose.
- **La déduplication avant écriture.** L'agent cherche l'entreprise parmi celles déjà enregistrées, en ignorant la casse, les accents et les suffixes juridiques, puis cherche le poste parmi les candidatures existantes. Si l'entreprise existe, il réutilise son identifiant.

Si vous branchez un agent sur une base que vous tenez à jour, écrivez cette dernière règle en premier. Les accents et les suffixes juridiques y figurent explicitement parce que sans eux, la même entreprise s'enregistre deux fois sous deux graphies. Une automatisation qui écrit dans une base doit d'abord savoir ne pas écrire.

## Le déclenchement et le compte rendu

La tâche part tous les lundis à 8 h. Le compte rendu arrive sur Telegram :

> Veille du 8 septembre : 2 offre(s) enregistrée(s) dans kandidat — à consulter.
> • Entreprise X (esn) — Ingénieur DevOps — full remote — [A] — priorité haute
> • Entreprise Y (entreprises) — Développeur Java/Spring — sur site — [C] — priorité moyenne

Les offres sont déjà dans Kandidat quand je lis le message : entreprise créée si elle n'existait pas, lien vers l'annonce, famille de poste retenue, et trois à cinq lignes de justification avec les réserves. Le message est une notification, pas le résultat.

Prévoyez un format pour les semaines sans résultat. Le mien affiche « aucune offre correspondante cette semaine », plus une ligne sur ce qui a bloqué si des candidates passaient près. Sans ce message, une semaine vide ressemble à une tâche en panne.

Prévoyez également le cas d'échec. Mon brief impose de nommer l'étape et l'offre concernées si un outil ne répond pas, et interdit d'annoncer un enregistrement non confirmé.

## État des lieux

La veille tourne depuis trois semaines. Chaque lundi matin, je lis le compte rendu sur Telegram, j'ouvre Kandidat, et je tranche sur les offres retenues. C'est devenu le seul moment de la semaine où je m'occupe de la veille, et il a lieu même les semaines où je n'y aurais pas pensé.

C'est la première tâche que l'agent exécute sans que je la lance, et son résultat atterrit dans un outil que j'utilisais déjà. Les données de Kandidat restent à jour sans saisie, donc ses statistiques portent sur le flux réel.

Ce qui reste ouvert :

- L'agent n'agit pas vers l'extérieur. Il lit, filtre et enregistre. C'est volontaire et je ne compte pas l'étendre.
- Il se trompe encore. Il lui arrive de retenir une annonce dont la mention « télétravail » couvrait deux jours sur site. J'archive la ligne, ça prend deux minutes.
- L'API de Kandidat n'a aucune authentification, et le serveur MCP n'en ajoute pas : c'est un traducteur, pas une passerelle d'accès. Acceptable sur un réseau domestique fermé, nulle part ailleurs. MCP borne ce que l'agent peut faire, pas ce que le réseau peut faire.
- La déclaration MCP se perd à un rebuild de la VM.

Le brief et les rôles Ansible ont été écrits avec Claude Code, comme le reste du homelab. Les règles de filtrage viennent de moi.

Prochain épisode : le câblage entre les deux machines, et les trois pannes silencieuses rencontrées en chemin.
