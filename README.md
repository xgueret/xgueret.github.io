# xgueret.github.io

[![Deploy Hugo site to Pages](https://github.com/xgueret/xgueret.github.io/actions/workflows/hugo.yaml/badge.svg)](https://github.com/xgueret/xgueret.github.io/actions/workflows/hugo.yaml)

Blog personnel de Xavier GUERET - DevOps Engineer passionné par l'automatisation.

🌐 **Site web**: [https://xgueret.github.io/](https://xgueret.github.io/)

## 📝 À propos

Ce blog partage mes expériences et apprentissages sur le DevOps, l'automatisation et les technologies cloud. Vous y trouverez des tutoriels, des guides pratiques et des retours d'expérience sur :

- **Kubernetes** - Orchestration de conteneurs
- **Python** - Automatisation et scripting
- **Ansible** - Gestion de configuration
- **Terraform** - Infrastructure as Code
- **Docker/Podman** - Containerisation
- **Linux** - Administration système
- **AI/Claude Code** - Intelligence artificielle et automatisation

## 🛠️ Stack technique

- **Générateur**: [Hugo](https://gohugo.io/) (v0.128.0)
- **Thème**: [hugo-coder](https://github.com/luizdepra/hugo-coder)
- **Hébergement**: GitHub Pages
- **CI/CD**: GitHub Actions
- **Infrastructure**: Terraform

## 🌍 Multilingue

Le site est disponible en deux langues :
- 🇫🇷 Français (langue par défaut)
- 🇬🇧 English

## 🚀 Développement local

### Prérequis

- [Hugo Extended](https://gohugo.io/installation/) (>= 0.128.0)
- Git

### Installation

```bash
# Cloner le dépôt avec les sous-modules (thème)
git clone --recursive https://github.com/xgueret/xgueret.github.io.git
cd xgueret.github.io

# Si vous avez déjà cloné sans --recursive
git submodule update --init --recursive
```

### Lancer le serveur de développement

```bash
hugo server -D
```

Le site sera accessible sur [http://localhost:1313/](http://localhost:1313/)

### Créer un nouvel article

```bash
# En français
hugo new content/posts/mon-article.fr.md

# En anglais
hugo new content/posts/my-article.en.md
```

### Build de production

```bash
hugo --gc --minify
```

Le site généré sera dans le dossier `public/`.

## 📦 Structure du projet

```
.
├── content/          # Contenu du site (articles, pages)
│   ├── posts/       # Articles de blog
│   ├── about/       # Page à propos
│   ├── projects/    # Page projets
│   └── contact/     # Page contact
├── static/          # Fichiers statiques (images, etc.)
├── layouts/         # Templates personnalisés
├── themes/          # Thème Hugo (hugo-coder)
├── terraform/       # Configuration infrastructure
├── .github/
│   └── workflows/   # GitHub Actions workflows
├── hugo.toml        # Configuration Hugo
└── public/          # Site généré (non versionné)
```

## 🔄 Déploiement

Le déploiement est automatique via GitHub Actions :

1. Push sur la branche `main`
2. GitHub Actions déclenche le workflow `hugo.yaml`
3. Hugo build le site
4. Déploiement sur GitHub Pages

Le workflow peut aussi être déclenché manuellement depuis l'onglet Actions.

## 📜 Licence

Le contenu de ce blog est sous licence [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).

## 📫 Contact

- **GitHub**: [@xgueret](https://github.com/xgueret/)
- **GitLab**: [@971xavier.gueret](https://gitlab.com/971xavier.gueret/)
- **Twitter/X**: [@hixmaster](https://x.com/hixmaster)
- **LinkedIn**: [Xavier GUERET](https://www.linkedin.com/in/xavier-gueret-47bb3019b/)

---

*"Automatiser, c'est la clé pour un développement chill : moins de stress, plus de flow, et des déploiements qui se font les doigts dans le code !"*
