# --- Build: Vite with dynamic base ---
FROM node:20-bookworm AS build
WORKDIR /app

# Variable de entorno para el prefijo de ruta
ARG APP_PREFIX=/soc_lab_uai/
ENV VITE_APP_PREFIX=${APP_PREFIX}

ARG API_PREFIX=/soc_api
ENV VITE_API_PREFIX=${API_PREFIX}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --base=${APP_PREFIX}/

# --- Runtime: Serve with Nginx ---
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Configurar zona horaria de Chile continental
ENV TZ=America/Santiago
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Instalar envsubst para procesar templates
RUN apk add --no-cache gettext

# Variable de entorno para nginx
ENV APP_PREFIX=${APP_PREFIX:-/soc_lab_uai/}
ENV API_PREFIX=${API_PREFIX:-/soc_api}

# Copy build output
COPY --from=build /app/dist ./

# Copy nginx template instead of final config
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
