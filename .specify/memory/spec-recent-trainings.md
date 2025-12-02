# Spécification : Rubrique "Formations Récentes" sur la Page d'Accueil

## Contexte

Ajouter une nouvelle section "Formations Récentes" sur la page d'accueil, identique en style et comportement à la section "Articles Récents" existante.

## Objectif

Mettre en avant les formations proposées par Xavier GUERET directement sur la homepage, avec une présentation visuelle cohérente avec le reste du site.

## Référence : Section "Articles Récents" existante

La section existante utilise :
- **Template** : `layouts/partials/home/recent-articles.html`
- **Styles CSS** : `.recent-articles` dans `assets/custom.css` (lignes 79-222)
- **i18n** : Clés `recentArticles` et `viewAllPosts` dans `i18n/{fr,en}.toml`
- **Intégration** : Appelée dans `layouts/partials/home.html`

### Structure HTML actuelle (Articles Récents)

```html
<section class="recent-articles">
  <h2>{{ i18n "recentArticles" }}</h2>
  <ul>
    <li>
      <span class="date">...</span>
      <a class="title" href="...">...</a>
      <div class="tags">
        <span class="tag">...</span>
      </div>
    </li>
  </ul>
  <div class="view-all">
    <a href="...">Voir tous les articles →</a>
  </div>
</section>
```

## Spécification Technique

### 1. Structure du Contenu

Créer un nouveau type de contenu `training` dans Hugo :

```
content/
├── training/
│   ├── _index.fr.md          # Page liste des formations (FR)
│   ├── _index.en.md          # Page liste des formations (EN)
│   ├── formation-python-filerouge.fr.md
│   ├── formation-python-filerouge.en.md
│   └── ... (futures formations)
```

### 2. Front Matter des Formations

```yaml
---
title: "Formation Python - Fil Rouge"
date: 2024-01-15
draft: false
description: "Projet pratique pour apprendre Python à travers un cas concret"
externalLink: "https://github.com/TiPunchLabs/formation-python-filerouge"
tags:
  - Python
  - Formation
  - Débutant
level: "Débutant"  # Débutant, Intermédiaire, Avancé
duration: "20h"    # Durée estimée (optionnel)
---
```

### 3. Template Hugo

Créer `layouts/partials/home/recent-trainings.html` :

```html
{{ $trainings := where .Site.RegularPages "Type" "training" }}
{{ $trainings := $trainings | first 3 }}
{{ if gt (len $trainings) 0 }}
<section class="recent-trainings">
  <h2>{{ i18n "recentTrainings" | default "Recent Trainings" }}</h2>
  <ul>
    {{- range $trainings -}}
    <li>
      <span class="date">{{ .Date | time.Format (.Site.Params.dateFormat | default "January 2, 2006" ) }}</span>
      <a class="title" href="{{ .Params.externalLink | default .RelPermalink }}">{{ .Title }}</a>
      {{ if .Params.tags }}
      <div class="tags">
        {{ range .Params.tags }}
        <span class="tag">{{ . }}</span>
        {{ end }}
      </div>
      {{ end }}
    </li>
    {{- end -}}
  </ul>
  <div class="view-all">
    <a href="{{ "training/" | relLangURL }}">{{ i18n "viewAllTrainings" | default "View all trainings" }} →</a>
  </div>
</section>
{{ end }}
```

### 4. Styles CSS

Réutiliser les styles de `.recent-articles` en ajoutant une classe `.recent-trainings` avec les mêmes propriétés. Option d'une couleur d'accent différente (ex: teinte verte/orange au lieu de grise).

```css
/* Option 1 : Réutilisation complète */
.recent-articles,
.recent-trainings {
  /* styles communs */
}

/* Option 2 : Classe utilitaire */
.recent-section { /* styles communs */ }
.recent-articles { /* spécifique articles */ }
.recent-trainings { /* spécifique formations */ }
```

### 5. Internationalisation (i18n)

Ajouter dans `i18n/fr.toml` :
```toml
[recentTrainings]
other = "Formations Récentes"

[viewAllTrainings]
other = "Voir toutes les formations"
```

Ajouter dans `i18n/en.toml` :
```toml
[recentTrainings]
other = "Recent Trainings"

[viewAllTrainings]
other = "View all trainings"
```

### 6. Intégration Homepage

Modifier `layouts/partials/home.html` :

```html
<section class="container centered">
  <div class="about">
    {{ partialCached "home/avatar.html" . }}
    {{ partialCached "home/author.html" . }}
    {{ partialCached "home/social.html" . }}
  </div>

  {{ partial "home/recent-articles.html" . }}

  {{ partial "home/recent-trainings.html" . }}  <!-- NOUVEAU -->

  {{ partialCached "home/extensions.html" . }}
</section>
```

### 7. Page Liste des Formations (optionnel)

Créer `layouts/training/list.html` pour la page `/training/` avec le même style que la liste des articles.

## Design

### Apparence Visuelle

- **Identique** à "Articles Récents" pour la cohérence
- Grille 3 colonnes (desktop), 2 colonnes (tablette), 1 colonne (mobile)
- Cartes avec bordure, ombre au survol, animation translateY
- Tags affichés en bas de chaque carte
- Bouton "Voir toutes les formations" centré

### Différenciation (optionnel)

Pour distinguer visuellement les formations des articles :
- Icône différente dans le titre (ex: 🎓 ou graduation-cap)
- Teinte de couleur légèrement différente pour les tags (ex: orange au lieu de gris)

## Critères d'Acceptation

1. ✅ La section "Formations Récentes" apparaît sur la homepage sous "Articles Récents"
2. ✅ Les 3 formations les plus récentes sont affichées
3. ✅ Le style est identique à "Articles Récents"
4. ✅ Les traductions FR/EN fonctionnent
5. ✅ Le lien "Voir toutes les formations" mène à `/training/`
6. ✅ Le design est responsive (mobile/tablette/desktop)
7. ✅ Le mode sombre est supporté
8. ✅ Les liens externes s'ouvrent correctement

## Dépendances

- Aucune nouvelle dépendance requise
- Utilise les fonctionnalités Hugo existantes
