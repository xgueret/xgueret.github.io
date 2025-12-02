# Tâches : Implémentation "Formations Récentes"

**Référence** : `spec-recent-trainings.md`

---

## Phase 1 : Structure du Contenu

### TASK-001 : Créer le répertoire et fichiers de contenu training

**Fichiers à créer :**
- `content/training/_index.fr.md`
- `content/training/_index.en.md`
- `content/training/formation-python-filerouge.fr.md`
- `content/training/formation-python-filerouge.en.md`

**Détails :**

1. Créer `content/training/_index.fr.md` :
```yaml
---
title: "Formations"
description: "Découvrez mes formations techniques"
---
```

2. Créer `content/training/_index.en.md` :
```yaml
---
title: "Trainings"
description: "Discover my technical trainings"
---
```

3. Créer `content/training/formation-python-filerouge.fr.md` :
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
---

Apprenez Python à travers un projet pratique complet.
```

4. Créer la version anglaise correspondante

**Statut :** À faire

---

## Phase 2 : Templates Hugo

### TASK-002 : Créer le partial recent-trainings.html

**Fichier à créer :** `layouts/partials/home/recent-trainings.html`

**Contenu :**
```html
{{ $trainings := where .Site.RegularPages "Type" "training" }}
{{ $trainings := $trainings | first 3 }}
{{ if gt (len $trainings) 0 }}
<section class="recent-trainings">
  <h2>{{ i18n "recentTrainings" | default "Formations Récentes" }}</h2>
  <ul>
    {{- range $trainings -}}
    <li>
      <span class="date">{{ .Date | time.Format (.Site.Params.dateFormat | default "January 2, 2006" ) }}</span>
      <a class="title" href="{{ .Params.externalLink | default .RelPermalink }}"{{ if .Params.externalLink }} target="_blank" rel="noopener noreferrer"{{ end }}>{{ .Title }}</a>
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
    <a href="{{ "training/" | relLangURL }}">{{ i18n "viewAllTrainings" | default "Voir toutes les formations" }} →</a>
  </div>
</section>
{{ end }}
```

**Statut :** À faire

---

### TASK-003 : Intégrer le partial dans home.html

**Fichier à modifier :** `layouts/partials/home.html`

**Modification :**
Ajouter après la ligne `{{ partial "home/recent-articles.html" . }}` :
```html
{{ partial "home/recent-trainings.html" . }}
```

**Statut :** À faire

---

## Phase 3 : Internationalisation

### TASK-004 : Ajouter les traductions i18n

**Fichiers à modifier :**

1. `i18n/fr.toml` - Ajouter :
```toml
[recentTrainings]
other = "Formations Récentes"

[viewAllTrainings]
other = "Voir toutes les formations"
```

2. `i18n/en.toml` - Ajouter :
```toml
[recentTrainings]
other = "Recent Trainings"

[viewAllTrainings]
other = "View all trainings"
```

**Statut :** À faire

---

## Phase 4 : Styles CSS

### TASK-005 : Ajouter les styles CSS pour recent-trainings

**Fichier à modifier :** `assets/custom.css`

**Modification :**
Étendre les sélecteurs existants `.recent-articles` pour inclure `.recent-trainings`.

Remplacer toutes les occurrences de `.recent-articles` par `.recent-articles, .recent-trainings` dans la section correspondante (lignes 79-222).

**Alternative plus propre :**
Créer une classe commune `.recent-section` et l'appliquer aux deux sections.

**Statut :** À faire

---

## Phase 5 : Page Liste (optionnel)

### TASK-006 : Créer le template de liste pour les formations

**Fichier à créer :** `layouts/training/list.html`

**Contenu :** Copier et adapter `layouts/posts/list.html` pour les formations.

**Statut :** Optionnel

---

## Phase 6 : Tests et Validation

### TASK-007 : Tester l'implémentation

**Actions :**
1. Lancer `hugo server -D`
2. Vérifier l'affichage sur la homepage (FR et EN)
3. Tester le responsive (mobile, tablette, desktop)
4. Vérifier le mode sombre
5. Tester les liens (internes et externes)
6. Vérifier le lien "Voir toutes les formations"

**Critères de validation :**
- [ ] Section visible sur homepage
- [ ] 3 formations max affichées
- [ ] Style identique à Articles Récents
- [ ] Traductions FR/EN fonctionnelles
- [ ] Responsive OK
- [ ] Mode sombre OK
- [ ] Liens fonctionnels

**Statut :** À faire

---

## Résumé des Tâches

| ID | Tâche | Priorité | Statut |
|---|---|---|---|
| TASK-001 | Créer contenu training | Haute | À faire |
| TASK-002 | Créer partial recent-trainings.html | Haute | À faire |
| TASK-003 | Intégrer dans home.html | Haute | À faire |
| TASK-004 | Ajouter traductions i18n | Haute | À faire |
| TASK-005 | Ajouter styles CSS | Haute | À faire |
| TASK-006 | Créer template liste formations | Moyenne | Optionnel |
| TASK-007 | Tests et validation | Haute | À faire |

---

## Ordre d'Exécution Recommandé

1. **TASK-001** - Créer le contenu (base nécessaire)
2. **TASK-004** - Ajouter les traductions (préparation)
3. **TASK-002** - Créer le partial Hugo
4. **TASK-005** - Ajouter les styles CSS
5. **TASK-003** - Intégrer dans la homepage
6. **TASK-007** - Tester
7. **TASK-006** - (Optionnel) Page liste complète
