# Multi-stage build pro React aplikaci
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopírování package files
COPY package*.json ./

# Instalace závislostí
RUN npm ci --only=production

# Kopírování zdrojového kódu
COPY . .

# Build aplikace
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Kopírování build souborů
COPY --from=builder /app/build /usr/share/nginx/html

# Kopírování nginx konfigurace
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponování portu
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
