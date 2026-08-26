---
title: "Configurer un Hook Pre-Commit pour Vérifier le Chiffrement des Fichiers avec Ansible Vault"
date: "2024-10-27"
author: "Xavier GUERET"
tags:
  - "ansible"
  - "ansible-vault"
  - "bash"
  - "pre-commit"
  - "python"
categories:
  - "Tutoriels"
image: "/images/posts/hook-pre-commit.png"  
---

Dans ce tutoriel, nous allons mettre en place un *hook [pre-commit](https://pre-commit.com/)* qui s'assurera que tous les fichiers du dossier `secret` sont chiffrés avec `ansible-vault` avant d'autoriser leur commit dans Git. Cela permet de garantir que les informations sensibles restent protégées.

## Prérequis

- **Python** (nécessaire pour installer l'outil `pre-commit`)
- **Ansible** (pour `ansible-vault`)

## Étape 1 : Installer `pre-commit`

Tout d'abord, nous devons installer l'outil `pre-commit` :

```shell
pip install pre-commit
```

`pre-commit` nous permet de définir des vérifications automatiques à effectuer avant chaque commit, comme ici la vérification du chiffrement des fichiers.

## Étape 2 : Créer la Configuration de Pre-Commit

À la racine de votre projet, créez un fichier `.pre-commit-config.yaml` qui contiendra la configuration du hook.

```shell
repos:
  - repo: local
    hooks:
      - id: check-ansible-vault
        name: Check Ansible Vault Encryption
        entry: bash check_ansible_vault.sh
        language: system
        files: ^secret/.*$
        stages: [pre-commit]
```

#### Explication des paramètres

- `repo: local` : indique que ce hook est local, c'est-à-dire spécifique à votre projet.
- `entry: bash check_ansible_vault.sh` : le hook exécutera un script nommé `check_ansible_vault.sh`.
- `files: ^secret/.*$` : ne sélectionne que les fichiers dans le dossier `secret`.
- `stages: [commit]` : applique ce hook au moment du commit.

## Étape 3 : Créer le Script de Vérification

Ensuite, nous devons créer le script `check_ansible_vault.sh` qui vérifiera si chaque fichier dans `secret` est bien chiffré avec `ansible-vault`.

1. À la racine du projet, créez un fichier nommé `check_ansible_vault.sh`.
2. Ouvrez-le et ajoutez-y le contenu suivant :

```shell
#!/bin/bash

# Boucle sur chaque fichier fourni en argument par pre-commit
for file in "$@"; do
    # Vérifie si le fichier est bien chiffré avec ansible-vault
    if ! ansible-vault view "$file" &>/dev/null; then
        echo "Erreur : Le fichier $file n'est pas chiffré avec ansible-vault."
        exit 1
    fi
done
```

Ce script :

- Parcourt chaque fichier fourni en paramètre par `pre-commit` dans le dossier `secret`.
- Utilise `ansible-vault view` pour vérifier si le fichier est chiffré (sans afficher son contenu).
- Si un fichier n'est pas chiffré, il affiche un message d'erreur et retourne un code de sortie `1`, empêchant ainsi le commit.

1. Rendre le script exécutable en exécutant la commande suivante :

   ```shell
   chmod +x check_ansible_vault.sh
   ```

1. ```

   ```

## Étape 4 : Installer le Hook Pre-Commit

Installez le hook dans votre projet pour qu'il s'exécute automatiquement à chaque commit :

```shell
pre-commit install
```

Cela ajoutera un hook dans votre configuration Git qui invoquera `pre-commit` avant chaque commit.

### Étape 5 : Tester le Hook

1. Essayez de committer un fichier non chiffré dans le dossier `secret` pour vérifier que le hook fonctionne correctement. Vous devriez voir un message d'erreur indiquant que le fichier n'est pas chiffré.

2. Si tout fonctionne correctement, lorsque tous les fichiers dans `secret` sont bien chiffrés avec `ansible-vault`, le commit sera autorisé.



## Conclusion

Avec ce *pre-commit hook*, vous vous assurez que tous les fichiers sensibles dans `secret` sont protégés par `ansible-vault` avant d'être committés.
