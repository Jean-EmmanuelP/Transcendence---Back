#!/bin/bash

# Lancer Docker Compose
echo "Démarrage de Docker Compose..."
docker-compose up -d

# Attendre quelques secondes pour s'assurer que la base de données est prête
echo "Attente de 5 secondes pour s'assurer que Postgres est prêt..."
sleep 5

# Lancer le backend Nest.js
echo "Démarrage de Nest.js backend..."
npm run start
