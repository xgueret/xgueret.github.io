+++
title= "Mise en place d'Open-WebUI avec Ollama et LLaMA 3"
date= "2024-08-31"
author= "Xavier GUERET"
categories= [ "tutorial"]
tags= [
  "Docker",
  "Open-WebUI",
  "Ollama",
  "LLaMA 3"
]
+++

## Pré-requis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés :

1. **Docker** : [Documentation d'installation Docker](https://docs.docker.com/get-docker/)
2. **Docker Compose** : [Documentation d'installation Docker Compose](https://docs.docker.com/compose/install/)
3. **Ollama** : [Documentation d'installation Ollama](https://ollama.com)
4. **LLaMA 3** : Suivez les instructions de [la documentation d'Ollama pour intégrer LLaMA 3](https://ollama.com/docs) ou obtenez le modèle LLaMA 3 via Ollama

## Étape 1: Configurer le service Ollama avec systemd

Ollama est généralement installé avec une configuration systemd préexistante. Cependant, pour que la stack fonctionne correctement, vous devez ajouter une ligne spécifique à la configuration existante.

1. Modifiez le fichier de service systemd pour Ollama :

    ```bash
    sudo nano /etc/systemd/system/ollama.service
    ```

2. Ajoutez la ligne suivante sous la section `[Service]` pour définir l'adresse et le port d'écoute de Ollama :

    ```ini
    Environment="OLLAMA_HOST=0.0.0.0:11434"
    ```

    **Remarque :** Cette ligne configure Ollama pour écouter sur toutes les interfaces réseau (`0.0.0.0`) sur le port `11434`, permettant à Open-WebUI d'accéder à Ollama via l'adresse définie dans `OLLAMA_BASE_URL`.

3. Rechargez la configuration de systemd pour appliquer les modifications et redémarrez le service Ollama :

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart ollama
    ```

## Étape 2: Configurer Docker Compose pour Open-WebUI

1. Créez un répertoire pour votre configuration Docker Compose. Par exemple :

    ```bash
    mkdir -p /path/to/your/open-webui
    ```

2. Dans ce répertoire, créez un fichier `docker-compose.yml` avec le contenu suivant :

    ```yaml
    version: '3.8'

    services:
      open-webui:
        image: ghcr.io/open-webui/open-webui:main
        container_name: open-webui
        ports:
          - "3000:8080"
        volumes:
          - open-webui:/app/backend/data
        extra_hosts:
          - "host.docker.internal:host-gateway"
        restart: always
        environment:
          - OLLAMA_BASE_URL=http://host.docker.internal:11434

    volumes:
      open-webui:
    ```

3. Démarrez les services avec Docker Compose :

    ```bash
    cd /path/to/your/open-webui
    docker-compose up -d
    ```

    *Remarque :* Exécutez la commande `docker-compose` sans `sudo` si votre utilisateur fait partie du groupe Docker. Sinon, utilisez `sudo` pour les commandes Docker.

## Explication du Choix de `extra_hosts`

La directive `extra_hosts` permet d'ajouter des entrées dans le fichier `/etc/hosts` du conteneur Docker. Voici l'entrée ajoutée :

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

**Pourquoi utiliser cette configuration ?**

1. **Accès aux Services Hôtes** : Cette configuration permet au conteneur Docker de résoudre `host.docker.internal` comme l'adresse IP de la machine hôte. Cela est utile pour accéder à  des services ou applications en cours d'exécution sur l'hôte, comme  Ollama dans ce cas.
2. **Compatibilité avec les Réseaux Docker** : `host.docker.internal` résout les problèmes de connectivité entre les conteneurs et les  services sur l'hôte. Cela fonctionne sur plusieurs systèmes  d'exploitation, facilitant la connexion entre les services conteneurisés et les services hôtes.
3. **Facilité de Configuration** : Utiliser `host.docker.internal` évite d'avoir à configurer l'adresse IP spécifique de l'hôte, simplifiant la gestion de la connectivité réseau.

## Étape 3: Vérifier l’installation

Pour vérifier que les services sont en cours d'exécution :

- **Ollama :**

  ```bash
  sudo systemctl status ollama
  ```

- **Open-WebUI :**

  Ouvrez un navigateur web et accédez à `http://localhost:3000`. Vous devriez voir l'interface Open-WebUI.

## Conclusion

Vous avez maintenant une configuration fonctionnelle d'Open-WebUI avec Ollama et LLaMA 3.
