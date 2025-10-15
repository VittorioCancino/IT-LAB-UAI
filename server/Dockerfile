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

# Configurar zona horaria de Chile continental
ENV TZ=America/Santiago
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Establecer variables de entorno
ENV NODE_ENV=$NODE_ENV
ENV JWT_SECRET=$JWT_SECRET
ENV ROUTE=$ROUTE
ENV HOST=$HOST

ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src/config/instance-config.json ./dist/config/
EXPOSE 3000
# Ajusta si tu entry real difiere
CMD ["node", "dist/index.js"]
