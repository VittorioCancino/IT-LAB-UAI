# Build: compila TS a /dist
FROM node:20-bookworm AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Runtime: solo prod deps + dist
FROM node:20-bookworm
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
# Ajusta si tu entry real difiere
CMD ["node", "dist/server.js"]
