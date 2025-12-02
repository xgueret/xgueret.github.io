# Constitution du Projet - xgueret.github.io

## Vue d'ensemble

**Nom du projet:** xgueret.github.io
**Type:** Site statique / Blog technique personnel
**Auteur:** Xavier GUERET - Ingénieur DevOps
**URL de production:** https://xgueret.github.io/
**Licence:** CC BY-SA 4.0

## Stack Technique

### Générateur de site
- **Hugo v0.128.0 (Extended)** - Générateur de sites statiques
- **Thème:** hugo-coder (submodule Git)
- **SCSS:** Support via Dart Sass

### Frontend
- **HTML5** sémantique
- **CSS3 pur** - Pas de framework (pas de Tailwind, Bootstrap)
- **JavaScript Vanilla** - Pour les fonctionnalités interactives
- **Font Awesome** - Bibliothèque d'icônes

### Infrastructure & Déploiement
- **GitHub Pages** - Hébergement
- **GitHub Actions** - CI/CD automatisé
- **Terraform v5.45.0** - Infrastructure as Code (provider GitHub)

### Internationalisation
- **Langues:** Français (défaut), Anglais
- **Système:** Hugo i18n avec fichiers TOML

## Architecture du Projet

```
xgueret.github.io/
├── .github/workflows/     # Pipeline CI/CD
├── .specify/              # Configuration Speckit
├── content/               # Contenu Markdown (articles, pages)
│   ├── posts/            # Articles de blog (FR/EN)
│   ├── training/         # Formations (FR/EN)
│   ├── about.{fr,en}.md  # Pages À propos
│   ├── contact.{fr,en}.md
│   ├── cv.{fr,en}.md
│   └── projects.{fr,en}.md
├── layouts/               # Templates Hugo personnalisés
│   ├── partials/         # Composants réutilisables
│   │   ├── footer.html   # Footer avec icônes sociales
│   │   └── home/         # Partials de la homepage
│   │       ├── author.html          # Texte de présentation (sans titre)
│   │       ├── recent-articles.html # Articles récents
│   │       └── recent-trainings.html # Formations récentes
│   └── shortcodes/       # Extensions Markdown
├── assets/                # CSS et JS personnalisés
│   ├── custom.css        # Styles globaux
│   ├── chatbot.css       # Widget chatbot
│   └── chatbot.js        # Logique chatbot
├── static/                # Fichiers statiques
│   ├── images/           # Photos, captures d'écran
│   └── assets/           # CV PDF
├── i18n/                  # Traductions (FR/EN)
├── terraform/             # IaC pour le repository
├── themes/hugo-coder/     # Thème (submodule)
└── hugo.toml              # Configuration principale
```

## Principes Architecturaux

### 1. Séparation des préoccupations
- **Contenu** : Fichiers Markdown dans `content/`
- **Présentation** : Templates Hugo dans `layouts/`
- **Styles** : CSS personnalisé dans `assets/`
- **Configuration** : TOML pour tous les paramètres

### 2. Personnalisation du thème
- **NE JAMAIS** modifier directement les fichiers du thème
- **TOUJOURS** surcharger via `layouts/` à la racine
- Les partials personnalisés étendent ou remplacent ceux du thème

### 3. Structure bilingue
- Chaque contenu existe en deux variantes : `.fr.md` et `.en.md`
- Les traductions UI sont dans `i18n/{fr,en}.toml`
- Le français est la langue par défaut

### 4. CSS sans framework
- Utilisation de **CSS Custom Properties** pour le theming
- Design **mobile-first** avec media queries
- Support **dark/light mode** automatique
- **Flexbox et Grid** pour les layouts

## Conventions de Code

### Fichiers Markdown
- Format de nom : `{slug}.{lang}.md` (ex: `mon-article.fr.md`)
- Front matter en YAML avec : title, date, draft, categories, tags, authors
- Utiliser le shortcode `{{< rawhtml >}}` pour HTML personnalisé

### Templates Hugo
- Nommage en snake_case ou kebab-case
- Utiliser `partialCached` pour les contenus statiques
- Documenter les paramètres attendus dans les partials

### CSS
- Variables CSS pour toutes les couleurs et espacements
- Préfixer les classes spécifiques avec le nom du composant
- Animations avec transitions CSS, pas de JavaScript

### JavaScript
- Vanilla JS uniquement (pas de jQuery, pas de framework)
- Code commenté et fonctions documentées
- Gestion d'erreurs appropriée

## Fonctionnalités Personnalisées

### Widget Chatbot
- Bouton flottant en bas à droite
- Base de connaissances avec correspondance par mots-clés
- Support thème clair/sombre
- Fichiers : `chatbot.{css,js}`, `partials/chatbot.html`

### Nuage de catégories
- Affichage animé des tags sur la page blog
- Dimensionnement logarithmique basé sur le nombre d'articles
- Rotation de couleur HSL (angle d'or 137°)

### Articles récents
- Grille responsive 3 colonnes sur la homepage
- Layout en cartes avec ombres
- Affichage des tags par article

### Formations récentes
- Section identique à "Articles récents" sur la homepage
- Contenu dans `content/training/`
- Support des liens externes (GitHub)
- Traductions : `recentTrainings`, `viewAllTrainings`

### Footer avec icônes sociales
- Icônes des réseaux sociaux (GitHub, GitLab, Twitter, LinkedIn)
- Récupérées dynamiquement depuis `hugo.toml` (`[[params.social]]`)
- Design circulaire avec effet hover
- Texte copyright centré en dessous

### Homepage épurée
- Pas de titre h1 avec le nom de l'auteur (déjà dans navigation/footer)
- Texte de présentation avec police réduite (1.6rem)
- Icônes sociales déplacées dans le footer (pas de duplication)

## Workflow de Développement

### Développement local
```bash
hugo server -D    # Serveur avec drafts
hugo server       # Serveur production
```

### Build production
```bash
hugo --gc --minify
```

### Déploiement
- **Automatique** via GitHub Actions sur push vers `main`
- Pipeline : Install Hugo → Install Sass → Build → Deploy to Pages

## Règles de Contribution

### Commits
- Messages en anglais, format conventionnel
- Préfixes : feat, fix, docs, style, refactor, test, chore

### Contenu
- Toujours créer les deux versions linguistiques d'un article
- Optimiser les images avant ajout (format webp privilégié)
- Vérifier le rendu local avant push

### Code
- Pas de code mort ou commenté
- CSS : éviter les `!important`
- Tester sur mobile et desktop

## Sécurité

### Bonnes pratiques
- Token GitHub marqué sensible dans Terraform
- Permissions minimales dans GitHub Actions
- Pas de credentials dans le code source

### Points d'attention
- État Terraform committé (à améliorer)
- Pas de workflow PR (push direct sur main)

## Performance

### Optimisations appliquées
- Build Hugo avec `--gc` et `--minify`
- Cache des partials Hugo
- Pas de framework CSS externe
- Images optimisées dans `static/`

### Métriques cibles
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Score Lighthouse > 90

## Thématiques du Blog

Le blog couvre principalement :
- **DevOps** : CI/CD, automation, bonnes pratiques
- **Kubernetes** : Déploiement, configuration, tutoriels
- **Infrastructure** : Homelab, Proxmox, Docker
- **Outils** : Terraform, Ansible, Python, Bash
- **IA/ML** : Intégration d'assistants IA, LLM locaux

## Contact & Support

- **GitHub:** @xgueret
- **LinkedIn:** xavier-gueret
- **Email:** Voir page contact du site
