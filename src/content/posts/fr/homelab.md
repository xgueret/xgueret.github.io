---
title: "Mon homelab : de Proxmox à Kubernetes, entièrement automatisé"
date: "2026-03-30"
author: "Xavier GUERET"
description: "Comment j'ai construit un monorepo Infrastructure as Code pour piloter mon homelab — Proxmox, Docker, Kubernetes, WireGuard, Pi-hole — avec Terraform et Ansible."
tags:
  - "HomeLab"
  - "Proxmox"
  - "Ansible"
  - "Terraform"
  - "Docker"
  - "Kubernetes"
  - "Cloud-Init"
  - "IaC"
  - "WireGuard"
  - "Pi-hole"
  - "Caddy"
  - "GitLab-CI"
categories:
  - "github"
  - "DevOps"
  - "Projets Personnels"
image: "/images/posts/homelab.jpg"
---
## Pourquoi construire un homelab automatisé ?

Comme beaucoup de gens dans le milieu, j'ai un vieux PC qui traîne — un Acer XC-605 — et l'idée de le transformer en serveur maison me trottait dans la tête depuis un moment. Proxmox VE était le choix évident : libre, puissant, et parfait pour faire tourner des VMs et des conteneurs sans se ruiner.

Mais installer Proxmox à la main, créer des utilisateurs, configurer le stockage, monter des templates de VM… c'est le genre de tâches qu'on fait une fois et qu'on oublie. Sauf que le jour où il faut tout refaire (panne disque, migration, nouveau serveur), on se retrouve à fouiller dans ses notes et à perdre un week-end.

J'ai donc décidé de tout coder. Et très vite, le scope a grandi bien au-delà de la simple configuration de Proxmox : un Docker host pour mes services conteneurisés, un cluster Kubernetes pour apprendre et expérimenter, un VPN pour l'accès distant, un reverse proxy pour les domaines internes, un DNS local pour résoudre mes noms en `.internal`… De fil en aiguille, le projet est devenu une vraie plateforme. Le résultat, c'est le projet [TiPunchLabs/homelab](https://github.com/TiPunchLabs/homelab) : un monorepo Infrastructure as Code qui prend un Proxmox fraîchement installé et y déploie toute une infrastructure, de manière idempotente et reproductible.

## Comment est organisé le monorepo IaC ?

Le projet est découpé en sept sous-projets indépendants, chacun suivant le même schéma : **Terraform** provisionne les VMs ou conteneurs LXC sur Proxmox, puis **Ansible** les configure.

```
homelab/
├── proxmox/            # Configuration de l'hyperviseur
│   └── ansible/        #   Durcissement SSH, tokens API, stockage, templates VM
├── bastion/            # VM bastion (point d'entrée ops)
│   ├── ansible/        #   GitLab Runner, SSH keys, tooling
│   └── terraform/      #   1 VM : 2 cœurs, 2 Go RAM, 25 Go disque
├── dockhost/           # VM Docker host
│   ├── ansible/        #   Docker, Portainer, PostgreSQL, Kandidat, sécurité
│   └── terraform/      #   1 VM : 3 cœurs, 10 Go RAM, 100 Go disque
├── kubecluster/        # Cluster Kubernetes
│   ├── ansible/        #   9 rôles ordonnés : de runc à kubeadm
│   └── terraform/      #   1 control plane + 2 workers
├── vpngate/            # Passerelle VPN WireGuard
│   ├── ansible/        #   WireGuard + wg-easy
│   └── terraform/      #   1 VM : 1 cœur, 512 Mo RAM, 22 Go disque
├── caddy/              # Reverse proxy (conteneur LXC)
│   ├── ansible/        #   Caddy + certificats internes
│   └── terraform/      #   1 LXC : 1 cœur, 512 Mo RAM, 8 Go disque
├── pihole/             # Résolveur DNS (conteneur LXC)
│   ├── ansible/        #   Pi-hole v6 + enregistrements .internal
│   └── terraform/      #   1 LXC : 1 cœur, 512 Mo RAM, 8 Go disque
├── modules/            # Modules Terraform partagés (VM + LXC)
├── gitlab-terraform/   # Le projet GitLab géré en IaC
├── github-terraform/   # Le miroir GitHub géré en IaC
└── scripts/            # Scripts partagés (vault, pre-commit)
```

Au total, ça fait 7 VMs et 2 conteneurs LXC, le tout déployé sur un seul nœud Proxmox. Cette organisation permet de travailler sur chaque brique indépendamment tout en partageant les fondations (modules Terraform, gestion des secrets, CI).

## La fondation : configurer Proxmox

Le sous-projet `proxmox/` est le point de départ. Son playbook Ansible avec un rôle `configure` enchaîne quatre étapes, chacune exécutable indépendamment grâce aux tags :

### Comment sécuriser SSH sur un homelab ?

Première étape après une installation fraîche : sécuriser l'accès. Le playbook crée un utilisateur `ansible` dédié avec accès sudo, déploie ma clé publique SSH, puis désactive l'authentification par mot de passe.

```bash
ansible-playbook -u root playbook.yml --tags "security_ssh_hardening"
```

### Comment gérer les accès dans un homelab Proxmox ?

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

C'est ce template (ID 9001) que tous les autres sous-projets utilisent comme base pour leurs VMs.

## Le bastion

Le bastion (`bastion-60`, IP `192.168.1.60`) est le point d'entrée opérationnel de l'infrastructure. C'est la machine depuis laquelle Terraform et Ansible sont exécutés en mode distant, et c'est aussi là que tourne le **GitLab Runner** en mode shell.

Ansible configure la VM avec cinq rôles :

- **motd** : message d'accueil custom en ASCII art.
- **security_hardening** : durcissement SSH + pare-feu UFW.
- **tooling** : installation de Terraform, Ansible, pass, direnv, uv — tout l'outillage nécessaire pour piloter l'infrastructure.
- **ssh_keys** : déploiement des clés SSH pour accéder aux autres VMs.
- **gitlab_runner** : enregistrement d'un runner GitLab en mode shell pour exécuter la CI depuis l'infrastructure elle-même.

```bash
cd bastion/terraform && terraform apply
cd ../ansible && ansible-playbook deploy.yml
```

L'intérêt du bastion, c'est de centraliser l'exécution de l'IaC. Plutôt que de tout lancer depuis mon poste, je pousse sur GitLab, et le runner sur le bastion déroule les pipelines directement sur le réseau local.

## Le Docker host

Le sous-projet `dockhost/` déploie une VM dédiée aux services conteneurisés (3 cœurs, 10 Go de RAM, 100 Go de disque). Ansible la configure avec plusieurs rôles :

- **motd** : message d'accueil custom.
- **security_hardening** : durcissement SSH + UFW avec des règles de pare-feu spécifiques par service.
- **docker** : installation de Docker Engine et du plugin Docker Compose.
- **portainer_agent** : agent Portainer pour gérer les conteneurs depuis une interface web.
- **postgresql** : PostgreSQL 17.4 sur un réseau bridge Docker dédié (`db-net`), port 5432.
- **kandidat** : une application custom déployée sur le port 8000.
- **gitlab_runner** : un second GitLab Runner, cette fois en mode Docker executor.

```bash
cd dockhost/terraform && terraform apply
cd ../ansible && ansible-playbook deploy.yml
```

Le dockhost est la machine de travail du homelab. C'est là que tournent les services qui n'ont pas besoin de Kubernetes — une base de données, des applications web, des runners CI.

## Le cluster Kubernetes

Le sous-projet le plus ambitieux : `kubecluster/` déploie un cluster Kubernetes complet à partir de rien. Terraform crée trois VMs (1 control plane à 2 cœurs / 4 Go, 2 workers à 1 cœur / 3,5 Go chacun), puis Ansible enchaîne 9 rôles dans l'ordre :

1. **cfg_nodes** : prérequis système (paquets, paramètres noyau)
2. **inst_runc** : installation du runtime bas-niveau
3. **inst_cni** : plugins réseau CNI
4. **cfg_containerd** : configuration de containerd
5. **inst_cri_tools** : outils CRI (crictl)
6. **cfg_kubeadm_kubelet_kubectl** : installation de kubeadm, kubelet et kubectl
7. **init_kubeadm** : initialisation du control plane (nœud maître uniquement)
8. **kubectl_cheat_sheet** : aliases et auto-complétion kubectl (control plane uniquement)
9. **join_workers** : jonction des workers au cluster

```bash
cd kubecluster/terraform && terraform apply
cd ../ansible && ansible-playbook deploy.yml
```

En quelques minutes, on passe de zéro à un cluster Kubernetes fonctionnel, prêt à recevoir des workloads. Le sous-projet inclut aussi un environnement **Vagrant** local pour tester les rôles Ansible sans toucher au serveur — c'est le projet [TiPunchLabs/vagrant-k8s-cluster](https://github.com/TiPunchLabs/vagrant-k8s-cluster).

## La passerelle VPN

Le sous-projet `vpngate/` déploie une VM légère (1 cœur, 512 Mo de RAM) qui fait tourner un serveur **WireGuard** via **wg-easy**. C'est ce qui me permet d'accéder à l'infrastructure depuis l'extérieur — mon téléphone, un laptop en déplacement, etc.

Le rôle Ansible installe WireGuard, configure les règles UFW (port 51820/udp pour le tunnel, port 51821/tcp pour l'interface web), et déploie wg-easy via Docker Compose. L'interface web permet de créer des profils clients en un clic, avec un QR code à scanner sur mobile.

```bash
cd vpngate/terraform && terraform apply
cd ../ansible && ansible-playbook deploy.yml
```

## Le reverse proxy et le DNS interne

Les deux derniers sous-projets fonctionnent en tandem : **Caddy** comme reverse proxy et **Pi-hole** comme résolveur DNS. Tous les deux tournent dans des conteneurs **LXC** plutôt que des VMs complètes — plus légers pour des services qui n'ont pas besoin de beaucoup de ressources.

### Caddy (conteneur LXC)

Caddy écoute sur `192.168.1.70` et fait office de reverse proxy pour les services internes. Trois backends sont configurés :

- `proxmox.internal` → l'interface web Proxmox (port 8006)
- `kandidat.internal` → l'application sur le dockhost (port 8000)
- `vpngate.internal` → l'interface wg-easy (port 51821)

Caddy gère automatiquement les certificats TLS internes — pas besoin de cliquer sur "accepter le risque" à chaque fois.

### Pi-hole (conteneur LXC)

Pi-hole v6 tourne sur `192.168.1.71` et sert avant tout de **DNS local** : il résout les noms de domaine `.internal` en pointant vers Caddy. Le blocage des publicités et trackers est un bonus appréciable, mais la raison d'être de ce sous-projet, c'est d'avoir un vrai résolveur DNS maison pour l'infrastructure.

Les enregistrements DNS locaux sont gérés via la CLI Pi-hole v6, directement depuis le playbook Ansible :

```
proxmox.internal  → 192.168.1.70  (Caddy)
kandidat.internal → 192.168.1.70  (Caddy)
vpngate.internal  → 192.168.1.70  (Caddy)
```

Le résultat : je tape `proxmox.internal` dans mon navigateur et j'arrive sur l'interface Proxmox avec un certificat valide, sans avoir à retenir une IP et un port.

## L'infrastructure partagée

Plusieurs briques transversales méritent d'être mentionnées :

Les **modules Terraform** dans `modules/` sont réutilisés par tous les sous-projets. Il y en a deux : `proxmox_vm_template` pour les VMs classiques et `proxmox_lxc_template` pour les conteneurs LXC. Chaque module encapsule les paramètres de CPU, RAM, disque et réseau. Écrire ces modules une fois et les consommer partout, c'est exactement le genre de factorisation qui rend l'IaC maintenable.

Le dossier `gitlab-terraform/` gère le projet GitLab lui-même en tant que code. **GitLab est la source de vérité** du projet — c'est là que tourne la CI, que sont gérées les merge requests, et que Renovate met à jour les dépendances. Le dossier `github-terraform/` gère un **miroir en lecture seule** sur GitHub pour la visibilité open-source.

## La gestion des secrets

Un point sur lequel j'ai passé du temps : ne jamais avoir de secret en clair dans le dépôt. La stratégie repose sur trois couches :

- **Ansible Vault** pour les variables sensibles (mots de passe des VMs, tokens API). Les fichiers vault sont chiffrés en AES256.
- **pass** (le gestionnaire de mots de passe Unix) pour stocker les mots de passe du Vault et les tokens Terraform. Un script `ansible-vault-pass.sh` fait le lien.
- **direnv** qui charge automatiquement les variables d'environnement (`TF_VAR_*`, mot de passe Vault) quand j'entre dans le répertoire du projet.

Résultat : je tape `terraform apply` ou `ansible-playbook deploy.yml` et tout se déverrouille en cascade, sans jamais me demander de mot de passe.

## Outillage et qualité de code

Le projet embarque pas mal de garde-fous pour garder le code propre :

- **pre-commit** avec une batterie de hooks : `shfmt`, `shellcheck`, `ansible-lint`, un check custom pour vérifier que les fichiers Vault sont bien chiffrés, `terraform fmt`, `terraform validate`, `tflint`, et `glab ci lint` pour valider la configuration CI.
- **GitLab CI** avec un pipeline complet en quatre étapes : **lint** (Ansible, Terraform, Shell sur chaque sous-projet), **security** (vérification du chiffrement Vault, scan de clés privées, détection de secrets hardcodés, scan d'images Docker avec Trivy), **deploy** (synchronisation du bastion), et **renovate** (mises à jour automatiques hebdomadaires).
- **Renovate** pour les mises à jour automatiques — providers Terraform, dépendances Python, hooks pre-commit, images Docker. Les hooks pre-commit sont auto-mergés, le reste passe par une merge request.
- **uv** comme gestionnaire de paquets Python — bien plus rapide que pip et parfaitement intégré avec direnv.

## Installation de Proxmox

Pour ceux que ça intéresse, l'installation de Proxmox VE 9 sur l'Acer XC-605 nécessite un petit tweak : au menu de démarrage, il faut éditer la ligne de boot (touche `e`) et ajouter `nomodeset` à la fin de la ligne `linux`, puis valider avec F10. Classique pour du matériel un peu ancien.

## Et la suite ?

Le projet a bien grandi depuis sa première version. Beaucoup de choses qui étaient dans la roadmap initiale sont maintenant en production — le durcissement de sécurité sur le dockhost, le reverse proxy, le VPN, le DNS. Mais il reste encore des chantiers :

- **Workloads Kubernetes** : déployer de vrais services sur le cluster (le cluster est prêt, il attend ses premiers habitants)
- **Monitoring** : centraliser les logs et les métriques (Prometheus + Grafana, ou une stack plus légère)
- **Backup automatisé** : snapshots Proxmox et sauvegarde des données PostgreSQL
- **Rotation automatique des tokens** avec notifications
- **Haute disponibilité** : ajouter un second nœud Proxmox pour la redondance

Le projet est open-source sous licence MIT. Si le sujet vous parle, n'hésitez pas à jeter un œil au dépôt [TiPunchLabs/homelab](https://github.com/TiPunchLabs/homelab) — les contributions et retours sont les bienvenus.
