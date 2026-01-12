# 🚀 Guide de Déploiement - Salon Paiement

Ce README contient toutes les informations nécessaires pour déployer votre application Salon Paiement en production.

## 📋 Table des Matières

- [Méthodes de Déploiement](#méthodes-de-déploiement)
- [Déploiement Automatisé](#déploiement-automatisé)
- [Déploiement Docker](#déploiement-docker)
- [Déploiement Cloud](#déploiement-cloud)
- [Post-Déploiement](#post-déploiement)
- [Monitoring](#monitoring)
- [Dépannage](#dépannage)

---

## 🎯 Méthodes de Déploiement

### 1. **Déploiement Automatisé** (Recommandé pour serveurs dédiés/VPS)
- **Script**: `deploy.sh`
- **Système**: Ubuntu 20.04/22.04 LTS
- **Avantages**: Installation complète automatisée
- **Durée**: ~15-20 minutes

### 2. **Déploiement Docker** (Recommandé pour conteneurs)
- **Fichiers**: `docker-compose.yml`, `Dockerfile`
- **Avantages**: Portabilité, scalabilité
- **Durée**: ~5-10 minutes

### 3. **Déploiement Cloud** (Recommandé pour PaaS)
- **Plateformes**: Heroku, DigitalOcean, AWS
- **Avantages**: Gestion simplifiée
- **Durée**: ~10-15 minutes

---

## 🤖 Déploiement Automatisé

### Prérequis
- Serveur Ubuntu 20.04/22.04 LTS
- Accès root/sudo
- Nom de domaine configuré

### Étapes rapides

```bash
# 1. Télécharger le script
scp deploy.sh user@votre-serveur:/home/user/

# 2. Se connecter au serveur
ssh user@votre-serveur

# 3. Configurer le domaine
sed -i 's/votre-domaine.com/votredomaine.com/g' deploy.sh

# 4. Exécuter le script
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### Ce que fait le script
- ✅ Installation de tous les paquets nécessaires
- ✅ Configuration MySQL avec base de données
- ✅ Setup environnement Python et Django
- ✅ Build frontend React
- ✅ Configuration Gunicorn + Nginx
- ✅ Installation SSL Let's Encrypt
- ✅ Configuration sécurité (UFW, Fail2Ban)
- ✅ Setup monitoring et backups
- ✅ Création scripts de maintenance

---

## 🐳 Déploiement Docker

### Prérequis
- Docker et Docker Compose installés
- Docker Engine 20.10+

### Configuration

```bash
# 1. Copier les variables d'environnement
cp .env.example .env

# 2. Éditer .env avec vos valeurs
nano .env

# 3. Lancer les services
docker-compose up -d

# 4. Vérifier le statut
docker-compose ps
docker-compose logs
```

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| web | 8000 | Application Django |
| nginx | 80/443 | Reverse proxy |
| db | 3306 | Base de données MySQL |
| redis | 6379 | Cache Redis |
| celery | - | Worker tâches asynchrones |
| flower | 5555 | Monitoring Celery |

### Commandes utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Voir les logs
docker-compose logs -f web

# Exécuter des commandes Django
docker-compose exec web python manage.py migrate

# Backup de la base de données
docker-compose exec db mysqldump -u root -p salon_paiement_db > backup.sql

# Mettre à jour l'application
docker-compose build --no-cache
docker-compose up -d
```

---

## ☁️ Déploiement Cloud

### Heroku

```bash
# 1. Installer Heroku CLI
npm install -g heroku

# 2. Se connecter
heroku login

# 3. Créer l'application
heroku create votre-app

# 4. Configurer les variables d'environnement
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=votre_cle_secrete
heroku config:set DJANGO_SETTINGS_MODULE=salon_paiement.settings

# 5. Ajouter le buildpack Node.js
heroku buildpacks:add heroku/nodejs

# 6. Déployer
git push heroku main

# 7. Exécuter les migrations
heroku run python manage.py migrate

# 8. Créer un superutilisateur
heroku run python manage.py createsuperuser
```

### DigitalOcean App Platform

1. **Connecter votre repository GitHub**
2. **Configurer les variables d'environnement**:
   ```
   DEBUG=False
   SECRET_KEY=votre_cle_secrete
   DB_NAME=database_url
   ```
3. **Configurer le buildpack**:
   - Node.js: `frontend/`
   - Python: `./`
4. **Déployer automatiquement**

### AWS Elastic Beanstalk

```bash
# 1. Installer EB CLI
pip install awsebcli

# 2. Initialiser
eb init

# 3. Créer l'environnement
eb create production

# 4. Déployer
eb deploy

# 5. Ouvrir l'application
eb open
```

---

## 🔧 Post-Déploiement

### Vérifications essentielles

```bash
# Vérifier les services (déployment traditionnel)
sudo systemctl status salon_paiement
sudo systemctl status nginx

# Vérifier les logs
sudo journalctl -u salon_paiement -f
sudo tail -f /var/log/nginx/access.log

# Tester l'application
curl -I https://votre-domaine.com
curl -I https://votre-domaine.com/api

# Vérifier SSL
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com
```

### Configuration Django production

Ajouter dans `salon_paiement/settings.py`:

```python
# Configuration production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_SECONDS = 31536000

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/salon_paiement.log',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### Maintenance

```bash
# Mise à jour de l'application
cd /var/www/salon_paiement
sudo -u www-data git pull origin main
sudo -u www-data ./venv/bin/pip install -r requirements.txt
sudo -u www-data ./venv/bin/python manage.py migrate
sudo -u www-data ./venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart salon_paiement

# Backup
./backup.sh

# Nettoyage des logs
sudo logrotate -f /etc/logrotate.d/salon_paiement

# Vérification de l'espace disque
df -h
du -sh /var/www/salon_paiement/media/
```

---

## 📊 Monitoring

### Monitoring système

```bash
# Utilisation des ressources
htop
df -h
free -h

# Monitoring des processus
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10

# Monitoring réseau
netstat -tulpn
ss -tulpn
```

### Monitoring application

```bash
# Logs Django
tail -f /var/www/salon_paiement/logs/salon_paiement.log

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs système
sudo journalctl -f -u salon_paiement
```

### Monitoring avec outils externes

1. **Sentry** (pour les erreurs):
   ```python
   # Dans settings.py
   import sentry_sdk
   sentry_sdk.init("votre-sentry-dsn")
   ```

2. **Prometheus + Grafana** (métriques):
   ```python
   # Installer django-prometheus
   pip install django-prometheus
   ```

3. **Uptime monitoring**:
   - UptimeRobot
   - Pingdom
   - StatusCake

---

## 🚨 Dépannage

### Problèmes courants

#### 1. Erreur 502 Bad Gateway
```bash
# Vérifier Gunicorn
sudo systemctl status salon_paiement
sudo journalctl -u salon_paiement

# Vérifier le socket
ls -la /run/gunicorn/

# Redémarrer les services
sudo systemctl restart salon_paiement
sudo systemctl restart nginx
```

#### 2. Erreur 503 Service Unavailable
```bash
# Vérifier la charge du serveur
htop
free -h

# Redémarrer les services
sudo systemctl restart salon_paiement nginx

# Vérifier les logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

#### 3. Problèmes de base de données
```bash
# Tester la connexion
sudo -u www-data python manage.py dbshell

# Vérifier les migrations
sudo -u www-data python manage.py showmigrations

# Réparer les migrations
sudo -u www-data python manage.py migrate --fake
sudo -u www-data python manage.py migrate
```

#### 4. Problèmes SSL
```bash
# Vérifier le certificat
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew --force-renewal

# Tester la configuration SSL
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Problèmes Docker
```bash
# Vérifier les conteneurs
docker-compose ps

# Voir les logs
docker-compose logs -f web

# Reconstruire les images
docker-compose build --no-cache
docker-compose up -d

# Nettoyer les ressources
docker system prune -a
```

### Scripts de dépannage

```bash
# Script de diagnostic
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== Diagnostic Salon Paiement ==="
echo "Date: $(date)"
echo

echo "1. Système:"
echo "  - Uptime: $(uptime)"
echo "  - Disk: $(df -h / | tail -1 | awk '{print $5}')"
echo "  - Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo

echo "2. Services:"
echo "  - Gunicorn: $(systemctl is-active salon_paiement)"
echo "  - Nginx: $(systemctl is-active nginx)"
echo "  - MySQL: $(systemctl is-active mysql)"
echo

echo "3. Ports:"
echo "  - 80: $(ss -tulpn | grep :80 || echo 'Not listening')"
echo "  - 443: $(ss -tulpn | grep :443 || echo 'Not listening')"
echo "  - 8000: $(ss -tulpn | grep :8000 || echo 'Not listening')"
echo

echo "4. Logs récents:"
echo "  - Dernière erreur Nginx:"
tail -n 5 /var/log/nginx/error.log
echo

echo "  - Dernière erreur application:"
tail -n 5 /var/www/salon_paiement/logs/salon_paiement.log 2>/dev/null || echo "Pas de logs"
echo

echo "5. Tests de connexion:"
echo "  - Application locale: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/ || echo 'Failed')"
echo "  - Application externe: $(curl -s -o /dev/null -w "%{http_code}" https://votre-domaine.com/api/ || echo 'Failed')"
EOF

chmod +x diagnose.sh
./diagnose.sh
```

---

## 📞 Support

### Documentation utile
- [Django Deployment Checklist](https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)

### En cas de problème
1. Vérifier les logs dans `/var/log/`
2. Consulter ce guide de dépannage
3. Exécuter le script de diagnostic
4. Contacter le support technique

### Informations à fournir pour le support
- Version de l'application
- Système d'exploitation
- Messages d'erreur exacts
- Logs pertinents
- Configuration actuelle

---

## 🎉 Conclusion

Ce guide complet devrait vous permettre de déployer votre application Salon Paiement dans n'importe quel environnement. N'hésitez pas à consulter les ressources supplémentaires et à contacter le support en cas de besoin.

**Bon déploiement !** 🚀
