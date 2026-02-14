---
title: "Mon homelab Proxmox, entièrement automatisé avec Ansible"
date: "2026-02-13"
author: "Xavier GUERET"
description: "Comment j'ai automatisé le déploiement et la configuration de mon serveur Proxmox VE 9 avec Ansible et Cloud-Init."
tags:
  - "HomeLab"
  - "Proxmox"
  - "Ansible"
  - "Cloud-Init"
  - "IaC"
categories:
  - "github"
image: "/images/posts/proxmox-homelab.png"
---
## Pourquoi ce projet ?

Comme beaucoup de gens dans le milieu, j'ai un vieux PC qui traîne — un Acer XC-605 — et l'idée de le transformer en serveur maison me trottait dans la tête depuis un moment. Proxmox VE était le choix évident : libre, puissant, et parfait pour faire tourner des VMs et des conteneurs sans se ruiner.

Mais installer Proxmox à la main, créer des utilisateurs, configurer le stockage, monter des templates de VM… c'est le genre de tâches qu'on fait une fois et qu'on oublie. Sauf que le jour où il faut tout refaire (panne disque, migration, nouveau serveur), on se retrouve à fouiller dans ses notes et à perdre un week-end.

J'ai donc décidé de tout coder. Le résultat, c'est le projet [TiPunchLabs/proxmox](https://github.com/TiPunchLabs/proxmox) : un ensemble de playbooks Ansible qui prend un Proxmox fraîchement installé et le configure de A à Z, de manière idempotente et reproductible.

## Ce que fait le projet, concrètement

Le cœur du projet, c'est un playbook Ansible avec un rôle `configure` qui enchaîne quatre étapes, chacune exécutable indépendamment grâce aux tags :

### 1. Durcissement SSH

Première étape après une installation fraîche : sécuriser l'accès. Le playbook crée un utilisateur `ansible` dédié avec accès sudo, déploie ma clé publique SSH, puis désactive l'authentification par mot de passe. Classique, mais indispensable.

```bash
ansible-playbook -u root playbook.yml --tags "security_ssh_hardening"
```

Après ça, fini les connexions en root. Toutes les exécutions suivantes passent par l'utilisateur `ansible`.

### 2. Rôles, utilisateurs et tokens API Proxmox

C'est la partie que j'ai trouvée la plus intéressante à automatiser. Proxmox utilise son propre système de gestion des accès (`pveum`), et créer des tokens API avec les bons privilèges à la main est assez fastidieux.

Le playbook déploie un script Bash qui lit un fichier JSON décrivant les tokens à créer, puis utilise `pveum` pour provisionner le tout de manière idempotente :

- Un token **Terraform** (`terraform-prov@pve!terraform`) avec 20 privilèges — tout ce qu'il faut pour créer des VMs, gérer le stockage et le réseau.
- Un token **Ansible** (`ansible-prov@pve!ansible`) avec seulement 2 privilèges (`VM.PowerMgmt`, `VM.Audit`) — le strict minimum pour piloter des VMs existantes.

Les tokens générés sont stockés en JSON sur le serveur, prêts à être récupérés.

```bash
ansible-playbook playbook.yml --tags "setup_roles_users_tokens"
```

### 3. Configuration du stockage

Mon Acer a un SSD pour le système et un HDD supplémentaire pour les backups et les ISOs. Le playbook partitionne, formate et monte le disque, puis l'enregistre dans Proxmox comme storage de type `dir` avec les contenus `backup,iso,vztmpl`.

Tout est idempotent : si le disque est déjà partitionné, rien ne se passe. Et un flag `configure_storage_force_format: false` empêche tout formatage accidentel.

```bash
ansible-playbook playbook.yml --tags "setup_storage"
```

### 4. Génération de templates VM Cloud-Init

C'est la partie la plus dense. Le playbook télécharge une image cloud Ubuntu (24.04 Noble par défaut), la personnalise avec `virt-customize`, puis la transforme en template Proxmox prêt à cloner.

La personnalisation inclut :

- Installation de `qemu-guest-agent` et `cloud-init`
- Création d'un utilisateur `ansible` avec clé SSH et sudo
- Configuration du mot de passe root (stocké dans Ansible Vault)
- Activation de la console série (contournement d'un souci sur Ubuntu 24.04)

Ensuite, la VM est créée, le disque importé, les options de boot configurées, et le tout est converti en template. Plus qu'à cloner pour avoir une VM prête en quelques secondes.

```bash
ansible-playbook playbook.yml --tags "generate_vm_template"
```

## La gestion des secrets

Un point sur lequel j'ai passé du temps : ne jamais avoir de secret en clair dans le dépôt. La stratégie repose sur trois couches :

- **Ansible Vault** pour les variables sensibles (mots de passe des VMs, password de génération des tokens). Le fichier vault est chiffré en AES256.
- **pass** (le gestionnaire de mots de passe Unix) pour stocker le mot de passe du Vault. Un petit script `ansible-vault-pass.sh` fait le lien.
- **direnv** qui charge automatiquement les variables d'environnement quand j'entre dans le répertoire du projet.

Résultat : je tape `ansible-playbook playbook.yml` et tout se déverrouille en cascade, sans jamais me demander de mot de passe.

## Outillage et qualité de code

Le projet embarque pas mal de garde-fous pour garder le code propre :

- **pre-commit** avec 6 hooks : `shfmt`, `shellcheck`, `ansible-lint`, un check custom pour vérifier que les fichiers Vault sont bien chiffrés, `terraform fmt`, `terraform validate` et `tflint`.
- **CI GitHub Actions** qui lance le linting Ansible, Terraform et ShellCheck à chaque push/PR.
- **Dependabot** pour les mises à jour automatiques des dépendances.
- **uv** comme gestionnaire de paquets Python — bien plus rapide que pip et parfaitement intégré avec direnv.

## Installation

Pour ceux que ça intéresse, l'installation de Proxmox VE 9 sur l'Acer XC-605 nécessite un petit tweak : au menu de démarrage, il faut éditer la ligne de boot (touche `e`) et ajouter `nomodeset` à la fin de la ligne `linux`, puis valider avec F10. Classique pour du matériel un peu ancien.

## Et la suite ?

Le projet est en v0.1.0, c'est une première release qui pose les fondations. Quelques pistes pour la suite :

- **Rotation automatique des tokens** avec notifications
- **Intégration d'un vrai gestionnaire de secrets** (HashiCorp Vault, Bitwarden CLI, ou age/sops)
- **Remplacement des scripts Bash** par des modules Ansible natifs pour les opérations `pveum`
- **Scoping des permissions** : aujourd'hui les ACL sont sur `/` (racine), l'idée serait de les restreindre par ressource

Le projet est open-source sous licence MIT. Si le sujet vous parle, n'hésitez pas à jeter un œil au dépôt [TiPunchLabs/proxmox](https://github.com/TiPunchLabs/proxmox) — les contributions et retours sont les bienvenus.
