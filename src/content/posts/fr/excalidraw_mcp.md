---
title: "Générer des diagrammes Excalidraw depuis Claude Code avec MCP"
date: "2026-02-14"
author: "Xavier GUERET"
description: "Installer et utiliser le serveur MCP excalidraw-render pour générer des diagrammes d'architecture directement depuis Claude Code, en PNG ou SVG."
tags:
  - "claude-code"
  - "MCP"
  - "Excalidraw"
  - "diagramme"
  - "automatisation"
  - "ia"
categories:
  - "Tutoriels"
  - "Intelligence Artificielle"
image: "/images/posts/excalidraw_mcp.png"
draft: false
---

Quand on utilise **Claude Code** au quotidien, il arrive un moment où les mots ne suffisent plus. On décrit un pipeline CI/CD, une architecture microservices, un cluster Kubernetes... et on finit toujours par ouvrir Excalidraw dans un autre onglet pour dessiner ce qu'on vient d'expliquer. J'ai cherché un moyen de court-circuiter cette étape : que Claude Code génère lui-même les diagrammes, directement dans le terminal.

C'est exactement ce que permet le serveur MCP **excalidraw-render**.

## Ce qu'on va mettre en place

On va connecter Claude Code à un serveur MCP qui lance un navigateur headless **Chromium** en arrière-plan. Quand on demande un diagramme, Claude Code construit un JSON d'éléments Excalidraw, l'envoie au serveur, et celui-ci produit un fichier PNG ou SVG sur le disque.

![Workflow excalidraw-render : Claude Code CLI → MCP → Chromium headless → fichier PNG/SVG](/images/posts/excalidraw_mcp_workflow.png)

L'analogie est simple : **excalidraw-render** agit comme un "imprimeur headless". Claude Code lui envoie une description JSON des formes, et le serveur utilise la vraie librairie `@excalidraw/excalidraw` pour produire un rendu fidèle. Tout reste en local — aucune donnée ne quitte votre machine.

## Quel serveur MCP choisir ?

Avant de foncer sur l'installation, un rapide tour d'horizon des options disponibles en février 2026 :

| Serveur | Approche | Cas d'usage | Rendu |
|---------|----------|-------------|-------|
| **excalidraw-render** (bassimeledath) | Headless Chromium, export PNG/SVG | **Claude Code CLI** — génération one-shot | Fichier sur disque |
| **excalidraw-mcp-app** (officiel) | MCP Apps (ui:// resources) | Claude Desktop, ChatGPT — rendu inline | Widget dans le chat |
| **mcp_excalidraw** (yctimlin) | Canvas live + WebSocket + 26 tools | CRUD itératif, collaboration temps réel | Canvas web live |
| **@cmd8/excalidraw-mcp** | Fichier `.excalidraw` local | Édition de fichiers existants | Fichier .excalidraw |

Pour un setup **Claude Code CLI**, **excalidraw-render** est le choix le plus adapté : léger, sans serveur canvas à maintenir, rendu direct en fichier.

## De quoi a-t-on besoin pour générer des diagrammes Excalidraw ?

- **Node.js ≥ 18** (vérifier avec `node -v`)
- **Claude Code CLI** installé et fonctionnel
- Chromium est installé automatiquement par **Playwright** au premier lancement

## Comment installer le serveur MCP Excalidraw ?

### Option 1 — npx (recommandé)

Une seule commande suffit :

```bash
claude mcp add --scope user --transport stdio excalidraw -- npx -y excalidraw-render
```

Le `--scope user` rend le serveur disponible dans tous vos projets Claude Code. Pas de dépendance locale à gérer, la version est toujours à jour.

### Option 2 — Installation locale

Si vous préférez épingler une version spécifique :

```bash
git clone https://github.com/bassimeledath/excalidraw-render.git
cd excalidraw-render
npm install
npm run build

# Enregistrer dans Claude Code
claude mcp add --scope user --transport stdio excalidraw -- \
  node /chemin/absolu/vers/excalidraw-render/dist/index.js
```

### Vérification

```bash
claude mcp list

# Résultat attendu :
# excalidraw: npx -y excalidraw-render (scope: user, transport: stdio)
```

## Les outils MCP exposés

Le serveur expose deux outils que Claude Code appelle automatiquement :

| Outil | Rôle | Invocation |
|-------|------|------------|
| `excalidraw_read_me` | Retourne la cheat sheet du format d'éléments Excalidraw | Automatiquement, avant le premier diagramme |
| `create_excalidraw_diagram` | Reçoit un JSON d'éléments + options, produit un PNG ou SVG | À chaque demande de diagramme |

### Paramètres de create_excalidraw_diagram

```json
{
  "elements": [],
  "format": "png",
  "output_path": "/tmp/mon-diagramme.png"
}
```

Le format accepte `"png"` ou `"svg"`. Le chemin de sortie peut être n'importe quel répertoire accessible en écriture.

### Le cycle de rendu

Voici ce qui se passe sous le capot à chaque demande :

1. Un navigateur headless Chromium est lancé en singleton (premier appel ~3s)
2. Le navigateur charge `@excalidraw/excalidraw` depuis le CDN `esm.sh`
3. Les éléments JSON sont convertis via `convertToExcalidrawElements()`
4. Export en SVG via `exportToSvg()`
5. Pour le PNG : Playwright prend un screenshot de l'élément SVG
6. Le fichier est écrit sur disque, le chemin est retourné à Claude Code
7. Les appels suivants réutilisent le navigateur déjà lancé (~60ms par rendu)

Le premier appel est donc un peu lent, mais les suivants sont quasi instantanés.

## Comment utiliser Excalidraw depuis Claude Code ?

### Premier diagramme

Il suffit de décrire ce qu'on veut en langage naturel :

```
Dessine un diagramme d'architecture montrant un load balancer
devant 3 serveurs d'application connectés à une base PostgreSQL
```

Claude Code va automatiquement :
1. Appeler `excalidraw_read_me` pour charger le format des éléments
2. Construire le JSON (rectangles, flèches, textes, positions)
3. Appeler `create_excalidraw_diagram` avec le JSON
4. Retourner le chemin du fichier généré

Pas de configuration supplémentaire, pas de JSON à écrire soi-même — on décrit, Claude dessine.

### Exemples de prompts efficaces

Plus le prompt est précis sur les composants et leurs relations, meilleur sera le résultat :

```
# Architecture microservices
Crée un diagramme Excalidraw montrant une architecture microservices
avec : API Gateway, Service Auth, Service Users, Service Orders,
une file RabbitMQ entre Orders et un Worker, et une BDD PostgreSQL
par service.

# Pipeline CI/CD
Diagramme de mon pipeline GitLab CI/CD :
commit → build Docker → tests unitaires → scan Trivy →
deploy staging → tests e2e → deploy prod (avec Argo CD)

# Infra Kubernetes
Schéma de mon cluster K8s :
3 nodes, un Ingress NGINX, 2 namespaces (staging/prod),
chacun avec des pods applicatifs et un service ClusterIP
```

### Récupérer et utiliser le fichier

Claude Code indique le chemin du fichier généré dans sa réponse. Ensuite :

```bash
# Ouvrir directement
xdg-open /tmp/architecture.png

# Copier vers votre projet
cp /tmp/architecture.png ./docs/diagrams/

# Ou intégrer dans un README
# ![Architecture](./docs/diagrams/architecture.png)
```

## Intégration avec une instance Excalidraw locale

Si vous hébergez votre propre instance **Excalidraw** (par exemple sur votre homelab), deux approches permettent de combiner génération automatique et édition manuelle.

### Approche 1 — Aller-retour JSON

Demandez à Claude Code de générer le JSON brut plutôt que le PNG :

```
Génère-moi le JSON Excalidraw (pas le PNG) pour un diagramme de...
```

Puis importez le JSON dans votre instance via le menu **Open**. Vous pourrez ensuite ajuster les positions, ajouter des annotations, peaufiner le style — tout ce qu'Excalidraw fait de mieux.

### Approche 2 — Canvas live avec mcp_excalidraw

Pour un workflow bidirectionnel entre Claude Code et un canvas live, ajoutez le serveur **mcp_excalidraw** de yctimlin en parallèle :

```bash
# Lancer le canvas
docker run -d -p 3000:3000 --name excalidraw-canvas \
  ghcr.io/yctimlin/mcp_excalidraw-canvas:latest

# Ajouter le second serveur MCP
claude mcp add --scope user --transport stdio excalidraw-live -- \
  docker run -i --rm \
  -e EXPRESS_SERVER_URL=http://host.docker.internal:3000 \
  -e ENABLE_CANVAS_SYNC=true \
  ghcr.io/yctimlin/mcp_excalidraw:latest
```

Vous aurez alors deux serveurs MCP complémentaires :
- **excalidraw** → génération rapide PNG/SVG (one-shot)
- **excalidraw-live** → manipulation CRUD sur canvas live (itératif)

## Dépannage

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| Premier rendu très lent (>10s) | Téléchargement Chromium + CDN | Normal au premier appel, ~60ms ensuite |
| Erreur "browser not found" | Playwright sans Chromium | `npx playwright install chromium` |
| Éléments mal positionnés | Coordonnées x/y incorrectes | Demander à Claude de recalculer le layout |
| Texte tronqué dans les shapes | Width trop petit pour le texte | Augmenter la largeur des éléments |
| Serveur MCP non détecté | Mauvais scope ou transport | Vérifier avec `claude mcp list` |
| Fichier non généré | Chemin de sortie non writable | Vérifier les permissions du dossier cible |

Pour diagnostiquer un problème :

```bash
# Tester le serveur MCP manuellement
npx -y excalidraw-render

# Inspecter les outils exposés avec l'inspecteur MCP
npx @modelcontextprotocol/inspector -- npx -y excalidraw-render
```

## Conclusion

En une seule commande, on connecte Claude Code à un moteur de rendu Excalidraw. Plus besoin de jongler entre le terminal et un outil de dessin : on décrit, Claude dessine. Le premier rendu prend quelques secondes (le temps que Chromium se lance), les suivants sont quasi instantanés.

C'est un bon exemple de ce que le protocole **MCP** permet : étendre les capacités de l'IA sans sacrifier la simplicité d'utilisation. Et si le résultat ne convient pas parfaitement, on peut toujours récupérer le JSON pour l'affiner dans son instance Excalidraw.

**Liens utiles :**
- [excalidraw-render sur npm](https://www.npmjs.com/package/excalidraw-render)
- [Documentation MCP](https://modelcontextprotocol.io)
- [Excalidraw MCP officiel](https://github.com/excalidraw/excalidraw-mcp)
- [mcp_excalidraw (canvas live)](https://github.com/yctimlin/mcp_excalidraw)
