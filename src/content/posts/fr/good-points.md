---
title: "Good Points : une PWA familiale pour encourager les bons comportements"
date: "2026-02-13"
author: "Xavier GUERET"
description: "Comment j'ai construit une application de bons points pour mes enfants avec React, Firebase et une approche PWA offline-first."
tags:
  - "React"
  - "TypeScript"
  - "Firebase"
  - "PWA"
  - "Tailwind CSS"
categories:
  - "Projets Personnels"
image: "/images/posts/goodpoints.png"
---

## D'où vient l'idée

À la maison, on avait un problème classique : les enfants oublient vite les règles, les parents ne sont pas toujours alignés sur les récompenses, et le tableau de bons points sur le frigo finit par ne plus être à jour au bout de trois jours.

On voulait quelque chose de simple : un système où les enfants voient leurs points en temps réel, où les deux parents peuvent ajouter ou consulter depuis leur téléphone, et où les récompenses sont claires et motivantes. J'ai cherché des apps existantes, mais rien ne collait vraiment à ce qu'on avait en tête. Alors j'en ai fait une.

Le résultat, c'est [Good Points](https://goodpoints.kemax.ovh/) — une PWA installable, offline-first, construite avec React et Firebase.

## L'approche éducative

Le cœur de l'app repose sur une idée simple : on valorise les bons comportements plutôt que de punir les mauvais. Pas de points négatifs, pas de retrait de récompenses. On encourage, on félicite, on récompense.

### Le contrat de comportement

C'est un point sur lequel on a pas mal réfléchi. Les "super actions" de l'app ne sont pas là pour apprendre de nouveaux comportements aux enfants — elles servent à renforcer des comportements qu'ils maîtrisent déjà mais qu'ils n'appliquent pas encore de manière régulière.

Par exemple, un enfant qui sait ranger sa chambre mais ne le fait que quand on insiste est un bon candidat pour une super action "Ranger sa chambre". En revanche, un enfant qui n'a jamais appris à le faire a d'abord besoin d'accompagnement avant qu'on mette ça dans un contrat.

L'app intègre un guide pour les parents qui explique comment bien formuler une super action : elle doit décrire ce que l'enfant **doit** faire (pas ce qu'il ne doit pas faire), être observable, et rester simple. "Parler calmement" plutôt que "Ne pas crier". On recommande aussi de limiter la durée d'un contrat à trois semaines — au-delà, soit le comportement est acquis et on peut le retirer, soit il faut revoir l'approche.

### Les super actions

Chaque enfant peut gagner des points en réalisant ses super actions au quotidien. Par défaut, il y en a six : écouter du premier coup, parler calmement, être gentil, accepter un non sans discuter, rester poli, ranger sa chambre. Les parents personnalisent la liste, les icônes et les valeurs selon ce qui a du sens pour leur famille.

Un point important : les super actions sont assignées par enfant. Chaque enfant n'a pas forcément les mêmes comportements à travailler, et c'est normal. L'aîné peut avoir "ranger sa chambre" pendant que le cadet travaille sur "accepter un non".

### Les défis à surmonter

Pour les comportements négatifs (crier, répondre, se moquer…), on n'utilise pas de points négatifs. À la place, il y a un système de seuil : en dessous de 10 occurrences par semaine, pas de pénalité. Au-dessus, les conséquences s'activent. Le compteur repart à zéro chaque lundi.

L'idée, c'est de laisser une marge — les enfants ne sont pas des robots — tout en posant une limite claire. Et quand un enfant reste sous le seuil, il débloque un bonus hebdomadaire. Ça transforme la gestion des comportements difficiles en défi positif plutôt qu'en menace.

### La boutique de récompenses

Les points accumulés se dépensent dans une boutique configurable : 30 minutes d'écran en plus, sortie au parc, petit jouet, soirée film en famille… Chaque récompense a son coût en points, et l'enfant voit ce qu'il peut s'offrir ou combien il lui manque.

C'est là que la dimension éducative est la plus concrète. Les enfants apprennent la patience (économiser pour une grosse récompense), la responsabilité (leurs actions ont des conséquences positives), et l'autonomie (ils choisissent leurs propres objectifs).

### Communiquer avec l'enfant

L'app n'est qu'un outil — le plus important reste la discussion en famille. Le guide intégré insiste sur le fait que les règles doivent être expliquées clairement à l'enfant, que les deux parents doivent être cohérents entre eux, et que le contrat se construit ensemble. L'enfant doit comprendre pourquoi un comportement est attendu, pas juste obéir pour avoir des points.

## La stack technique

Le choix de la stack a été guidé par le cas d'usage : une app familiale utilisée sur téléphone, par plusieurs personnes, potentiellement sans connexion.

- **React 18 + TypeScript** pour l'interface, avec 19 hooks custom qui séparent clairement les responsabilités (auth, famille, enfants, suivi hebdo, récompenses, achats, badges…)
- **Firebase** comme backend : Firestore pour la base de données temps réel, Authentication pour Google OAuth et email/password, et IndexedDB pour la persistance offline
- **Tailwind CSS** pour le styling, avec un système de thèmes dynamiques (6 thèmes visuels : Violet Magique, Bleu Océan, Orange Coucher de Soleil, Vert Nature, Rose Bonbon, Camp Nature)
- **Vite** pour le build, avec `vite-plugin-pwa` et Workbox pour le Service Worker
- **Framer Motion** pour les animations — confettis à l'achat d'une récompense, +1 flottant quand on ajoute un point, célébrations au déblocage de badges

L'app est installable sur iOS et Android, fonctionne hors ligne, et se synchronise en temps réel dès que la connexion revient.

## Multi-famille et sécurité

L'app n'est pas mono-utilisateur. Plusieurs familles peuvent l'utiliser, chacune isolée dans sa propre collection Firestore. Les règles Firebase garantissent qu'une famille ne peut jamais accéder aux données d'une autre.

L'onboarding se fait de deux manières :

- **Code d'invitation** : un code unique à 8 caractères généré par le super admin, qui donne un accès immédiat
- **Demande d'accès** : la famille fait une demande, le super admin approuve manuellement

Une fois la famille créée, le premier parent peut inviter le second via un lien unique. Limite : 2 parents et 5 enfants par famille.

Le mode parent donne accès à la configuration complète : gestion des enfants, des comportements, de leur assignation par enfant, des récompenses, des paramètres (thème, monnaie, horaires de boutique, PIN) et d'une FAQ intégrée. C'est un système basé sur la confiance — les enfants peuvent voir leur solde et la boutique, mais la configuration reste côté parent.

## La gamification

Au-delà des points et de la boutique, l'app embarque un système de badges pour maintenir la motivation sur la durée :

- **Semaine Parfaite** : 3 jours parfaits dans la semaine
- **Champion** : 5 jours parfaits
- **En Feu** : 3 semaines consécutives positives
- **Imbattable** : 5 semaines d'affilée
- **Ange Gardien** : une semaine sans aucune pénalité
- **Maître des Points** et **Légende** : paliers de points cumulés

Chaque badge débloqué donne un bonus automatique et déclenche une animation de célébration. Les enfants adorent.

## La personnalisation

Chaque famille peut adapter l'app à son fonctionnement :

- **48 avatars** avec une représentation diversifiée (différents genres et tons de peau)
- **Monnaie personnalisable** : nom et symbole au choix parmi 29 options (étoiles, médailles, diamants…)
- **Horaires de boutique** : possibilité de restreindre les heures où les enfants peuvent "acheter"
- **Comportements et récompenses** entièrement modifiables
- **FAQ séparées** pour le mode parent et le mode enfant, avec un ton adapté à chaque audience

## Le déploiement

L'app tourne en production sur Netlify avec déploiement automatique depuis GitHub. Pour le développement et les tests, j'utilise Docker avec trois profils :

- **dev** : Node 20 Alpine avec hot reload Vite
- **recette** : build Nginx pour tester sur ma VM Proxmox
- **prod** : build multi-stage, image finale d'environ 25 Mo

Un Makefile simplifie le tout : `make dev`, `make prod`, `make clean`.

## Le rôle du vibecoding dans ce projet

Good Points a été construit presque entièrement en vibecoding avec Claude Code. L'idée de départ et les choix d'architecture venaient de moi, mais la majorité du code — composants React, hooks custom, règles Firebase, logique de gamification, gestion du offline — a été générée par conversation en langage naturel. Je décrivais une fonctionnalité ("je veux un système de badges qui se débloquent automatiquement quand l'enfant atteint certains seuils"), Claude produisait le code, je testais, j'ajustais. Les 19 hooks custom, le système de thèmes, les animations Framer Motion : tout ça a été itéré en mode conversationnel. Ce qui aurait pris des semaines en développement classique a été bouclé en quelques jours. Le vibecoding n'a pas réduit l'exigence — il fallait toujours valider chaque fonctionnalité, débugger les cas limites, soigner l'UX — mais il a radicalement changé le rapport entre l'idée et sa réalisation.

## Ce que ça a changé

Au quotidien, l'impact est tangible. Les discussions autour des comportements sont moins conflictuelles parce que les règles sont claires, écrites, et les mêmes pour les deux parents. Les enfants ne demandent plus "c'est quand qu'on a une récompense ?" — ils ouvrent l'app et savent exactement où ils en sont.

Le plus intéressant, c'est ce qu'on n'avait pas anticipé : les enfants se motivent entre eux. Quand l'un débloque un badge, l'autre veut le même. Quand l'un économise pour la grosse récompense, l'autre comprend l'intérêt de ne pas tout dépenser tout de suite. Le système crée naturellement une dynamique positive dans la fratrie.

C'est aussi le genre de projet qui pousse à soigner les détails : l'offline doit vraiment marcher (pas juste en théorie), les animations doivent être fluides même sur un vieux téléphone, et l'interface doit être utilisable par un enfant de 6 ans.

L'app est en ligne sur [goodpoints.kemax.ovh](https://goodpoints.kemax.ovh/).
