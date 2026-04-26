---
title: "Mon laptop comme du code : approche DevOps pour configurer mon poste"
date: "2026-04-25"
author: "Xavier GUERET"
description: "Pourquoi j'ai arrêté de configurer mon PC à la main. Ansible, mise, uv, direnv, Ansible Vault, pre-commit et un smoke test Vagrant pour bootstrap un laptop Debian/Ubuntu de façon reproductible."
tags:
  - "Ansible"
  - "mise"
  - "uv"
  - "direnv"
  - "pre-commit"
  - "Vagrant"
  - "Ansible-Vault"
  - "IaC"
  - "DevOps"
  - "Makefile"
categories:
  - "github"
  - "DevOps"
  - "Projets Personnels"
image: "/images/posts/laptop_bootstrap.png"
draft: false
---

## Pourquoi traiter son laptop comme une infrastructure ?

J'ai changé de PC il y a quelques temps, et ce qui aurait dû être une journée tranquille est redevenu une chasse au trésor : retrouver mes alias, retrouver la bonne version de `kubectl`, ré-ajouter les dépôts apt, reconfigurer git, réinstaller mise et son TOML, refaire la pile Docker… Le `local-compute` que j'avais publié à l'époque — un script bash qui montait un venv Python et lançait quelques playbooks Ansible — ne tenait plus la route. Trop fragile, pas testé, pas de rôles structurés, pas de gestion de secrets digne de ce nom.

J'ai donc tout repris, mais cette fois en appliquant exactement les mêmes principes que je mets en œuvre sur mon homelab et au boulot : **infrastructure as code, idempotence, gestion centralisée des secrets, tests sur une VM jetable, hooks de qualité bloquants**. Le résultat, c'est [TiPunchLabs/laptop-bootstrap](https://github.com/TiPunchLabs/laptop-bootstrap) — un projet qui prend une Debian ou Ubuntu fraîche et installe **mon** poste de travail de manière reproductible, en quelques minutes, sans jamais me demander un mot de passe.

L'idée n'est pas révolutionnaire — c'est juste appliquer la discipline DevOps là où on ne le fait pas d'habitude : son propre laptop.

## Comment est organisé le projet ?

Le repo s'articule autour de quelques briques classiques d'un projet Ansible, sauf que tout est pensé pour être lancé localement sur le poste qu'on configure :

```
laptop-bootstrap/
├── ansible.cfg
├── inventory.yml             # localhost uniquement
├── playbook.yml              # orchestre les rôles
├── Makefile                  # façade quotidienne
├── pyproject.toml / uv.lock  # dépendances Python (uv)
├── .envrc                    # direnv : active le venv + le vault password
├── .pre-commit-config.yaml   # garde-fous bloquants
├── bin/
│   ├── local_laptop.sh       # wrapper bas niveau (legacy)
│   ├── ansible-vault-pass.sh # lit le mot de passe depuis pass
│   └── check_ansible_vault.sh# pre-commit : vérifie le chiffrement
├── group_vars/all/           # vars + vault chiffré
├── roles/
│   ├── bootstrap/            # point d'entrée + sources apt vendor (deb822)
│   ├── cli_tools/            # tous les CLI user-space via mise
│   ├── cleanup_legacy/       # éviction des installs pré-mise
│   ├── docker/               # Docker engine + plugin compose
│   ├── git/                  # configuration git
│   ├── devtools/             # Postman, etc.
│   └── vagrant/              # vagrant + libvirt + plugin vagrant-libvirt
├── test/smoke/               # harness Vagrant pour rejouer sur une VM clean
└── docs/
    ├── guide-daily-usage.md
    ├── guide-smoke-test-vagrant.md
    └── adr/                  # Architecture Decision Records
```

Chaque rôle est tagué dans le playbook, ce qui permet d'exécuter une partie ciblée plutôt que tout réappliquer :

```bash
make play                       # tout le playbook
make play-cli-tools             # seulement le rôle cli_tools
make play TAGS=docker,git       # combinaison arbitraire
```

Pas de magie : Ansible reste Ansible, le Makefile est juste une façade pour rendre les invocations courantes courtes et mémorables.

## La décision structurante : tous les outils CLI via mise

Pendant longtemps, mes outils ligne de commande étaient installés par quatre mécanismes différents : `apt` Ubuntu pour `fzf` et `direnv`, dépôts apt tiers pour `terraform`, `kubectl`, `vagrant`, scripts upstream pour `starship` et `uv`, et un binaire posé à la main pour `aws-cli` v2. Ça marchait, mais ça créait quatre problèmes structurels :

- **Drift de versions** — `apt` livre ce qu'Ubuntu a packagé (souvent vieux), les scripts d'install tirent toujours la dernière version, les binaires manuels gèlent au moment de l'install. Aucun endroit unique ne dit "voilà quelles versions sont installées sur cette machine".
- **PATH ambigu** — le même binaire peut exister dans `/usr/bin`, `/usr/local/bin` et `~/.local/bin`. `which terraform` devient imprévisible.
- **Coût de nettoyage** — supprimer un outil, c'est retrouver le bon mécanisme : fichier de dépôt apt, clé GPG, symlink, binaire perso.
- **Boilerplate Ansible** — chaque nouvel outil dupliquait le même pattern : récupérer la dernière version via l'API GitHub, comparer, télécharger, installer.

J'ai documenté la bascule dans une **ADR** ([ADR-0001](https://github.com/TiPunchLabs/laptop-bootstrap/blob/main/docs/adr/0001-unified-cli-tool-management-with-mise.md)) parce que c'est exactement le genre de décision structurante qui mérite une trace écrite, même sur un projet perso. La décision : **[mise](https://mise.jdx.dev/) devient le gestionnaire unique pour tous les outils CLI user-space**, déclarés dans `~/.config/mise/config.toml`.

Sont gérés par mise : `uv`, `fzf`, `direnv`, `zoxide`, `eza`, `bat`, `chezmoi`, `starship`, `kubectl`, `terraform`, `awscli`. La seule exception, c'est `vagrant` — il dépend du plugin `vagrant-libvirt` qui s'attend à un binaire système et à l'appartenance au groupe `libvirt`, donc il reste sur le dépôt apt HashiCorp.

Le rôle `cli_tools` rend ça idempotent : il installe mise une fois, dépose le `config.toml`, lance `mise install`, et gère un bloc balisé dans `~/.bashrc` pour `eval "$(mise activate bash)"`. Un autre rôle, `cleanup_legacy`, désinstalle proprement les versions pré-mise qui traînent depuis l'ancienne approche.

Le bénéfice concret : `mise upgrade` met tout à jour d'un coup, et `mise ls` me donne l'inventaire complet de mes outils en une commande.

## Comment je gère le venv Python du projet lui-même

Le projet `laptop-bootstrap` est lui-même un projet Python : Ansible tourne dans un venv. Pas question de polluer le système avec un `pip install ansible` — et encore moins de demander à l'utilisateur de gérer son `source .venv/bin/activate` manuellement.

J'utilise **[uv](https://docs.astral.sh/uv/)** pour le packaging et **[direnv](https://direnv.net/)** pour l'activation automatique. Le `pyproject.toml` déclare les dépendances, `uv.lock` les fige, et le `.envrc` à la racine du repo s'occupe du reste :

```bash
# .envrc (extrait)
use venv
export ANSIBLE_VAULT_PASSWORD=$(pass ansible/vault)
```

Conséquence : je `cd laptop-bootstrap/`, direnv active le venv, exporte le mot de passe Vault depuis [pass](https://www.passwordstore.org/), et je peux taper `make play` directement. Pas de `source`, pas de mot de passe à retaper, pas de "j'ai oublié d'activer le venv".

## Comment je gère les secrets sans en mettre dans le repo

Le repo est public, et il contient quand même quelques infos sensibles (URL d'API, mots de passe utilisés à l'install, tokens). La stratégie repose sur trois couches qui se répondent :

- **Ansible Vault** chiffre les variables sensibles dans `group_vars/all/vault/main.yml` (AES256). Le fichier reste dans le repo, mais illisible sans le mot de passe.
- **pass** stocke ce mot de passe Vault dans le keyring GPG de l'utilisateur. Aucune trace en clair sur le disque.
- **direnv** charge automatiquement `ANSIBLE_VAULT_PASSWORD` depuis pass au moment où j'entre dans le répertoire du projet.

Le pre-commit hook `check_ansible_vault.sh` vérifie à chaque commit que tout fichier vault commence bien par `$ANSIBLE_VAULT;...` et n'est jamais en clair. Si quelqu'un (moi compris) tente de pousser un fichier vault déchiffré, le commit est bloqué.

```bash
make vault-edit    # ouvre l'éditeur sur le fichier déchiffré, re-chiffre à la sortie
make vault-view    # juste pour lire
```

## Pre-commit : la qualité non négociable

Aucun changement ne part vers `main` sans passer la batterie de hooks. C'est exactement le même réflexe qu'au boulot : un pipeline qui valide tout en local avant le push.

```yaml
# Aperçu de ce que pre-commit applique
- yamllint, check-yaml, document-start
- shellcheck, shfmt
- ansible-lint
- terraform_fmt, terraform_validate, terraform_tflint
- flake8 (Python)
- check_ansible_vault.sh (hook custom)
- detect-private-key, trailing-whitespace, end-of-file-fixer
```

Deux raccourcis dans le Makefile :

```bash
make lint           # toute la batterie sur tous les fichiers
make lint-ansible   # ansible-lint seul, feedback rapide pendant l'édition d'un rôle
```

L'effet utile, c'est qu'il devient impossible de pousser un YAML mal indenté, un script bash sans `set -e`, un rôle Ansible avec un `command:` non idempotent ou un fichier vault déchiffré.

## Comment tester sans niquer mon vrai laptop : Vagrant + libvirt

C'est le point dont je suis le plus content. Modifier un rôle Ansible et tester directement sur son poste, c'est une **très** mauvaise idée — quand le rôle a un bug, on le découvre en cassant son propre environnement de travail.

Le projet embarque donc un harness de smoke test dans `test/smoke/` : un Vagrantfile qui démarre une VM Ubuntu propre via libvirt, rsync-ifie le code du repo dedans, et rejoue le playbook complet. Tout est piloté depuis le Makefile :

```bash
make smoke-up                   # boot VM, installe ansible, joue le playbook (~10 min la 1re fois)
make smoke-replay               # rsync code + replay
make smoke-replay TAGS=docker   # replay un seul tag
make smoke-ssh                  # SSH dans la VM si besoin de debugger
make smoke-down                 # détruit la VM
```

Workflow concret : je modifie un rôle, `make smoke-replay` valide en deux minutes sur la VM, puis quand tout passe vert je lance `make play` sur le vrai laptop avec confiance. Si je casse quelque chose, ça casse la VM, pas mon environnement.

C'est l'équivalent d'avoir un environnement de staging pour son laptop — exagéré ? Peut-être. Mais le coût d'avoir un poste cassé un lundi matin avant un meeting, lui, n'est pas exagéré.

## Documenter les décisions : ADR même pour un projet perso

J'ai pris l'habitude de poser une **Architecture Decision Record** dès qu'une décision est structurante et coûteuse à revenir en arrière. Sur ce projet, l'ADR-0001 documente la migration vers mise : contexte, alternatives écartées, conséquences positives et négatives, plan de migration.

Pourquoi le faire sur un projet perso ? Parce que le moi-de-dans-six-mois ne se souvient pas du moi-d'aujourd'hui. Quand je rouvrirai le repo dans un an pour ajouter un outil, je veux que la trace explique pourquoi `vagrant` n'est **pas** dans mise — sinon je vais refaire l'erreur et m'arracher les cheveux sur le plugin libvirt.

## La repo elle-même est gérée en Terraform

Petit clin d'œil méta : le dossier `github-terraform/` contient le code Terraform qui gère les paramètres du dépôt GitHub lui-même — visibilité, branches protégées, règles de review, secrets Actions. Dans la même logique que mon homelab : si quelque chose est configurable, je préfère le coder plutôt que de cliquer dans une UI.

## Migration et compatibilité

Pour quiconque utilisait l'ancien projet `local-compute` (ou une version pré-mise de `laptop-bootstrap`), il y a deux tags à enchaîner dans cet ordre :

```bash
make play TAGS=cleanup-legacy   # désinstalle les outils installés à la main
make play TAGS=cli-tools        # réinstalle proprement via mise
exec bash                       # recharge le PATH pour utiliser les shims mise
```

Entre les deux, il y a une fenêtre de quelques minutes où certains outils (`starship`, `direnv`, `uv`, `kubectl`, `terraform`…) sont temporairement absents. C'est documenté en gros dans le README pour éviter la panique.

## Et la suite ?

Le projet est dans un état où je ne le touche que rarement — c'est précisément le but. Quelques pistes en tête malgré tout :

- **`chezmoi`** pour gérer les dotfiles versionnés (vimrc, configs SSH, themes terminal) en complément de mise pour les binaires.
- **Plus de tests dans le smoke harness** : aujourd'hui je vérifie juste que le playbook tourne en idempotent, je pourrais ajouter des `assert` métier (le binaire `kubectl` répond, Docker démarre, etc.).
- **GitHub Actions** pour rejouer le smoke test automatiquement à chaque PR — actuellement c'est local-only.
- **Un rôle `desktop`** pour les paramétrages GNOME/KDE quand je suis sur un laptop avec UI (raccourcis clavier, themes, extensions).

Le repo est public et sous licence MIT : [TiPunchLabs/laptop-bootstrap](https://github.com/TiPunchLabs/laptop-bootstrap). Si vous bricolez aussi votre propre poste avec Ansible, je suis curieux des choix différents que vous avez pu faire — l'idée n'est pas de dire "c'est la bonne façon", mais "voilà comment je l'ai faite, et pourquoi".
