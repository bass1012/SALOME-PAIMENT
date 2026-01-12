# Guide de Déploiement - Salon Paiement

Ce document explique comment déployer votre application Salon Paiement en production.

## 🚀 Méthodes de Déploiement

### Option 1: Déploiement Automatisé (Recommandé)

#### Prérequis
- Serveur Ubuntu 20.04/22.04 LTS avec accès root
- Nom de domaine pointant vers votre serveur
- Accès SSH au serveur

#### Étapes

1. **Télécharger le script de déploiement**
   ```bash
   # Sur votre machine locale
   scp deploy.sh user@votre-serveur:/home/user/
   ```

2. **Se connecter au serveur**
   ```bash
   ssh user@votre-serveur
   ```

3. **Exécuter le script**
   ```bash
   sudo chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. **Configurer le domaine**
   - Éditez le script `deploy.sh` et modifiez `DOMAIN="votre-domaine.com"`
   - Assurez-vous que votre domaine pointe vers l'IP du serveur

#### Ce que fait le script:
- ✅ Installation de tous les paquets nécessaires
- ✅ Configuration de MySQL avec base de données et utilisateur
- ✅ Setup de l'environnement Python virtuel
- ✅ Configuration de Django avec migrations et fichiers statiques
- ✅ Build du frontend React
- ✅ Configuration de Gunicorn comme serveur d'application
- ✅ Configuration de Nginx comme reverse proxy
- ✅ Installation et configuration SSL avec Let's Encrypt
- ✅ Configuration de sécurité (pare-feu, Fail2Ban)
- ✅ Setup de monitoring et rotation des logs
- ✅ Création de scripts de backup automatiques

---

### Option 2: Déploiement Manuel

#### 1. Préparation du Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y python3-pip python3-venv python3-dev build-essential libmysqlclient-dev nginx supervisor curl wget git ufw fail2ban

# Installer Node.js pour le frontend
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Configuration de la Base de Données

```bash
# Installer MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Créer la base de données
sudo mysql -u root -p
```

```sql
CREATE DATABASE salon_paiement_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'salon_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON salon_paiement_db.* TO 'salon_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Déploiement de l'Application

```bash
# Créer le répertoire du projet
sudo mkdir -p /var/www/salon_paiement
sudo chown www-data:www-data /var/www/salon_paiement
cd /var/www/salon_paiement

# Copier les fichiers du projet (via git, scp, etc.)
# git clone <votre-repo> .  # ou copier manuellement

# Configurer l'environnement
sudo -u www-data python3 -m venv venv
sudo -u www-data ./venv/bin/pip install -r requirements.txt
sudo -u www-data ./venv/bin/pip install gunicorn mysqlclient

# Créer le fichier .env
sudo -u www-data cat > .env << EOF
SECRET_KEY=votre_cle_secrete_ici
DEBUG=False
ALLOWED_HOSTS=votre-domaine.com,www.votre-domaine.com,localhost,127.0.0.1
DB_NAME=salon_paiement_db
DB_USER=salon_user
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=3306
EOF

# Configurer Django
sudo -u www-data ./venv/bin/python manage.py makemigrations
sudo -u www-data ./venv/bin/python manage.py migrate
sudo -u www-data ./venv/bin/python manage.py collectstatic --noinput
sudo -u www-data ./venv/bin/python manage.py createsuperuser
```

#### 4. Build du Frontend

```bash
cd frontend
sudo -u www-data npm install
echo "REACT_APP_API_URL=https://votre-domaine.com/api" | sudo -u www-data tee .env
sudo -u www-data npm run build
cd ..
sudo -u www-data cp -r frontend/build/* staticfiles/
```

#### 5. Configuration de Gunicorn

```bash
sudo tee /etc/systemd/system/salon_paiement.service > /dev/null <<EOF
[Unit]
Description=Salon Paiement Django App
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/salon_paiement
Environment=PATH=/var/www/salon_paiement/venv/bin
EnvironmentFile=/var/www/salon_paiement/.env
ExecStart=/var/www/salon_paiement/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/gunicorn/salon_paiement.sock \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    salon_paiement.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

sudo mkdir -p /run/gunicorn
sudo chown www-data:www-data /run/gunicorn
sudo systemctl daemon-reload
sudo systemctl enable salon_paiement
sudo systemctl start salon_paiement
```

#### 6. Configuration de Nginx

```bash
sudo tee /etc/nginx/sites-available/salon_paiement > /dev/null <<EOF
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location /static/ {
        alias /var/www/salon_paiement/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /var/www/salon_paiement/media/;
    }
    
    location /api/ {
        proxy_pass http://unix:/run/gunicorn/salon_paiement.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location / {
        root /var/www/salon_paiement/staticfiles;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/salon_paiement /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Configuration SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

#### 8. Sécurité

```bash
# Pare-feu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Permissions
sudo chmod 600 /var/www/salon_paiement/.env
sudo chown www-data:www-data /var/www/salon_paiement/.env
```

---

## 🌐 Déploiement Cloud

### Heroku

1. **Créer un fichier `Procfile`**
   ```txt
   web: gunicorn salon_paiement.wsgi:application
   ```

2. **Créer `runtime.txt`**
   ```txt
   python-3.9.16
   ```

3. **Déployer**
   ```bash
   heroku create votre-app
   heroku config:set DEBUG=False SECRET_KEY=votre_cle
   heroku config:set DJANGO_SETTINGS_MODULE=salon_paiement.settings
   git push heroku main
   heroku run python manage.py migrate
   heroku run python manage.py createsuperuser
   heroku open
   ```

### DigitalOcean App Platform

1. **Connecter votre repository GitHub**
2. **Configurer les variables d'environnement**
   ```
   DEBUG=False
   SECRET_KEY=votre_cle_secrete
   DB_NAME=database_url
   ```
3. **Déployer automatiquement**

### AWS Elastic Beanstalk

1. **Installer EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialiser**
   ```bash
   eb init
   eb create production
   eb deploy
   ```

---

## 🔧 Post-Déploiement

### Vérifications

```bash
# Vérifier le statut des services
sudo systemctl status salon_paiement
sudo systemctl status nginx

# Vérifier les logs
sudo journalctl -u salon_paiement -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Tester l'application
curl -I https://votre-domaine.com
curl -I https://votre-domaine.com/api
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

# Logs
tail -f /var/www/salon_paiement/logs/salon_paiement.log
```

### Sécurité Additionnelle

```bash
# Configurer Django pour la production
# Ajouter dans settings.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

---

## 🚨 Dépannage

### Problèmes Courants

1. **Erreur 502 Bad Gateway**
   ```bash
   # Vérifier Gunicorn
   sudo systemctl status salon_paiement
   sudo journalctl -u salon_paiement
   
   # Vérifier les permissions du socket
   ls -la /run/gunicorn/
   ```

2. **Erreur 503 Service Unavailable**
   ```bash
   # Redémarrer les services
   sudo systemctl restart salon_paiement
   sudo systemctl restart nginx
   ```

3. **Problèmes de base de données**
   ```bash
   # Vérifier la connexion
   sudo -u www-data ./venv/bin/python manage.py dbshell
   
   # Vérifier les migrations
   sudo -u www-data ./venv/bin/python manage.py showmigrations
   ```

4. **Problèmes SSL**
   ```bash
   # Renouveler le certificat
   sudo certbot renew --dry-run
   sudo certbot renew
   
   # Vérifier la configuration SSL
   sudo nginx -t
   ```

### Monitoring

```bash
# Utilisation du disque
df -h

# Utilisation de la mémoire
free -h

# Processus actifs
htop

# Logs système
sudo journalctl -f
```

---

## 📞 Support

En cas de problèmes, vérifiez:
1. Les logs dans `/var/log/`
2. La configuration dans `/etc/nginx/sites-available/`
3. Les services système avec `systemctl`
4. La documentation officielle de Django et Nginx

Pour une assistance rapide, fournissez:
- Les messages d'erreur exacts
- Les logs pertinents
- La configuration actuelle
- La version des logiciels utilisés
