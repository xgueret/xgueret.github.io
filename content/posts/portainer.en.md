+++
title= "Installing Portainer with Docker Compose: Standard and Custom SSL Setup"
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

Portainer is a powerful and easy-to-use management tool for Docker. In this tutorial, we will guide you through the installation of Portainer using Docker Compose, covering both a standard installation and a more secure setup with self-signed certificates.

## Prerequisites

- Docker and Docker Compose installed on your system.
- OpenSSL installed for generating self-signed certificates (optional).

---



## Part 1: Installing Portainer Without Custom SSL Certificates



### Step 1: Create the `docker-compose.yml` File

First, create a directory for Portainer and then create a `docker-compose.yml` file within it:

```bash
mkdir portainer && cd portainer
vim docker-compose.yml
```

Copy and paste the following content into the file:

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



### Step 2: Start Portainer

Now, start Portainer using Docker Compose:

```bash
docker-compose up -d
```



### Step 3: Access Portainer

- To access the Portainer UI via HTTP, navigate to http://localhost:9000.
- To access Portainer via HTTPS (with Portainer's auto-generated certificate), go to https://localhost:9443. You may see a security warning because the certificate is not signed by a recognized certificate authority.



## Part 2: Installing Portainer with Self-Signed Certificates

If you prefer to use your own self-signed certificates for securing Portainer, follow these steps.

### Step 1: Generate Self-Signed Certificates

If you don't already have certificates, you can generate them using OpenSSL:

```bash
openssl genrsa -out key.pem 2048
openssl req -new -key key.pem -out cert.csr
openssl x509 -req -days 365 -in cert.csr -signkey key.pem -out cert.pem
```

This will create two files:

- **`key.pem`**: The private key.
- **`cert.pem`**: The self-signed certificate.

Place these files in a dedicated directory, such as `/path/to/certs/` 

### Step 2: Modify the `docker-compose.yml` File

Open the `docker-compose.yml` file and modify it to use your self-signed certificates:

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
      - /path/to/certs/cert.pem:/certs/portainer.crt   # Mount the certificat
      - /path/to/certs//key.pem:/certs/portainer.key    # # Mount the private key
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

:wink: Replace `/path/to/certs/` with the actual path where your certificates are stored.

### Step 3: Start Portainer

Start Portainer using Docker Compose as before:

```bash
docker-compose up -d
```



### Step 4: Access Portainer

Access Portainer via HTTPS at https://localhost:9443. Your self-signed certificate will be used to secure the connection.  Note that you will still see a security warning in the browser, but the  connection will be encrypted.



## Conclusion

You have now successfully :tada: installed **Portainer**  using **Docker Compose**, either with the default settings or with your own  self-signed certificates for enhanced security. 

<u>This tutorial provides a solid foundation for managing your Docker environments efficiently and  securely.</u>
