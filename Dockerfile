# ===========================================
# Stage 1: Dependencies
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production && npm cache clean --force

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:20-alpine AS production

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les dépendances depuis le stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs public ./public
COPY --chown=nodejs:nodejs package.json ./

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Exposer le port
EXPOSE 3000

# Utiliser l'utilisateur non-root
USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/tasks || exit 1

# Démarrer l'application
CMD ["node", "src/app.js"]
