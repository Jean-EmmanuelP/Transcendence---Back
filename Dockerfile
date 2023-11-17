# Use Node.js 18 as the base image
FROM node:18

COPY src /app/src
COPY tsconfig.json /app

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./


# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY src /app/src
COPY tsconfig.json /app
COPY prisma /app/prisma
COPY .env /app

# Add a wait-for-it script
ADD https://github.com/vishnubob/wait-for-it/raw/master/wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh

# Set environment variables
ENV DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"

# Run the migration script
CMD ["./wait-for-it.sh", "postgres:5432", "--", "npm", "run", "migrate-and-start"]

