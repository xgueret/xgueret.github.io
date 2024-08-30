+++
title= "Installation de Portainer avec Docker Compose : Configuration SSL Standard et Personnalisée"
date= "2024-08-30"
tags= [
    "Portainer", 
    "Docker", 
    "SSL", 
    ]
categories= [
    "tutorial",
    ]
+++

Portainer est un outil de gestion puissant et facile à utiliser pour Docker. Dans ce tutoriel, je me propose de vous guider à travers l'installation de Portainer en utilisant Docker Compose, en couvrant à la fois une installation standard et une configuration plus sécurisée avec des certificats auto-signés.

## Prerequisites

- Docker et Docker Compose installés sur votre système.
- OpenSSL installé pour générer des certificats auto-signés (optionnel).

---



## Partie 1 : Installation de Portainer



### Étape 1 : Créez le fichier `docker-compose.yml`

Tout d'abord, créez un répertoire pour Portainer puis créez un fichier `docker-compose.yml` à l'intérieur :

```bash
mkdir portainer && cd portainer
vim docker-compose.yml
```

Copiez et collez le contenu suivant dans le fichier :

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: always
    ports:
      - "9000:9000"   # Web UI access (HTTP)
      - "9443:9443"   # Web UI access (HTTPS)
      - "8000:8000"   # Edge Agent port
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - portainer_network

  agent:
    image: portainer/agent:latest
    container_name: portainer_agent
    restart: always
    environment:
      AGENT_CLUSTER_ADDR: tasks.agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    networks:
      - portainer_network

networks:
  portainer_network:

volumes:
  portainer_data:
```



### Étape 2 : Démarrez Portainer

Démarrez maintenant Portainer en utilisant Docker Compose :

```bash
docker-compose up -d
```



### Étape 3 : Accédez à Portainer

- Pour accéder à l'interface de Portainer via HTTP, allez à http://localhost:9000.
- Pour accéder à Portainer via HTTPS (avec le certificat auto-généré de Portainer), allez à https://localhost:9443. Vous pourriez voir un avertissement de sécurité car le certificat n'est pas signé par une autorité de certification reconnue.

## Partie 2 : Installation de Portainer avec des Certificats Auto-Signés

Si vous préférez utiliser vos propres certificats auto-signés pour sécuriser Portainer, suivez ces étapes.



### Étape 1 : Générez des Certificats Auto-Signés

Si vous n'avez pas déjà de certificats, vous pouvez les générer en utilisant OpenSSL :

```bash
openssl genrsa -out key.pem 2048
openssl req -new -key key.pem -out cert.csr
openssl x509 -req -days 365 -in cert.csr -signkey key.pem -out cert.pem
```

Cela créera deux fichiers :

- **`key.pem`** : La clé privée.
- **`cert.pem`** : Le certificat auto-signé.

Placez ces fichiers dans un répertoire dédié, tel que `/path/to/certs/`.



### Étape 2 : Modifiez le fichier `docker-compose.yml`

Ouvrez le fichier `docker-compose.yml` et modifiez-le pour utiliser vos certificats auto-signés :

```yaml
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: always
    ports:
      - "9000:9000"   # Web UI access (HTTP)
      - "9443:9443"   # Web UI access (HTTPS)
      - "8000:8000"   # Edge Agent port
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
      - /path/to/certs/cert.pem:/certs/portainer.crt   # Monter le certificat
      - /path/to/certs//key.pem:/certs/portainer.key    # Monter la clé privée
    networks:
      - portainer_network
    environment:
      - SSL_CERTIFICATE=/certs/portainer.crt   # Path to the certificate in the container
      - SSL_CERTIFICATE_KEY=/certs/portainer.key   # Path to the private key in the container
      
  agent:
    image: portainer/agent:latest
    container_name: portainer_agent
    restart: always
    environment:
      AGENT_CLUSTER_ADDR: tasks.agent
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/lib/docker/volumes:/var/lib/docker/volumes
    networks:
      - portainer_network

networks:
  portainer_network:

volumes:
  portainer_data:
```

:wink: Remplacez `/path/to/certs/` par le chemin réel où vos certificats sont stockés.



### Étape 3 : Démarrez Portainer

Démarrez Portainer en utilisant Docker Compose comme précédemment :

```bash
docker-compose up -d
```



### Étape 4 : Accédez à Portainer

Accédez à Portainer via HTTPS à https://localhost:9443. Votre certificat auto-signé sera utilisé pour sécuriser la connexion. Notez que vous verrez toujours un avertissement de sécurité dans le navigateur, mais la connexion sera cryptée.



## Conclusion

Vous avez maintenant installé avec succès :tada: **Portainer** en utilisant **Docker Compose**, soit avec les paramètres par défaut, soit avec vos propres certificats auto-signés.

<u>Ce tutoriel vous fournit une base solide pour gérer vos environnements Docker de manière efficace et sécurisée.</u>
