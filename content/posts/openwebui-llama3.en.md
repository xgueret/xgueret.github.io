+++
title = "Setting Up Open-WebUI with Ollama and LLaMA 3"
date = "2024-08-31"
author= "Xavier GUERET"
categories = [
    "tutorial",
]
tags = [
  "Docker",
  "Open-WebUI",
  "Ollama",
  "LLaMA 3"
]
summary = "A comprehensive guide to setting up a Docker stack with Open-WebUI, using Ollama to run LLaMA 3."
+++

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Docker**: [Docker Installation Documentation](https://docs.docker.com/get-docker/)
2. **Docker Compose**: [Docker Compose Installation Documentation](https://docs.docker.com/compose/install/)
3. **Ollama**: [Ollama Installation Documentation](https://ollama.com)
4. **LLaMA 3**: Follow the instructions in [Ollama's documentation to integrate LLaMA 3](https://ollama.com/docs) or obtain the LLaMA 3 model via Ollama.

## Step 1: Configure the Ollama Service with systemd

Ollama is typically installed with a pre-existing systemd configuration. However, to ensure the stack functions correctly, you need to add a specific line to the existing configuration.

1. Edit the systemd service file for Ollama:

    ```bash
    sudo nano /etc/systemd/system/ollama.service
    ```

2. Add the following line under the `[Service]` section to set the address and port for Ollama:

    ```ini
    Environment="OLLAMA_HOST=0.0.0.0:11434"
    ```

    **Note:** This line configures Ollama to listen on all network interfaces (`0.0.0.0`) on port `11434`, allowing Open-WebUI to access Ollama via the address defined in `OLLAMA_BASE_URL`.

3. Reload the systemd configuration to apply the changes and restart the Ollama service:

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart ollama
    ```

## Step 2: Configure Docker Compose for Open-WebUI

1. Create a directory for your Docker Compose configuration. For example:

    ```bash
    mkdir -p /path/to/your/open-webui
    ```

2. In this directory, create a `docker-compose.yml` file with the following content:

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

3. Start the services with Docker Compose:

    ```bash
    cd /path/to/your/open-webui
    docker-compose up -d
    ```

    *Note:* Run the `docker-compose` command without `sudo` if your user is part of the Docker group. Otherwise, use `sudo` for Docker commands.

## Explanation of `extra_hosts`

The `extra_hosts` directive allows you to add entries to the `/etc/hosts` file of the Docker container. Here’s the added entry:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"

```

**Why use this configuration?**

1. **Access to Host Services**: This configuration allows the Docker container to resolve `host.docker.internal` as the IP address of the host machine. This is useful for accessing  services or applications running on the host, such as Ollama in this  case.
2. **Compatibility with Docker Networks**: `host.docker.internal` helps resolve connectivity issues between containers and host services. It works across multiple operating systems, facilitating the connection between containerized services and host services.
3. **Ease of Configuration**: Using `host.docker.internal` avoids the need to configure the specific IP address of the host, simplifying network connectivity management.

## Step 3: Verify the Installation

To check if the services are running:

- **Ollama:**

  ```
  bash
  ```

- ```
  sudo systemctl status ollama
  ```

- **Open-WebUI:**

  Open a web browser and go to `http://localhost:3000`. You should see the Open-WebUI interface.

## Conclusion

You now have a working setup of Open-WebUI with Ollama and LLaMA 3.
