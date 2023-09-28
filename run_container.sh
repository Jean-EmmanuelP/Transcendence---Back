#!/bin/sh

# Cherche s'il y a un conteneur Docker utilisant le port 5432
port_check=$(docker ps --format '{{.Ports}}' | grep 5432)

# Cherche s'il y a un conteneur Docker avec le nom my_postgres_container
name_check=$(docker ps --format '{{.Names}}' | grep my_postgres_container)

# Vérifie que le port 5432 n'est pas utilisé et qu'aucun conteneur ne porte le nom my_postgres_container
if [ -z "$port_check" ] && [ -z "$name_check" ]; then
  # Démarre les conteneurs Docker avec Docker Compose
  docker-compose up -d

  # Attends que les conteneurs soient prêts
  sleep 10

  # Lance la migration Prisma
  npx prisma migrate dev

  # Démarre l'application en mode développement
  npm run start:dev &

  # Lance Prisma Studio en arrière-plan
  npx prisma studio &

else
  echo "Un conteneur Docker utilise déjà le port 5432 ou le nom my_postgres_container. Arrêtez le conteneur avant de relancer ce script."
fi
