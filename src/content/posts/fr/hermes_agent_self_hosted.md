---
title: "Auto-héberger un agent IA persistant : Hermes Agent sur votre propre VM"
date: "2026-08-27"
author: "Xavier GUERET"
description: "Un tutoriel autonome pour faire tourner Hermes Agent sur votre propre VM — Proxmox, VPS ou hyperviseur local. Docker Compose, secrets, pare-feu, HTTPS, et les pièges qui laissent un déploiement vert alors que rien ne marche."
tags:
  - "Docker"
  - "Proxmox"
  - "Terraform"
  - "Ansible"
  - "ia"
  - "tutoriel"
  - "local-first"
categories:
  - "Tutoriels"
  - "DevOps"
  - "vibecoding"
image: "/images/posts/hermes_agent_self_hosted.png"
draft: false
toc: true
---

## Pourquoi auto-héberger un agent IA ?

J'utilise des assistants IA toute la journée, mais toujours dans une fenêtre de chat : je pose une question, je copie la réponse, je la colle ailleurs. L'agent n'a pas de mémoire entre deux sessions, pas d'accès à mes machines, et il ne fait rien pendant que je dors.

[Hermes Agent](https://github.com/nousresearch/hermes-agent) répond exactement à ce manque : un agent persistant, qui garde ses souvenirs, ses compétences et ses sessions **sur votre disque**, qu'on joint depuis Telegram ou depuis un tableau de bord web, et à qui on peut donner des outils.

L'objection évidente, c'est le GPU. Elle tombe si on sépare les deux moitiés du problème : **l'agent tourne chez vous, le modèle tourne ailleurs**. L'inférence part vers un endpoint compatible OpenAI — DeepSeek, Mistral, OpenAI, ou votre propre Ollama — et ce qui reste sur votre machine, c'est ce qui a de la valeur : la mémoire, les sessions, la configuration. Une VM de 4 cœurs et 8 Go de RAM suffit. Pas de carte graphique, pas de passthrough PCI.

Ce tutoriel est autonome. Il ne suppose ni homelab, ni Proxmox, ni Ansible : juste une VM Linux sur laquelle vous avez `sudo`.

---

## Ce qu'on va construire

Une VM qui fait tourner deux conteneurs — le *gateway* (le cerveau) et le *dashboard* (l'interface web) — partageant un volume de données, avec une couche de configuration que vous contrôlez et que l'agent ne peut pas réécrire.

```
                    votre VM
      ┌───────────────────────────────────────┐
      │  UFW : 22/tcp, le reste fermé         │
      │                                       │
      │   hermes (gateway)   127.0.0.1:8642   │
      │   hermes-dashboard   127.0.0.1:9119   │
      │        │                              │
      │        ├── /opt/hermes/managed  →  /etc/hermes:ro
      │        │     ├── config.yaml   ← vous
      │        │     └── .env          ← vous (secrets)
      │        │                              │
      │        └── /opt/hermes/data    →  /opt/data
      │              └── memories/ skills/ sessions/  ← l'agent
      └───────────────────┬───────────────────┘
                          │ HTTPS
                          ▼
              endpoint compatible OpenAI
         (DeepSeek, Mistral, OpenAI, Ollama…)
```

Les étapes 1 à 5 donnent un agent fonctionnel, joignable par tunnel SSH. Les étapes 6 et 7 sont **optionnelles** : elles ajoutent un nom de domaine, du HTTPS et un DNS interne, si vous voulez y accéder depuis vos autres machines.

**Prérequis :**

- Une VM Linux — Ubuntu 24.04 ou Debian 13 — avec **4 vCPU, 8 Go de RAM, 32 Go de disque**, et un accès `sudo`
- Une clé API chez un fournisseur exposant un endpoint **compatible OpenAI**
- Environ 30 minutes, dont l'essentiel en attente du premier `docker pull`

Dans tous les exemples, `<IP_VM>` désigne l'adresse de cette VM et `<IP_PROXY>` celle de votre reverse proxy, si vous en avez un. Remplacez-les.

---

## Étape 1 : la machine

Deux chemins. Prenez celui qui correspond à ce que vous avez sous la main — ils convergent sur la même chose : une VM Ubuntu 24.04 avec une IP fixe et votre clé SSH.

### Option A — sur Proxmox, avec Terraform

Si vous avez un nœud Proxmox VE et un template cloud-init, cette ressource suffit. Elle est complète : pas de module, rien à installer d'autre que le provider.

```hcl
terraform {
  required_version = ">= 1.11.0"
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = ">= 0.93.0, < 1.0.0"
    }
  }
}

resource "proxmox_virtual_environment_vm" "hermes" {
  name      = "hermes"
  node_name = "pve"          # le nom de votre nœud
  vm_id     = 9030
  on_boot   = true           # l'agent tourne 24/7

  clone {
    vm_id = 9001             # votre template cloud-init
    full  = true
  }

  agent {
    enabled = true
    timeout = "1s"
  }

  cpu {
    cores = 4
    type  = "host"
  }

  memory {
    dedicated = 8192
    floating  = 2048         # ballooning : rend la RAM inutilisée au nœud
  }

  # Sans ce contrôleur, Proxmox accepte iothread et l'ignore en silence
  scsi_hardware = "virtio-scsi-single"

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = 32
    file_format  = "raw"
    discard      = "on"
    ssd          = true
    iothread     = true
  }

  network_device {
    bridge   = "vmbr0"
    model    = "virtio"
    firewall = true
  }

  initialization {
    dns {
      servers = ["1.1.1.1"]
    }
    ip_config {
      ipv4 {
        address = "192.168.1.30/24"
        gateway = "192.168.1.1"
      }
    }
    user_account {
      username = "ansible"
      keys     = [trimspace(file("~/.ssh/id_rsa.pub"))]
    }
  }

  startup {
    order      = 10
    up_delay   = 30
    down_delay = 60
  }
}
```

Deux détails qui coûtent cher à réapprendre :

**`scsi_hardware = "virtio-scsi-single"`** n'est pas de la décoration. Sans ce contrôleur, Proxmox accepte le paramètre `iothread = true` et l'ignore, sans le moindre avertissement. Vous croyez avoir activé une optimisation qui n'existe pas.

**Le disque à 32 Go** est volontairement petit : agrandir plus tard est non destructif (`qm resize` puis `growpart`), l'inverse ne l'est pas. Autant partir serré.

```bash
terraform init
terraform apply
```

> **Attention** : modifier le bloc `initialization {}` d'une VM **déjà démarrée** ne change **rien** dans l'invité. `terraform plan` annonce un `update in-place`, l'applique, et déclare le succès — mais cloud-init ne rend `/etc/netplan/50-cloud-init.yaml` qu'au tout premier boot et ne le relit jamais. Votre IaC déclare la conformité pendant que la machine dit le contraire. Pour forcer une reconstruction :
>
> ```bash
> terraform apply -replace='proxmox_virtual_environment_vm.hermes'
> ```

### Option B — n'importe quelle autre VM

VPS chez un hébergeur, VM VirtualBox ou libvirt sur votre poste, instance cloud, machine physique : tout convient. Il vous faut :

- Ubuntu 24.04 ou Debian 13 fraîchement installé
- 4 vCPU, 8 Go de RAM, 32 Go de disque (l'agent tient dans moins, mais les sessions et les journaux grossissent)
- Un accès SSH par clé, et `sudo`
- Une adresse IP stable

Rien de ce qui suit n'est spécifique à Proxmox. Passez directement à l'étape 2.

> 💡 Sur un VPS exposé sur Internet, ne sautez **pas** l'étape 5 : le tableau de bord ne doit jamais écouter sur une interface publique sans pare-feu devant.

---

## Étape 2 : Docker, avec un plafond sur les journaux

Installation standard depuis le dépôt officiel :

```bash
# Prérequis et clé du dépôt
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Dépôt
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

Puis **la** configuration à ne pas oublier :

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

Le driver `json-file` par défaut ne borne **ni** la taille **ni** le nombre de fichiers. Un agent qui tourne 24/7, avec des sessions et des sous-agents, écrit beaucoup. Sans plafond, `/` se remplit sans le moindre avertissement — et sur un disque de 32 Go, ça arrive plus vite qu'on ne croit. Avec cette configuration, chaque conteneur est plafonné à 30 Mo.

```bash
docker --version && docker compose version
```

---

## Étape 3 : la stack Hermes

### L'arborescence

Trois répertoires, et leurs permissions comptent autant que leur existence :

```bash
sudo mkdir -p /opt/hermes/data /opt/hermes/managed

# Volume de l'agent : il y écrit, en UID 1000
sudo chown 1000:1000 /opt/hermes/data
sudo chmod 700 /opt/hermes/data

# Votre couche de configuration : root la possède, l'agent la lit
sudo chown root:1000 /opt/hermes/managed
sudo chmod 750 /opt/hermes/managed
```

On obtient :

```
/opt/hermes/
├── docker-compose.yml
├── data/                  # l'agent écrit ici — UID 1000
│   └── memories/ skills/ sessions/
└── managed/               # vous écrivez ici — root, monté en lecture seule
    ├── config.yaml
    └── .env
```

Le conteneur tourne en interne sous un utilisateur dédié ; `PUID`/`PGID` le remappent sur le propriétaire du volume côté hôte. Sans ça, les fichiers écrits par l'agent seraient illisibles depuis la VM.

### Le fichier Compose

```yaml
# /opt/hermes/docker-compose.yml
services:
  gateway:
    image: nousresearch/hermes-agent:v2026.8.18
    container_name: hermes
    restart: unless-stopped
    network_mode: host
    volumes:
      - /opt/hermes/data:/opt/data
      - /opt/hermes/managed:/etc/hermes:ro
      # Utile seulement si vos services internes utilisent une CA privée — voir étape 6
      - /etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro
    environment:
      - PUID=1000
      - PGID=1000
    command: ["gateway", "run"]
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"

  dashboard:
    image: nousresearch/hermes-agent:v2026.8.18
    container_name: hermes-dashboard
    restart: unless-stopped
    depends_on:
      - gateway
    network_mode: host
    volumes:
      - /opt/hermes/data:/opt/data
      - /opt/hermes/managed:/etc/hermes:ro
      - /etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro
    environment:
      - PUID=1000
      - PGID=1000
    command:
      - "dashboard"
      - "--host"
      - "127.0.0.1"       # loopback par défaut — voir étape 6 pour l'exposer
      - "--port"
      - "9119"
      - "--no-open"
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

Le tag d'image est **épinglé**. Un agent qui se met à jour tout seul pendant que vous dormez est un agent dont vous ne pouvez plus expliquer le comportement.

Les plafonds de ressources ne sont pas cosmétiques non plus : un agent parti en boucle ne doit pas emporter la VM avec lui.

### Pourquoi `network_mode: host`

Le dépôt amont propose deux variantes de Compose. Elles ne sont **pas** équivalentes, et le choix a des conséquences de sécurité :

| | `network_mode: host` | bridge + `ports:` |
|---|---|---|
| Règles NAT Docker | aucune | créées |
| UFW | s'applique normalement | **contourné** |
| Résolution des noms locaux | héritée de l'hôte | non héritée |

Docker insère ses règles DNAT **avant** celles d'UFW dans la chaîne netfilter. Publier un port avec `ports:` l'expose à tout le réseau pendant que `ufw status` continue d'afficher `deny`. Un feu vert qui ment — la pire catégorie de configuration.

Le mode `host` a un second effet, utile : les conteneurs partagent la pile réseau de la VM. Ils résolvent donc les noms exactement comme elle, et un **Ollama tournant sur la même machine** est joignable en `http://127.0.0.1:11434/v1` sans autre réglage.

---

## Étape 4 : la configuration et les secrets

C'est l'étape qui mérite le plus d'attention, parce qu'elle décide de **qui possède quoi** entre vous et l'agent.

### `config.yaml` — le fournisseur d'inférence

```yaml
# /opt/hermes/managed/config.yaml
providers:
  deepseek:
    name: DeepSeek
    base_url: https://api.deepseek.com/v1
    key_env: DEEPSEEK_API_KEY
    default_model: deepseek-v4-flash

model:
  provider: deepseek
  default: deepseek-v4-flash
```

`key_env` ne porte que le **nom** de la variable d'environnement — jamais la valeur. Les secrets vivent dans `.env`, et nulle part ailleurs.

N'importe quel endpoint compatible OpenAI se déclare sur ce modèle. Quelques exemples :

| Fournisseur | `base_url` |
|---|---|
| DeepSeek | `https://api.deepseek.com/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Mistral | `https://api.mistral.ai/v1` |
| Ollama, sur la même VM | `http://127.0.0.1:11434/v1` |

### `.env` — les secrets

```bash
# /opt/hermes/managed/.env
DEEPSEEK_API_KEY=sk-votre-cle

# API du gateway : fermée au pare-feu, la clé reste une défense en profondeur
API_SERVER_ENABLED=true
API_SERVER_KEY=<openssl rand -hex 32>

# Authentification du tableau de bord
HERMES_DASHBOARD_BASIC_AUTH_USERNAME=admin
HERMES_DASHBOARD_BASIC_AUTH_PASSWORD=<votre mot de passe>
HERMES_DASHBOARD_BASIC_AUTH_SECRET=<openssl rand -base64 32>

# Optionnel — Telegram
TELEGRAM_BOT_TOKEN=<jeton BotFather>
TELEGRAM_ALLOWED_USERS=<votre identifiant numérique Telegram>
```

Puis, impérativement :

```bash
sudo chown root:1000 /opt/hermes/managed/config.yaml /opt/hermes/managed/.env
sudo chmod 640 /opt/hermes/managed/config.yaml /opt/hermes/managed/.env
```

`0640 root:1000` plutôt que le `0644` de la documentation amont : Hermes ne contrôle aucun mode de fichier, seul l'OS décide. L'agent lit par le groupe et **ne peut pas réécrire** ces fichiers.

> `HERMES_DASHBOARD_BASIC_AUTH_SECRET` sert à signer les jetons de session. Sans lui, vos sessions ne survivent pas au redémarrage du conteneur — vous vous reconnectez à chaque fois sans comprendre pourquoi.

> ⚠️ **La liste blanche Telegram n'est pas optionnelle** si vous activez Telegram. Sans `TELEGRAM_ALLOWED_USERS`, le gateway journalise « No env user allowlists configured » et retombe sur l'appairage : ça marche, mais la porte reste ouverte à quiconque connaît le bot tant que personne n'a appairé.

### La frontière entre votre automatisation et l'agent

Voilà pourquoi tout est dans `managed/` et rien dans `data/`.

Hermes possède une couche de configuration dite **managed scope** : le répertoire monté sur `/etc/hermes`, dont les clés sont fusionnées **par-dessus** celles du `config.yaml` du volume de données, et qui gagnent **à la feuille**.

| | Propriétaire | Application |
|---|---|---|
| `/opt/hermes/managed/{config.yaml,.env}` | vous | `root:1000`, mode `0640`, monté `:ro` |
| `/opt/hermes/data/**` | l'agent | inscriptible par l'UID 1000 |

La frontière n'est pas une convention documentée, c'est une propriété du système de fichiers. Vous épinglez `model.provider` sans toucher à `model.default` ni à `platforms:`, que l'agent et ses assistants de configuration écrivent de leur côté :

```
model.provider  : deepseek                          ← épinglé par vous
model.default   : modele-utilisateur                ← la valeur de l'agent survit
platforms       : {"telegram": {"enabled": true}}   ← intact
```

**C'est une frontière par clé, pas par fichier.** La distinction paraît théorique jusqu'au jour où elle vous coûte une panne.

Ma première version traçait la frontière par fichier : mon automatisation possédait tout `config.yaml` et nettoyait le `.env` du volume, au motif qu'il était « supplanté ». Ça a tenu tant que les autres écrivains touchaient les *mêmes* clés — écraser était alors le comportement correct. Ça a cassé au premier écrivain qui a ajouté une clé *différente* : l'assistant de configuration Telegram écrivait son jeton dans le volume, une clé que ma couche ne portait pas. Le nettoyage l'a emporté. L'agent a cessé de répondre sur Telegram — sans erreur, sans trace, l'adaptateur ne démarrait simplement plus. **Le déploiement, lui, était entièrement vert.**

La règle qui en sort tient en une phrase : **ne supprimez jamais en bloc un fichier dans lequel l'agent écrit aussi.** Si une clé doit devenir inviolable, ajoutez-la à votre couche managed — n'effacez pas le fichier de l'agent. Un `.env` résiduel dans le volume est sans danger : votre couche est fusionnée par-dessus et gagne.

> ⚠️ **Le mode du répertoire est le paramètre critique.** Si l'agent ne peut pas *traverser* `/etc/hermes`, `stat()` échoue et Hermes retourne `None` en commentant la valeur `# absent`. Aucun journal, aucune erreur : votre configuration n'est simplement plus appliquée. Un fichier illisible produit un avertissement bruyant ; un répertoire intraversable est muet. D'où le `0750 root:1000` de l'étape 3 — traversable par le groupe de l'agent, inscriptible par personne d'autre que root.

Ce mode d'échec est silencieux : il faut donc le tester explicitement, et pas une seule fois. Après chaque changement de configuration :

```bash
docker exec -u 1000 hermes python3 -c \
  'from hermes_cli import managed_scope as ms; \
   ms.invalidate_managed_cache(); \
   print(sorted(ms.managed_config_keys()))'
```

Si `model.provider` n'apparaît pas dans la liste, votre couche n'est pas appliquée — quoi qu'en dise le reste.

---

## Étape 5 : démarrer et verrouiller

```bash
cd /opt/hermes
sudo docker compose up -d
sudo docker compose ps
```

Puis le pare-feu, avant toute chose :

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status numbered
```

Le sortant reste en `allow` : c'est par là que part l'inférence, en HTTPS. Rien d'autre n'a besoin d'être ouvert à ce stade — le tableau de bord écoute sur `127.0.0.1`.

Pour y accéder depuis votre poste, un tunnel SSH suffit :

```bash
ssh -L 9119:127.0.0.1:9119 votre-user@<IP_VM>
# puis http://localhost:9119 dans le navigateur
```

C'est la configuration la plus sûre, et elle se suffit à elle-même. Si ça vous convient, vous avez terminé : passez aux vérifications.

---

## Étape 6 (optionnelle) : un nom de domaine et du HTTPS

Le tunnel SSH devient vite pénible si vous consultez l'agent depuis plusieurs machines. La suite met un reverse proxy devant.

### Exposer le tableau de bord au proxy, et à lui seul

Changez le bind dans le Compose :

```yaml
    command:
      - "dashboard"
      - "--host"
      - "0.0.0.0"
      - "--port"
      - "9119"
      - "--no-open"
```

Puis **restreignez à la source** :

```bash
sudo ufw allow from <IP_PROXY> to any port 9119 proto tcp comment 'dashboard via proxy'
sudo docker compose up -d
```

Le `from <IP_PROXY>` est le cœur de la règle. Ouvrir le port 9119 à tout le réseau annulerait l'intérêt du proxy : un TLS et une authentification centralisés ne servent à rien si on peut les contourner en tapant l'IP et le port.

> Le tableau de bord **refuse de démarrer** sur une interface non-loopback si aucun fournisseur d'authentification n'est enregistré. C'est un bon comportement — mais le message d'erreur ne dit pas « allez remplir votre `.env` ». Si vous avez sauté les trois variables `HERMES_DASHBOARD_*` de l'étape 4, c'est maintenant que ça se voit.

### Le vhost côté proxy

Avec Caddy, la configuration tient en trois lignes, certificat Let's Encrypt compris :

```
agent.example.com {
    reverse_proxy <IP_VM>:9119
}
```

Ajoutez ensuite ceci dans `config.yaml`, pour que les redirections pointent sur l'URL publique et non sur l'adresse d'écoute réelle :

```yaml
dashboard:
  public_url: "https://agent.example.com"
```

> Ordre des opérations : créez la règle UFW **avant** de publier le vhost. Dans l'autre sens, votre proxy annonce un service qu'il ne peut pas joindre, et vous débuguez le proxy alors que le problème est dans le pare-feu.

### Si votre proxy utilise une CA privée

Sur un domaine interne (pas de Let's Encrypt), votre proxy sert probablement du TLS signé par une **autorité privée** — celle que Caddy génère automatiquement, par exemple. Pour que l'agent puisse joindre vos autres services internes sans `-k`, la VM **et les conteneurs** doivent faire confiance à cette autorité.

```bash
# Le certificat racine de votre CA, récupéré depuis le proxy
sudo cp root.crt /usr/local/share/ca-certificates/interne.crt
sudo update-ca-certificates
```

C'est le bundle système `/etc/ssl/certs/ca-certificates.crt` qui est mis à jour — celui-là même que le Compose de l'étape 3 monte dans les conteneurs, au chemin qu'ils lisent déjà. Un `docker compose up -d` suffit à propager.

Ce montage est préféré aux variables `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE` ou `NODE_EXTRA_CA_CERTS` pour une raison simple : chacune ne couvre **qu'une** bibliothèque, et laquelle compte dépend de l'implémentation du client HTTP. Le chemin, lui, est lu par toutes.

Deux pièges à ne pas réapprendre :

**L'extension est significative.** `update-ca-certificates` ne ramasse que les fichiers en **`.crt`**. Un `.pem` déposé dans ce répertoire est ignoré silencieusement : pas d'erreur, pas d'effet.

**Ne cherchez pas le sujet avec `grep`.** Le bundle est une concaténation de blocs PEM en base64 : le CN n'apparaît **nulle part** en clair. `grep "Mon Autorité"` renvoie 0 même quand la CA est parfaitement installée. Il faut décoder d'abord :

```bash
openssl crl2pkcs7 -nocrl -certfile /etc/ssl/certs/ca-certificates.crt \
  | openssl pkcs7 -print_certs -noout | grep -c 'Mon Autorité'
```

Enfin, vérifiez les **deux** côtés depuis le conteneur — pas seulement celui qui vous intéresse :

```bash
docker exec -u 1000 hermes python3 - <<'EOF'
import urllib.request
for url in ("https://un-service.interne/", "https://api.deepseek.com/"):
    try:
        urllib.request.urlopen(url, timeout=10)
        print("ok      ", url)
    except Exception as exc:
        print("ÉCHEC   ", url, exc)
EOF
```

La première sonde seule ne suffirait pas : monter le bundle de l'hôte par-dessus celui du conteneur peut très bien apporter votre CA privée **tout en retirant** une CA publique. L'inférence tomberait, avec une cause parfaitement non évidente.

---

## Étape 7 (optionnelle) : le DNS interne, et le piège du « résolveur de secours »

Ne lisez cette étape que si votre agent doit résoudre des noms internes — un service en `.lan`, `.internal`, ou votre domaine privé. Elle documente une panne qui n'a rien de spécifique à Hermes et que beaucoup de monde s'inflige.

Le réflexe naturel, quand on a un DNS interne, c'est de le déclarer avec un secours public :

```
DNS=192.168.1.71 1.1.1.1
```

**Ce n'est pas un repli sûr.** C'est une liste de bascule **aveugle au domaine, et collante** :

- un seul timeout du résolveur interne déplace la résolution vers `1.1.1.1`, **définitivement** ;
- depuis là, vos noms internes renvoient **NXDOMAIN** — une réponse *valide*, donc rien ne revient jamais en arrière ;
- rien ne tombe. Aucune alerte. Seuls les noms internes disparaissent, en silence.

Je l'ai vécu : un matin, plus aucun nom interne ne résolvait depuis la VM. Le serveur DNS interne allait parfaitement bien — une requête directe répondait correctement. `systemd-resolved` avait simplement basculé sur son second serveur et y était resté.

Et `systemd-resolved` ne peut pas régler ça seul : le routage par domaine (`Domains=~internal`) exige des serveurs DNS **par lien**, ce qu'une VM à interface unique alimentée par cloud-init ne peut pas offrir. Le routage doit donc vivre ailleurs. **dnsmasq** en résolveur local fait le travail :

```
        avant (cassé)                          après
   ┌──────────────────┐                 ┌──────────────────┐
   │ systemd-resolved │  bascule        │ systemd-resolved │
   │  DNS interne     │  collante       │    127.0.0.1     │  upstream unique
   │  1.1.1.1         │  → part et      └────────┬─────────┘  → plus de logique
   └──────────────────┘    ne revient            │               de bascule
                           jamais       ┌────────▼─────────┐
                                        │     dnsmasq      │
                                        │ .internal → DNS interne (épinglé)
                                        │ le reste  → 1.1.1.1 / 8.8.8.8
                                        └──────────────────┘
```

```bash
sudo apt-get install -y dnsmasq

sudo tee /etc/dnsmasq.d/interne.conf > /dev/null <<'EOF'
# Épinglé par domaine : ne retombe JAMAIS sur un résolveur public
server=/internal/192.168.1.71
server=1.1.1.1
server=8.8.8.8
listen-address=127.0.0.1
bind-interfaces
EOF

sudo systemctl restart dnsmasq

# PROUVER qu'il répond, AVANT de rediriger le système vers lui
dig +short un-service.internal @127.0.0.1
```

Cette vérification est le garde-fou de toute l'étape. Tant qu'elle n'a pas répondu, ne touchez pas à netplan : si vous redirigez le système vers un dnsmasq muet, vous perdez toute résolution, y compris celle qui vous permettrait de télécharger de quoi réparer.

```bash
sudo tee /etc/netplan/99-dns-local.yaml > /dev/null <<'EOF'
network:
  version: 2
  ethernets:
    eth0:                      # adaptez le nom de l'interface
      nameservers:
        addresses: [127.0.0.1]
EOF

sudo chmod 600 /etc/netplan/99-dns-local.yaml
sudo netplan apply

# Vérifier par le VRAI chemin (nsswitch → resolved → dnsmasq), pas par dig
getent hosts un-service.internal
```

`getent` et non `dig` : `dig` interroge directement le serveur et court-circuite `resolved`. Il vous dirait que tout va bien alors que les applications, elles, ne résolvent rien.

Le compromis assumé : `server=/internal/` est épinglé par domaine et ne retombe **jamais** sur un résolveur public. Si votre DNS interne tombe, les noms internes deviennent *indisponibles* au lieu de devenir *faussement NXDOMAIN*. Une panne bruyante plutôt qu'une panne silencieuse — c'est exactement ce qu'on cherche.

Rollback, si besoin : `sudo rm /etc/netplan/99-dns-local.yaml && sudo netplan apply`.

---

## Vérifier que tout tient debout

```bash
# Les deux conteneurs tournent
sudo docker compose -f /opt/hermes/docker-compose.yml ps

# Les ports écoutent là où vous croyez
sudo ss -tlnp | grep -E "8642|9119"

# Le pare-feu dit bien ce que vous pensez
sudo ufw status numbered

# Le fournisseur d'inférence a réellement été résolu
sudo docker exec hermes hermes status
#   Model:     deepseek-v4-flash
#   Provider:  DeepSeek
#   DeepSeek   ✓ sk-d...
```

La dernière est la plus importante des quatre, et le dépannage ci-dessous explique pourquoi.

---

## Dépannage

### L'agent répond, mais ignore votre fournisseur

Un bloc `providers:` malformé ne lève **aucune erreur** : Hermes retombe silencieusement sur le fournisseur `auto`. L'agent continue de répondre, avec un autre modèle, sans rien signaler. Vérifiez toujours ce qui a été réellement résolu avec `hermes status` — c'est le seul contrôle qui distingue « ça marche » de « ça marche comme prévu ».

### `hermes status` affiche `.env file: ✗ not found`

**Attendu, ce n'est pas une panne.** Cette ligne rapporte le `.env` de *portée utilisateur*, celui du volume de données — que cette conception laisse volontairement vide : vos secrets sont dans la couche managed. Ce qui compte, ce sont les deux lignes en dessous :

```
  .env file:    ✗ not found        <- normal
  Model:        deepseek-v4-flash
  Provider:     DeepSeek           <- c'est ça qui prouve que la clé a été résolue
```

Un vrai problème a une autre tête : `Provider` qui retombe sur `auto`, ou votre fournisseur affiché `✗ (not set)` sous **API Keys**.

### Le conteneur du tableau de bord refuse de démarrer

```
Refusing to bind dashboard to 0.0.0.0 — the auth gate engages on
non-loopback binds, but no auth providers are registered.
```

Les trois variables `HERMES_DASHBOARD_*` sont absentes ou vides. Retour à l'étape 4.

### Votre configuration ne semble pas prise en compte

Rejouez le contrôle de la couche managed (fin de l'étape 4). Si `model.provider` n'apparaît pas dans les clés épinglées, vérifiez le mode du répertoire : `/opt/hermes/managed` doit être **traversable** par le groupe de l'agent (`0750 root:1000`). C'est le mode d'échec le plus silencieux de tout ce tutoriel.

### Le disque se remplit

Vérifiez que `/etc/docker/daemon.json` est bien en place et que Docker a été redémarré depuis :

```bash
docker inspect hermes --format '{{ .HostConfig.LogConfig }}'
```

Les conteneurs créés **avant** le redémarrage du démon gardent leur ancienne configuration de journalisation. Il faut les recréer.

---

## Aller plus loin : rendre tout ça rejouable

Ce tutoriel décrit des gestes manuels, et c'est très bien pour comprendre. Mais un agent auto-hébergé est un service de production comme un autre : le jour où la VM meurt, vous voudrez le reconstruire sans relire cet article.

C'est exactement ce que fait le sous-projet [`hermes/`](https://github.com/TiPunchLabs/homelab/tree/main/hermes) de mon monorepo [TiPunchLabs/homelab](https://github.com/TiPunchLabs/homelab), que j'ai utilisé comme référence pour écrire ce guide. Chaque étape ci-dessus y correspond à un rôle Ansible idempotent :

| Étape de ce tutoriel | Rôle |
|---|---|
| 1 — la machine | `terraform/` |
| 2 — Docker + journaux | `docker` |
| 3, 4, 5 — la stack, la configuration, le pare-feu | `hermes_agent`, `security_hardening` |
| 6 — la CA privée | `internal_ca_trust` |
| 7 — le DNS | `dns_resolver` |

Les secrets y passent par Ansible Vault plutôt que par un `.env` écrit à la main, et chaque garde-fou décrit ici — le mode du répertoire, les deux sondes TLS, la résolution effective du fournisseur — y est une **assertion** jouée à chaque déploiement, pas une ligne de documentation. C'est la différence entre un piège dont on se souvient et un piège qui ne peut plus se refermer.

### À quoi ça ressemble en production

Chez moi, cette stack tourne sur une VM Proxmox de 4 cœurs, derrière un **Caddy** qui termine le TLS avec une CA interne, avec un **Pi-hole** qui porte les noms `.internal` et un agent **Komodo** qui observe les conteneurs — socket Docker monté en lecture seule, donc il voit tout et ne peut rien piloter. Autrement dit : les étapes 6 et 7 de ce tutoriel, jouées pour de vrai, plus une console d'observabilité à qui on refuse délibérément le droit d'agir.

Trois README du dépôt vont plus loin que ce qu'un article pouvait porter, si vous voulez creuser :

- [`roles/dns_resolver/`](https://github.com/TiPunchLabs/homelab/blob/main/hermes/ansible/roles/dns_resolver/README.md) — le modèle mental de la bascule collante, pourquoi `systemd-resolved` ne peut pas s'en sortir seul, et pourquoi l'ordre des tâches est lui-même un garde-fou
- [`roles/internal_ca_trust/`](https://github.com/TiPunchLabs/homelab/blob/main/hermes/ansible/roles/internal_ca_trust/README.md) — les quatre sondes qui prouvent la confiance TLS, côté hôte **et** côté conteneur, et pourquoi le certificat racine est commité dans le dépôt
- [`roles/komodo_periphery/`](https://github.com/TiPunchLabs/homelab/blob/main/hermes/ansible/roles/komodo_periphery/README.md) — l'observabilité en lecture seule, et la clé d'onboarding à usage unique qui se consomme au premier contact

Prenez-les comme une implémentation de référence, pas comme un modèle à copier : les adresses, les noms d'hôtes et le découpage en sous-projets sont les miens. Ce qui se transpose, ce sont les décisions.

---

## Le rôle du vibecoding dans ce projet

L'implémentation de référence — cinq rôles Ansible, leurs templates Jinja, la gestion des permissions, les handlers, les `wait_for` — a été écrite en grande partie en vibecoding avec **Claude Code**. Les tâches mécaniques s'y prêtent très bien.

Ce qui n'est pas venu de l'IA, c'est le diagnostic. La bascule collante de `systemd-resolved` a été trouvée en lisant `man resolved.conf` et en corrélant l'heure d'un timeout avec la disparition des noms internes. La frontière par clé plutôt que par fichier est née d'une panne réelle — un jeton effacé par un déploiement entièrement vert — et c'est en comprenant *pourquoi* le motif de la tâche était faux qu'on a su quoi corriger. L'IA écrit très bien la tâche qu'on lui décrit ; elle ne sait pas que la description est fausse.

Les décisions de conception, aussi, sont restées de mon côté : refuser le mode bridge malgré sa simplicité apparente, exiger que chaque garde-fou soit **prouvé** par une assertion plutôt que documenté, et accepter une panne bruyante plutôt qu'un repli silencieux sur le DNS.

---

## Ce que ça change au quotidien

L'agent tourne en continu. Je le joins depuis Telegram quand je suis loin de mon poste, et depuis le tableau de bord quand j'ai besoin de voir ses sessions. Il garde ses souvenirs entre deux conversations, ce qui change complètement le rapport à l'outil : plus besoin de réexpliquer le contexte à chaque fois.

Un dernier point, et il vaut pour vous aussi : **`/opt/hermes/data` est le seul répertoire dont la perte est irréversible.** Mémoire, compétences, sessions, tâches planifiées. Tout le reste de ce tutoriel se rejoue en trente minutes. Sauvegardez-le dès le premier jour — un `tar` quotidien dans un cron suffit à commencer :

```bash
sudo tar czf /var/backups/hermes-$(date +%F).tar.gz -C /opt/hermes data
```

Si vous montez la même chose chez vous, les retours m'intéressent — surtout ceux qui commencent par « chez moi ça a cassé autrement ».
