# Définir strict mode pour catch des erreurs plus facilement
$ErrorActionPreference = "Stop"

# Cherche s'il y a un conteneur Docker utilisant le port 5432
$port_check = docker ps --format '{{.Ports}}' | Select-String "5432"

# Cherche s'il y a un conteneur Docker avec le nom my_postgres_container
$name_check = docker ps --format '{{.Names}}' | Select-String "my_postgres_container"

# Vérifie que le port 5432 n'est pas utilisé et qu'aucun conteneur ne porte le nom my_postgres_container
# if (-not $port_check -and -not $name_check) {
    # Démarre les conteneurs Docker avec Docker Compose
    docker-compose up -d

    # Attends que les conteneurs soient prêts
    Start-Sleep -Seconds 10

    # Lance la migration Prisma
    npx prisma migrate dev

    # Démarre l'application en mode développement en arrière-plan
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run start:dev"

    # Lance Prisma Studio en arrière-plan
    Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "prisma studio"
# }
# else {
    # Write-Host "Un conteneur Docker utilise déjà le port 5432 ou le nom my_postgres_container. Arrêtez le conteneur avant de relancer ce script."
# }
