---
title: "Mon homelab : de Proxmox à Kubernetes, entièrement automatisé"
date: "2026-02-13"
author: "Xavier GUERET"
description: "Comment j'ai construit un monorepo Infrastructure as Code pour piloter mon homelab — Proxmox, Docker, Kubernetes — avec Terraform et Ansible."
tags:
  - "HomeLab"
  - "Proxmox"
  - "Ansible"
  - "Terraform"
  - "Docker"
  - "Kubernetes"
  - "Cloud-Init"
  - "IaC"
categories:
  - "github"
  - "DevOps"
  - "Projets Personnels"
image: "/images/posts/homelab.png"
---
## Pourquoi ce projet ?

Comme beaucoup de gens dans le milieu, j'ai un vieux PC qui traîne — un Acer XC-605 — et l'idée de le transformer en serveur maison me trottait dans la tête depuis un moment. Proxmox VE était le choix évident : libre, puissant, et parfait pour faire tourner des VMs et des conteneurs sans se ruiner.

Mais installer Proxmox à la main, créer des utilisateurs, configurer le stockage, monter des templates de VM… c'est le genre de tâches qu'on fait une fois et qu'on oublie. Sauf que le jour où il faut tout refaire (panne disque, migration, nouveau serveur), on se retrouve à fouiller dans ses notes et à perdre un week-end.

J'ai donc décidé de tout coder. Et très vite, le scope a dépassé la simple configuration de Proxmox : j'avais besoin d'un Docker host pour mes services conteneurisés, et d'un cluster Kubernetes pour apprendre et expérimenter. Le résultat, c'est le projet [TiPunchLabs/homelab](https://github.com/TiPunchLabs/homelab) : un monorepo Infrastructure as Code qui prend un Proxmox fraîchement installé et y déploie toute une infrastructure, de manière idempotente et reproductible.

## L'architecture du monorepo

Le projet est découpé en trois sous-projets indépendants, chacun suivant le même schéma : **Terraform** provisionne les VMs sur Proxmox, puis **Ansible** les configure.

```
homelab/
├── proxmox/          # Configuration de l'hyperviseur
│   ├── ansible/      #   Durcissement SSH, tokens API, stockage, templates VM
│   └── terraform/
├── dockhost/         # VM Docker host
│   ├── ansible/      #   Docker Engine, Portainer Agent, sécurité
│   └── terraform/    #   1 VM : 3 cœurs, 10 Go RAM, 100 Go disque
├── kubecluster/      # Cluster Kubernetes
│   ├── ansible/      #   10 rôles ordonnés : de runc à kubeadm
│   └── terraform/    #   1 control plane + 2 workers
├── modules/          # Module Terraform partagé (clone de VM)
├── github-terraform/ # Le dépôt GitHub géré en IaC
└── scripts/          # Scripts partagés (vault, pre-commit)
```

Cette organisation permet de travailler sur chaque brique indépendamment tout en partageant les fondations (module de VM, gestion des secrets, CI).

## La fondation : configurer Proxmox

Le sous-projet `proxmox/` est le point de départ. Son playbook Ansible avec un rôle `configure` enchaîne quatre étapes, chacune exécutable indépendamment grâce aux tags :

### Durcissement SSH

Première étape après une installation fraîche : sécuriser l'accès. Le playbook crée un utilisateur `ansible` dédié avec accès sudo, déploie ma clé publique SSH, puis désactive l'authentification par mot de passe.

```bash
ansible-playbook -u root playbook.yml --tags "security_ssh_hardening"
```

### Rôles, utilisateurs et tokens API

Proxmox utilise son propre système de gestion des accès (`pveum`), et créer des tokens API avec les bons privilèges à la main est assez fastidieux. Le playbook déploie un script qui lit un fichier JSON décrivant les tokens à créer, puis utilise `pveum` pour provisionner le tout de manière idempotente :

- Un token **Terraform** (`terraform-prov@pve!terraform`) avec 20 privilèges — tout ce qu'il faut pour créer des VMs, gérer le stockage et le réseau.
- Un token **Ansible** (`ansible-prov@pve!ansible`) avec seulement 2 privilèges (`VM.PowerMgmt`, `VM.Audit`) — le strict minimum pour piloter des VMs existantes.

```bash
ansible-playbook playbook.yml --tags "setup_roles_users_tokens"
```

### Stockage

Mon Acer a un SSD pour le système et un HDD supplémentaire pour les backups et les ISOs. Le playbook partitionne, formate et monte le disque, puis l'enregistre dans Proxmox comme storage de type `dir`. Tout est idempotent, et un flag `configure_storage_force_format: false` empêche tout formatage accidentel.

```bash
ansible-playbook playbook.yml --tags "setup_storage"
```

### Templates VM Cloud-Init

La partie la plus dense. Le playbook télécharge une image cloud Ubuntu (24.04 Noble), la personnalise avec `virt-customize` (installation de `qemu-guest-agent`, création de l'utilisateur `ansible`, configuration du mot de passe root via Ansible Vault), puis la transforme en template Proxmox prêt à cloner.

```bash
ansible-playbook playbook.yml --tags "generate_vm_template"
```

C'est ce template (ID 9001) que les deux autres sous-projets utilisent comme base pour toutes leurs VMs.

## Le Docker host

Une fois Proxmox configuré et le template prêt, le sous-projet `dockhost/` entre en jeu. Terraform clone le template pour créer une VM dédiée (3 cœurs, 10 Go de RAM, 100 Go de disque), puis Ansible la configure avec trois rôles :

- **motd** : un message d'accueil custom en ASCII art — le petit plaisir du homelab.
- **docker** : installation de Docker Engine et du plugin Docker Compose.
- **portainer_agent** : déploiement d'un agent Portainer via un template docker-compose, pour gérer les conteneurs depuis une interface web.

```bash
# Provisionner la VM
cd dockhost/terraform && terraform apply

# Configurer la VM
cd ../ansible && ansible-playbook deploy.yml
```

Un rôle `security_hardening` (SSH + UFW) est déjà prêt mais pas encore câblé dans le playbook principal — c'est dans la roadmap.

## Le cluster Kubernetes

Le sous-projet le plus ambitieux : `kubecluster/` déploie un cluster Kubernetes complet à partir de rien. Terraform crée trois VMs (1 control plane à 2 cœurs / 4 Go, 2 workers à 1 cœur / 3,5 Go chacun), puis Ansible enchaîne 10 rôles dans l'ordre :

1. **cfg_nodes** : prérequis système (paquets, paramètres noyau)
2. **inst_runc** : installation du runtime bas-niveau
3. **inst_cni** : plugins réseau CNI
4. **cfg_containerd** : configuration de containerd
5. **inst_cri_tools** : outils CRI (crictl)
6. **cfg_kubeadm_kubelet_kubectl** : installation de kubeadm, kubelet et kubectl (v1.34.0)
7. **init_kubeadm** : initialisation du control plane (nœud maître uniquement)
8. **kubectl_cheat_sheet** : aliases et auto-complétion kubectl (control plane uniquement)
9. **join_workers** : jonction des workers au cluster

```bash
# Provisionner les 3 VMs
cd kubecluster/terraform && terraform apply

# Déployer le cluster
cd ../ansible && ansible-playbook deploy.yml
```

En quelques minutes, on passe de zéro à un cluster Kubernetes fonctionnel, prêt à recevoir des workloads.

## L'infrastructure partagée

Deux briques transversales méritent d'être mentionnées :

Le **module Terraform** `modules/proxmox_vm_template/` est réutilisé par `dockhost` et `kubecluster`. Il encapsule le clonage d'un template Cloud-Init avec les paramètres de CPU, RAM, disque et réseau. Écrire ce module une fois et le consommer partout, c'est exactement le genre de factorisation qui rend l'IaC maintenable.

Le dossier `github-terraform/` gère le dépôt GitHub lui-même en tant que code : création du repository, protection de branche sur `main` avec l'exigence que les 4 jobs de CI passent avant tout merge. Du GitHub-as-Code, en somme.

## La gestion des secrets

Un point sur lequel j'ai passé du temps : ne jamais avoir de secret en clair dans le dépôt. La stratégie repose sur trois couches :

- **Ansible Vault** pour les variables sensibles (mots de passe des VMs, tokens API). Les fichiers vault sont chiffrés en AES256.
- **pass** (le gestionnaire de mots de passe Unix) pour stocker les mots de passe du Vault et les tokens Terraform. Un script `ansible-vault-pass.sh` fait le lien.
- **direnv** qui charge automatiquement les variables d'environnement (`TF_VAR_*`, mot de passe Vault) quand j'entre dans le répertoire du projet.

Résultat : je tape `terraform apply` ou `ansible-playbook deploy.yml` et tout se déverrouille en cascade, sans jamais me demander de mot de passe.

## Outillage et qualité de code

Le projet embarque pas mal de garde-fous pour garder le code propre :

- **pre-commit** avec des hooks partagés : `shfmt`, `shellcheck`, `ansible-lint`, un check custom pour vérifier que les fichiers Vault sont bien chiffrés, `terraform fmt`, `terraform validate` et `tflint`.
- **CI GitHub Actions** avec 4 jobs dédiés : Ansible Lint, Terraform Lint, Shell Lint et Security Check — le tout exécuté à chaque push et PR.
- **Dependabot** pour les mises à jour automatiques (GitHub Actions, providers Terraform, dépendances Python).
- **uv** comme gestionnaire de paquets Python — bien plus rapide que pip et parfaitement intégré avec direnv.

## Installation de Proxmox

Pour ceux que ça intéresse, l'installation de Proxmox VE 9 sur l'Acer XC-605 nécessite un petit tweak : au menu de démarrage, il faut éditer la ligne de boot (touche `e`) et ajouter `nomodeset` à la fin de la ligne `linux`, puis valider avec F10. Classique pour du matériel un peu ancien.

## Et la suite ?

Le projet pose des fondations solides, mais il y a encore beaucoup à construire :

- **Services sur le Docker host** : reverse proxy Traefik, runner GitHub Actions self-hosted
- **Workloads Kubernetes** : déployer de vrais services sur le cluster
- **Rotation automatique des tokens** avec notifications
- **Intégration d'un vrai gestionnaire de secrets** (HashiCorp Vault, Bitwarden CLI, ou age/sops)
- **Remplacement des scripts Bash** par des modules Ansible natifs pour les opérations `pveum`

Le projet est open-source sous licence MIT. Si le sujet vous parle, n'hésitez pas à jeter un œil au dépôt [TiPunchLabs/homelab](https://github.com/TiPunchLabs/homelab) — les contributions et retours sont les bienvenus.
