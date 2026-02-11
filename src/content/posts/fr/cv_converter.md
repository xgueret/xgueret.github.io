---
title: "Créer un CV ATS-friendly à partir d'un template HTML — un projet local et DevOps"
date: "2025-11-13"
author: "Xavier GUERET"
description: "Ce projet est né de l'idée de transformer mon CV en template HTML et d'automatiser sa génération en PDF et DOCX avec une approche DevOps."
tags:
  - "cv"
  - "ats"
  - "html"
  - "python"
  - "devops"
  - "local-first"
  - "automation"
categories:
  - "Développement"
  - "DevOps"
  - "Projets Personnels"
draft: false
---

## Pourquoi j'ai créé *cv-converter*

Ce projet est né de l'idée de transformer mon CV en template HTML et d'automatiser sa génération en PDF et DOCX avec une **approche DevOps**.

Je voulais une solution locale, reproductible, versionnée et entièrement maîtrisée, tout en profitant de ce besoin personnel pour structurer un workflow propre : direnv, pre-commit, Terraform, GitHub…

L'idée était simple :

- écrire mon CV en **HTML**, avec une structure claire
- générer automatiquement des **PDF** et **DOCX**
- garantir un résultat **ATS-friendly**
- automatiser tout le workflow avec des outils que j'utilise au quotidien :
  Direnv, Pre-commit, Terraform, GitHub Actions…

**[cv-converter](https://github.com/TiPunchLabs/cv-converter)** est donc né de ce mélange entre un besoin personnel et l'envie d'expérimenter une solution locale, propre et totalement maîtrisée.

---

## Un template HTML prêt à l'emploi

Le projet inclut un template HTML complet (FR + EN) :

- sections classiques : Compétences, Expérience, Formation
- structure sémantique propre (`<h1>`, `<h2>`, `<ul>`, `<p>`)
- style simple, sobre, compatible ATS
- organisation facile à personnaliser

Ce template sert de base pour générer automatiquement toutes les versions du CV.

---

## Pourquoi écrire son CV en HTML ?

### Flexibilité totale
Tu contrôles la mise en page et le style.

### Compatibilité ATS naturelle
Les ATS comprennent très bien les balises HTML structurées.

### Une seule source = plusieurs rendus
Un fichier HTML → un PDF + un DOCX, synchronisés.

**Les documents générés (PDF et DOCX) conservent intégralement la structure textuelle du template HTML, ce qui les rend compatibles avec les systèmes ATS.**
Aucun élément n'est transformé en image : titres, listes, dates, sections et compétences restent lisibles et exploitables par les outils de parsing.

### Parfait pour une approche DevOps
- versionning Git
- pipelines automatisés
- reproductibilité
- environnement contrôlé

---

## Génération automatique PDF + DOCX

Le convertisseur utilise :

- **WeasyPrint** pour générer un PDF propre
- **python-docx** pour générer un DOCX structuré
- **BeautifulSoup4** pour analyser le HTML

Exemple :

```bash
python cv_converter.py CV-template-fr.html
```

Résultat :
 `output/mon_cv.pdf` et `output/mon_cv.docx`.

------

## Un projet pensé comme un laboratoire DevOps

Ce projet m'a permis d'intégrer :

- Direnv pour isoler l'environnement Python
- Pre-commit pour la qualité (Black, Ruff, MyPy, TFLint, Tfsec…)
- Terraform pour gérer automatiquement le dépôt GitHub
- Une structure reproductible, portable et locale

Ce CV est donc autant un outil personnel… qu'un **exercice de rigueur DevOps**.

------

## Le projet

Disponible ici :  https://github.com/xgueret/cv-converter
