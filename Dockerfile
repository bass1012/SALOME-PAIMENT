# Dockerfile pour Salon Paiement
# Multi-stage build pour optimiser la taille de l'image

# Étape 1: Build du frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copier les fichiers package
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier les fichiers source du frontend
COPY frontend/ .

# Configurer l'URL de l'API
ARG REACT_APP_API_URL=http://localhost:8000/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build du frontend
RUN npm run build

# Étape 2: Build de l'application Python
FROM python:3.9-slim AS python-build

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Étape 3: Image de production
FROM python:3.9-slim

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Installer les dépendances système nécessaires pour l'exécution
RUN apt-get update && apt-get install -y \
    libmysqlclient21 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash app

WORKDIR /app

# Copier les dépendances Python depuis l'étape de build
COPY --from=python-build /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=python-build /usr/local/bin /usr/local/bin

# Copier les fichiers de l'application
COPY --chown=app:app . .

# Copier les fichiers build du frontend
COPY --from=frontend-build --chown=app:app /app/frontend/build ./staticfiles

# Créer les répertoires nécessaires
RUN mkdir -p logs media && \
    chown -R app:app logs media

# Créer le répertoire pour les fichiers statiques
RUN mkdir -p staticfiles && \
    chown -R app:app staticfiles

# Exposer le port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/ || exit 1

# Utiliser un utilisateur non-root
USER app

# Commande par défaut
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "salon_paiement.wsgi:application"]
