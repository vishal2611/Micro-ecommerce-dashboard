#!/usr/bin/bash

set -euo pipefail

sudo apt-get update -y

sudo apt-get install -y docker.io docker-compose-v2

sudo systemctl enable --now docker

sudo usermod -aG docker "$USER"

sudo docker --version
sudo docker compose version

echo "Installation Done : Run 'newgrp docker' and re-login"