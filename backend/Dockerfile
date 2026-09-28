FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/

EXPOSE 8000

CMD ["sh", "-c", "node src/database/migrate.js && node src/database/seeds/runSeeds.js && exec node src/server.js"]
