#!/bin/bash

# =============================================================================
# SCRIPT DE DÉPLOIEMENT AUTOMATISÉ POUR SALON PAIEMENT
# =============================================================================
# Auteur: Cascade AI Assistant
# Date: $(date +%Y-%m-%d)
# Version: 1.0
#
# Ce script automatise le déploiement complet de l'application Salon Paiement
# sur un serveur Ubuntu 20.04/22.04
# =============================================================================

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# CONFIGURATION
# =============================================================================

# Variables de configuration (à modifier selon vos besoins)
PROJECT_NAME="salon_paiement"
DOMAIN="votre-domaine.com"  # À modifier
DB_NAME="salon_paiement_db"
DB_USER="salon_user"
PROJECT_PATH="/var/www/${PROJECT_NAME}"
VENV_PATH="${PROJECT_PATH}/venv"
SERVICE_USER="www-data"

# =============================================================================
# FONCTIONS DE DÉPLOIEMENT
# =============================================================================

check_requirements() {
    log_info "Vérification des prérequis système..."
    
    # Vérifier si on est en root
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root (sudo)"
        exit 1
    fi
    
    # Vérifier la version d'Ubuntu
    if ! grep -q "Ubuntu" /etc/os-release; then
        log_error "Ce script est conçu pour Ubuntu uniquement"
        exit 1
    fi
    
    # Vérifier Python 3.8+
    if ! command -v python3.8 &> /dev/null && ! command -v python3.9 &> /dev/null && ! command -v python3.10 &> /dev/null; then
        log_error "Python 3.8+ est requis"
        exit 1
    fi
    
    log_success "Prérequis système vérifiés"
}

install_system_packages() {
    log_info "Installation des paquets système..."
    
    apt update
    apt upgrade -y
    
    # Paquets essentiels
    apt install -y \
        python3-pip \
        python3-venv \
        python3-dev \
        build-essential \
        libmysqlclient-dev \
        nginx \
        supervisor \
        curl \
        wget \
        git \
        ufw \
        fail2ban \
        logrotate
    
    log_success "Paquets système installés"
}

setup_database() {
    log_info "Configuration de la base de données MySQL..."
    
    # Générer un mot de passe aléatoire
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Installer MySQL si nécessaire
    if ! command -v mysql &> /dev/null; then
        log_info "Installation de MySQL..."
        apt install -y mysql-server
        systemctl enable mysql
        systemctl start mysql
        
        # Sécurisation MySQL
        mysql_secure_installation <<EOF

y
$DB_PASSWORD
$DB_PASSWORD
y
y
y
y
EOF
    fi
    
    # Créer la base de données et l'utilisateur
    mysql -u root -p"$DB_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Sauvegarder les identifiants
    echo "DB_NAME=$DB_NAME" > "${PROJECT_PATH}/.env"
    echo "DB_USER=$DB_USER" >> "${PROJECT_PATH}/.env"
    echo "DB_PASSWORD=$DB_PASSWORD" >> "${PROJECT_PATH}/.env"
    
    log_success "Base de données configurée"
    log_info "Mot de passe MySQL: $DB_PASSWORD"
}

setup_project() {
    log_info "Configuration du projet..."
    
    # Créer le répertoire du projet
    mkdir -p $PROJECT_PATH
    cd $PROJECT_PATH
    
    # Cloner le projet (à adapter selon votre méthode)
    if [ ! -d ".git" ]; then
        log_info "Clonage du projet..."
        # Décommentez et adaptez cette ligne selon votre repo
        # git clone <votre-repo-url> .
        log_warning "Veuillez copier manuellement les fichiers du projet dans $PROJECT_PATH"
    fi
    
    # Configurer les permissions
    chown -R $SERVICE_USER:$SERVICE_USER $PROJECT_PATH
    chmod -R 755 $PROJECT_PATH
    
    log_success "Projet configuré"
}

setup_python_environment() {
    log_info "Configuration de l'environnement Python..."
    
    cd $PROJECT_PATH
    
    # Créer l'environnement virtuel
    sudo -u $SERVICE_USER python3 -m venv $VENV_PATH
    
    # Installer les dépendances Python
    sudo -u $SERVICE_USER $VENV_PATH/bin/pip install --upgrade pip
    sudo -u $SERVICE_USER $VENV_PATH/bin/pip install -r requirements.txt
    sudo -u $SERVICE_USER $VENV_PATH/bin/pip install gunicorn mysqlclient
    
    log_success "Environnement Python configuré"
}

setup_django() {
    log_info "Configuration de Django..."
    
    cd $PROJECT_PATH
    
    # Générer une clé secrète
    SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
    
    # Configurer les variables d'environnement
    cat >> .env <<EOF
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1
DB_HOST=localhost
DB_PORT=3306
EOF
    
    # Appliquer les migrations
    sudo -u $SERVICE_USER $VENV_PATH/bin/python manage.py makemigrations
    sudo -u $SERVICE_USER $VENV_PATH/bin/python manage.py migrate
    
    # Collecter les fichiers statiques
    sudo -u $SERVICE_USER $VENV_PATH/bin/python manage.py collectstatic --noinput
    
    # Créer un superutilisateur (à adapter)
    log_warning "Création d'un superutilisateur Django..."
    sudo -u $SERVICE_USER $VENV_PATH/bin/python manage.py createsuperuser --noinput || true
    
    log_success "Django configuré"
}

build_frontend() {
    log_info "Build du frontend React..."
    
    cd $PROJECT_PATH/frontend
    
    # Installer Node.js si nécessaire
    if ! command -v node &> /dev/null; then
        log_info "Installation de Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Installer les dépendances
    sudo -u $SERVICE_USER npm install
    
    # Configurer l'URL de l'API
    echo "REACT_APP_API_URL=https://$DOMAIN/api" | sudo -u $SERVICE_USER tee .env
    
    # Build de production
    sudo -u $SERVICE_USER npm run build
    
    # Copier les fichiers build vers les statics Django
    cp -r build/* ../staticfiles/
    
    log_success "Frontend buildé"
}

setup_gunicorn() {
    log_info "Configuration de Gunicorn..."
    
    # Créer le fichier de service systemd
    cat > /etc/systemd/system/${PROJECT_NAME}.service <<EOF
[Unit]
Description=$PROJECT_NAME Django App
After=network.target

[Service]
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$PROJECT_PATH
Environment=PATH=$VENV_PATH/bin
EnvironmentFile=$PROJECT_PATH/.env
ExecStart=$VENV_PATH/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/gunicorn/${PROJECT_NAME}.sock \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    salon_paiement.wsgi:application

[Install]
WantedBy=multi-user.target
EOF
    
    # Créer le répertoire pour le socket
    mkdir -p /run/gunicorn
    chown $SERVICE_USER:$SERVICE_USER /run/gunicorn
    
    # Démarrer et activer le service
    systemctl daemon-reload
    systemctl enable $PROJECT_NAME
    systemctl start $PROJECT_NAME
    
    log_success "Gunicorn configuré"
}

setup_nginx() {
    log_info "Configuration de Nginx..."
    
    # Créer le fichier de configuration Nginx
    cat > /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirection vers HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # Configuration SSL (sera configurée plus tard)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Fichiers statiques Django
    location /static/ {
        alias $PROJECT_PATH/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Fichiers médias
    location /media/ {
        alias $PROJECT_PATH/media/;
    }
    
    # API Django
    location /api/ {
        proxy_pass http://unix:/run/gunicorn/${PROJECT_NAME}.sock;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Frontend React (toutes les autres routes)
    location / {
        root $PROJECT_PATH/staticfiles;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Tester la configuration Nginx
    nginx -t
    
    # Redémarrer Nginx
    systemctl restart nginx
    
    log_success "Nginx configuré"
}

setup_ssl() {
    log_info "Configuration SSL avec Let's Encrypt..."
    
    # Installer Certbot
    apt install -y certbot python3-certbot-nginx
    
    # Obtenir le certificat SSL
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Configurer le renouvellement automatique
    cat > /etc/cron.d/certbot-renewal <<EOF
# Renouvellement automatique des certificats SSL
0 12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF
    
    log_success "SSL configuré"
}

setup_security() {
    log_info "Configuration de la sécurité..."
    
    # Configurer le pare-feu
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    # Configurer Fail2Ban
    cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOF
    
    systemctl restart fail2ban
    
    # Sécuriser les fichiers
    chmod 600 $PROJECT_PATH/.env
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_PATH/.env
    
    log_success "Sécurité configurée"
}

setup_monitoring() {
    log_info "Configuration du monitoring..."
    
    # Configurer la rotation des logs
    cat > /etc/logrotate.d/$PROJECT_NAME <<EOF
$PROJECT_PATH/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
}
EOF
    
    # Configurer Django logging
    cat >> $PROJECT_PATH/salon_paiement/settings.py <<EOF

# Configuration de logging pour la production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/salon_paiement.log'),
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
EOF
    
    # Créer le répertoire de logs
    mkdir -p $PROJECT_PATH/logs
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_PATH/logs
    
    log_success "Monitoring configuré"
}

create_backup_script() {
    log_info "Création du script de backup..."
    
    cat > $PROJECT_PATH/backup.sh <<EOF
#!/bin/bash

# Script de backup pour $PROJECT_NAME
BACKUP_DIR="/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de backup
mkdir -p \$BACKUP_DIR

# Backup de la base de données
mysqldump -u $DB_USER -p\$DB_PASSWORD $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup des fichiers médias
tar -czf \$BACKUP_DIR/media_backup_\$DATE.tar.gz $PROJECT_PATH/media/

# Backup des fichiers de configuration
tar -czf \$BACKUP_DIR/config_backup_\$DATE.tar.gz $PROJECT_PATH/.env

# Supprimer les backups de plus de 30 jours
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup terminé: \$DATE"
EOF
    
    chmod +x $PROJECT_PATH/backup.sh
    chown $SERVICE_USER:$SERVICE_USER $PROJECT_PATH/backup.sh
    
    # Ajouter au crontab
    cat > /etc/cron.d/$PROJECT_NAME-backup <<EOF
# Backup quotidien à 2h du matin
0 2 * * * $SERVICE_USER $PROJECT_PATH/backup.sh
EOF
    
    log_success "Script de backup créé"
}

display_deployment_info() {
    log_success "Déploiement terminé avec succès !"
    echo
    echo "=================================================================="
    echo "INFORMATIONS DE DÉPLOIEMENT"
    echo "=================================================================="
    echo "Domaine: https://$DOMAIN"
    echo "Chemin du projet: $PROJECT_PATH"
    echo "Service Django: $PROJECT_NAME"
    echo "Base de données: $DB_NAME"
    echo "Utilisateur DB: $DB_USER"
    echo
    echo "URLS IMPORTANTES:"
    echo "- Application: https://$DOMAIN"
    echo "- Admin Django: https://$DOMAIN/admin"
    echo "- API: https://$DOMAIN/api"
    echo
    echo "COMMANDES UTILES:"
    echo "- Redémarrer l'application: sudo systemctl restart $PROJECT_NAME"
    echo "- Voir les logs: sudo journalctl -u $PROJECT_NAME -f"
    echo "- Backup: $PROJECT_PATH/backup.sh"
    echo "- Logs Nginx: tail -f /var/log/nginx/access.log"
    echo "=================================================================="
}

# =============================================================================
# FONCTION PRINCIPALE
# =============================================================================

main() {
    echo "=================================================================="
    echo "DÉPLOIEMENT AUTOMATISÉ DE SALON PAIEMENT"
    echo "=================================================================="
    echo
    
    # Exécuter les étapes de déploiement
    check_requirements
    install_system_packages
    setup_database
    setup_project
    setup_python_environment
    setup_django
    build_frontend
    setup_gunicorn
    setup_nginx
    setup_ssl
    setup_security
    setup_monitoring
    create_backup_script
    display_deployment_info
    
    echo
    log_success "Toutes les étapes de déploiement sont terminées !"
}

# Exécuter la fonction principale
main "$@"
