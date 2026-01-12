#!/bin/bash
# =============================================================================
# SCRIPT DE BACKUP POUR SALON PAIEMENT
# =============================================================================
# Auteur: Cascade AI Assistant
# Date: $(date +%Y-%m-%d)
# Version: 1.0
#
# Ce script effectue des backups complets de l'application Salon Paiement
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
PROJECT_NAME="salon_paiement"
PROJECT_PATH="/var/www/${PROJECT_NAME}"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
DB_NAME="salon_paiement_db"
DB_USER="salon_user"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"

# Créer le répertoire de backup
mkdir -p "${BACKUP_DIR}"

# =============================================================================
# FONCTIONS DE BACKUP
# =============================================================================

backup_database() {
    log_info "Backup de la base de données..."
    
    # Lire le mot de passe depuis le fichier .env
    if [ -f "${PROJECT_PATH}/.env" ]; then
        DB_PASSWORD=$(grep "DB_PASSWORD" "${PROJECT_PATH}/.env" | cut -d'=' -f2)
    else
        log_error "Fichier .env non trouvé"
        exit 1
    fi
    
    # Backup de la base de données
    mysqldump \
        --user=${DB_USER} \
        --password=${DB_PASSWORD} \
        --host=localhost \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        ${DB_NAME} > "${BACKUP_DIR}/${BACKUP_NAME}_database.sql"
    
    # Compresser le backup
    gzip "${BACKUP_DIR}/${BACKUP_NAME}_database.sql"
    
    log_success "Base de données backupée et compressée"
}

backup_files() {
    log_info "Backup des fichiers du projet..."
    
    # Exclure certains répertoires du backup
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz" \
        -C "${PROJECT_PATH}" \
        --exclude="*.pyc" \
        --exclude="__pycache__" \
        --exclude="venv" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="logs/*.log" \
        --exclude="media/cache" \
        .
    
    log_success "Fichiers backupés et compressés"
}

backup_media() {
    log_info "Backup des fichiers médias..."
    
    if [ -d "${PROJECT_PATH}/media" ]; then
        tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_media.tar.gz" \
            -C "${PROJECT_PATH}" \
            media
        
        log_success "Fichiers médias backupés"
    else
        log_warning "Répertoire media non trouvé, backup ignoré"
    fi
}

backup_nginx_config() {
    log_info "Backup de la configuration Nginx..."
    
    if [ -d "/etc/nginx" ]; then
        tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_nginx.tar.gz" \
            -C /etc \
            nginx
        
        log_success "Configuration Nginx backupée"
    else
        log_warning "Configuration Nginx non trouvée, backup ignoré"
    fi
}

backup_systemd_services() {
    log_info "Backup des services systemd..."
    
    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        cp "/etc/systemd/system/${PROJECT_NAME}.service" \
           "${BACKUP_DIR}/${BACKUP_NAME}_service.conf"
        
        log_success "Services systemd backupés"
    else
        log_warning "Service systemd non trouvé, backup ignoré"
    fi
}

create_backup_manifest() {
    log_info "Création du manifeste de backup..."
    
    cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Backup Manifest - Salon Paiement
=================================
Date: $(date)
Timestamp: ${TIMESTAMP}
Hostname: $(hostname)
Backup Name: ${BACKUP_NAME}

Backup Contents:
- Database: ${BACKUP_NAME}_database.sql.gz
- Files: ${BACKUP_NAME}_files.tar.gz
- Media: ${BACKUP_NAME}_media.tar.gz
- Nginx Config: ${BACKUP_NAME}_nginx.tar.gz
- Systemd Service: ${BACKUP_NAME}_service.conf
- Manifest: ${BACKUP_NAME}_manifest.txt

System Information:
- OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')
- Kernel: $(uname -r)
- Uptime: $(uptime)
- Disk Usage: $(df -h / | tail -1 | awk '{print $5}')

Application Information:
- Project Path: ${PROJECT_PATH}
- Database Name: ${DB_NAME}
- Database User: ${DB_USER}
- Python Version: $(python3 --version 2>&1)
- Django Version: $(cd ${PROJECT_PATH} && python3 -c "import django; print(django.get_version())" 2>/dev/null || echo "Not found")

Backup Verification:
- Database Backup Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz" 2>/dev/null | cut -f1 || echo "Not found")
- Files Backup Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz" 2>/dev/null | cut -f1 || echo "Not found")
- Media Backup Size: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}_media.tar.gz" 2>/dev/null | cut -f1 || echo "Not found")
EOF

    log_success "Manifeste de backup créé"
}

verify_backup() {
    log_info "Vérification du backup..."
    
    local verification_failed=0
    
    # Vérifier la base de données
    if [ -f "${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz" ]; then
        if gzip -t "${BACKUP_DIR}/${BACKUP_NAME}_database.sql.gz"; then
            log_success "Backup base de données valide"
        else
            log_error "Backup base de données corrompu"
            verification_failed=1
        fi
    else
        log_error "Backup base de données manquant"
        verification_failed=1
    fi
    
    # Vérifier les fichiers
    if [ -f "${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz" ]; then
        if tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}_files.tar.gz" > /dev/null 2>&1; then
            log_success "Backup fichiers valide"
        else
            log_error "Backup fichiers corrompu"
            verification_failed=1
        fi
    else
        log_error "Backup fichiers manquant"
        verification_failed=1
    fi
    
    if [ $verification_failed -eq 0 ]; then
        log_success "Backup vérifié avec succès"
    else
        log_error "Échec de la vérification du backup"
        exit 1
    fi
}

cleanup_old_backups() {
    log_info "Nettoyage des anciens backups..."
    
    # Trouver et supprimer les backups plus anciens que RETENTION_DAYS
    find "${BACKUP_DIR}" -name "${PROJECT_NAME}_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Compter les backups restants
    backup_count=$(find "${BACKUP_DIR}" -name "${PROJECT_NAME}_backup_*_database.sql.gz" | wc -l)
    log_info "Nombre de backups conservés: ${backup_count}"
    
    log_success "Nettoyage des anciens backups terminé"
}

create_checksums() {
    log_info "Création des sommes de contrôle..."
    
    cd "${BACKUP_DIR}"
    sha256sum "${BACKUP_NAME}"_* > "${BACKUP_NAME}_checksums.sha256"
    
    log_success "Sommes de contrôle créées"
}

send_backup_notification() {
    log_info "Envoi de la notification de backup..."
    
    # Créer un résumé du backup
    local backup_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    local backup_files=$(find "${BACKUP_DIR}" -name "${BACKUP_NAME}_*" | wc -l)
    
    # Vous pouvez intégrer l'envoi d'email ou de notifications ici
    # Exemple avec mail (si configuré):
    # mail -s "Backup Salon Paiement - ${TIMESTAMP}" admin@votre-domaine.com << EOF
    # Backup terminé avec succès!
    # 
    # Détails:
    # - Date: $(date)
    # - Taille totale: ${backup_size}
    # - Fichiers backupés: ${backup_files}
    # - Répertoire: ${BACKUP_DIR}
    # EOF
    
    log_success "Notification de backup envoyée"
}

# =============================================================================
# FONCTION PRINCIPALE
# =============================================================================

main() {
    log_info "Démarrage du backup de Salon Paiement..."
    log_info "Timestamp: ${TIMESTAMP}"
    
    # Exécuter les backups
    backup_database
    backup_files
    backup_media
    backup_nginx_config
    backup_systemd_services
    
    # Créer le manifeste et vérifier
    create_backup_manifest
    verify_backup
    create_checksums
    
    # Nettoyer et notifier
    cleanup_old_backups
    send_backup_notification
    
    log_success "Backup terminé avec succès!"
    log_info "Backup disponible dans: ${BACKUP_DIR}"
    log_info "Fichiers backupés:"
    ls -la "${BACKUP_DIR}/${BACKUP_NAME}"_*
}

# =============================================================================
# GESTION DES ARGUMENTS
# =============================================================================

case "${1:-}" in
    "database")
        backup_database
        ;;
    "files")
        backup_files
        ;;
    "media")
        backup_media
        ;;
    "config")
        backup_nginx_config
        backup_systemd_services
        ;;
    "verify")
        verify_backup
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "list")
        log_info "Backups disponibles:"
        ls -la "${BACKUP_DIR}/${PROJECT_NAME}_backup_"* | grep -v "total"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  database    Backup uniquement de la base de données"
        echo "  files       Backup uniquement des fichiers du projet"
        echo "  media       Backup uniquement des fichiers médias"
        echo "  config      Backup uniquement des configurations"
        echo "  verify      Vérifier l'intégrité du dernier backup"
        echo "  cleanup     Nettoyer les anciens backups"
        echo "  list        Lister les backups disponibles"
        echo "  help        Afficher cette aide"
        echo ""
        echo "Sans option: Effectuer un backup complet"
        ;;
    *)
        main
        ;;
esac
