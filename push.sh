#!/bin/bash

# Vérifie si un argument est passé au script
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <description>"
    exit 1
fi

# Récupère la description passée en argument
description="$1"

# Effectue les actions Git
git add .
git commit -m "add new article: $description"
git push origin main
