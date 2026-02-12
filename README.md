# xgueret.github.io

[![Deploy Astro site to Pages](https://github.com/xgueret/xgueret.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/xgueret/xgueret.github.io/actions/workflows/deploy.yml)

Blog personnel de Xavier GUERET - DevOps Engineer passionné par l'automatisation.

**Site web** : [https://xgueret.github.io/](https://xgueret.github.io/)

## À propos

Ce blog partage mes expériences et apprentissages sur le DevOps, l'automatisation et les technologies cloud. Vous y trouverez des tutoriels, des guides pratiques et des retours d'expérience sur :

- **Kubernetes** - Orchestration de conteneurs
- **Python** - Automatisation et scripting
- **Ansible** - Gestion de configuration
- **Terraform** - Infrastructure as Code
- **Docker/Podman** - Containerisation
- **Linux** - Administration système
- **IA** - Intelligence artificielle et automatisation

## Stack technique

- **Framework** : [Astro](https://astro.build/) v5
- **CSS** : [Tailwind CSS](https://tailwindcss.com/) v4
- **Composant interactif** : [React](https://react.dev/) (chatbot, island architecture)
- **Hébergement** : GitHub Pages
- **CI/CD** : GitHub Actions
- **Infrastructure** : Terraform

## Fonctionnalités

- Multilingue FR / EN avec routing préfixé
- Dark mode (toggle + détection système)
- Blog avec pagination et filtrage par catégories
- Chatbot intégré (React island)
- Sitemap et SEO (Open Graph, hreflang)
- 100% statique, zéro JS par défaut (sauf chatbot)

## Développement local

### Prérequis

- [Node.js](https://nodejs.org/) >= 22
- npm

### Installation

```bash
git clone https://github.com/xgueret/xgueret.github.io.git
cd xgueret.github.io
npm install
```

### Lancer le serveur de développement

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:4321/](http://localhost:4321/)

### Build de production

```bash
npm run build
npm run preview
```

Le site généré sera dans le dossier `dist/`.

## Structure du projet

```
.
├── src/
│   ├── components/       # Composants Astro + React (chatbot)
│   ├── content/          # Content Collections (Zod)
│   │   ├── posts/        # Articles FR + EN
│   │   ├── pages/        # Pages statiques FR + EN
│   │   └── training/     # Formations FR + EN
│   ├── i18n/             # Traductions (fr.ts, en.ts)
│   ├── layouts/          # BaseLayout, PostLayout, PageLayout
│   ├── pages/            # Routes (file-based routing)
│   └── styles/           # CSS global (Tailwind)
├── public/               # Assets statiques (images, PDF, vidéos)
├── terraform/            # Configuration infrastructure GitHub
├── astro.config.mjs      # Configuration Astro
├── tailwind.config.mjs   # Configuration Tailwind
└── tsconfig.json         # Configuration TypeScript
```

## Déploiement

Le déploiement est automatique via GitHub Actions :

1. Push sur la branche `main`
2. GitHub Actions déclenche le workflow `deploy.yml`
3. Astro build le site (Node 22)
4. Déploiement sur GitHub Pages

Le workflow peut aussi être déclenché manuellement depuis l'onglet Actions.

## Licence

Le contenu de ce blog est sous licence [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).

## Contact

- **GitHub** : [@xgueret](https://github.com/xgueret/)
- **LinkedIn** : [Xavier GUERET](https://www.linkedin.com/in/xavier-gueret-47bb3019b/)

---

*"Automatiser, c'est la clé pour un développement chill : moins de stress, plus de flow, et des déploiements qui se font les doigts dans le code !"*
