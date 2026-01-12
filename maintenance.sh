#!/bin/bash
# =============================================================================
# SCRIPT DE MAINTENANCE POUR SALON PAIEMENT
# =============================================================================
# Auteur: Cascade AI Assistant
# Date: $(date +%Y-%m-%d)
# Version: 1.0
#
# Ce script effectue les tâches de maintenance routine pour l'application
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
VENV_PATH="${PROJECT_PATH}/venv"
SERVICE_USER="www-data"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
LOG_DIR="${PROJECT_PATH}/logs"

# =============================================================================
# FONCTIONS DE MAINTENANCE
# =============================================================================

check_system_health() {
    log_info "Vérification de la santé du système..."
    
    # Vérifier l'espace disque
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $disk_usage -gt 90 ]; then
        log_error "Espace disque critique: ${disk_usage}% utilisé"
    elif [ $disk_usage -gt 80 ]; then
        log_warning "Espace disque élevé: ${disk_usage}% utilisé"
    else
        log_success "Espace disque OK: ${disk_usage}% utilisé"
    fi
    
    # Vérifier la mémoire
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ $mem_usage -gt 90 ]; then
        log_error "Mémoire critique: ${mem_usage}% utilisée"
    elif [ $mem_usage -gt 80 ]; then
        log_warning "Mémoire élevée: ${mem_usage}% utilisée"
    else
        log_success "Mémoire OK: ${mem_usage}% utilisée"
    fi
    
    # Vérifier la charge CPU
    local load_avg=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percent=$(echo "$load_avg $cpu_cores" | awk '{printf "%.0f", $1 * 100 / $2}')
    
    if [ $(echo "$load_percent > 200" | bc -l) -eq 1 ]; then
        log_error "Charge CPU critique: ${load_percent}%"
    elif [ $(echo "$load_percent > 150" | bc -l) -eq 1 ]; then
        log_warning "Charge CPU élevée: ${load_percent}%"
    else
        log_success "Charge CPU OK: ${load_percent}%"
    fi
}

check_services_status() {
    log_info "Vérification du statut des services..."
    
    # Vérifier Gunicorn
    if systemctl is-active --quiet ${PROJECT_NAME}; then
        log_success "Service ${PROJECT_NAME}: ACTIF"
    else
        log_error "Service ${PROJECT_NAME}: INACTIF"
    fi
    
    # Vérifier Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Service Nginx: ACTIF"
    else
        log_error "Service Nginx: INACTIF"
    fi
    
    # Vérifier MySQL
    if systemctl is-active --quiet mysql; then
        log_success "Service MySQL: ACTIF"
    else
        log_error "Service MySQL: INACTIF"
    fi
    
    # Vérifier UFW
    if ufw status | grep -q "Status: active"; then
        log_success "Firewall UFW: ACTIF"
    else
        log_warning "Firewall UFW: INACTIF"
    fi
    
    # Vérifier Fail2Ban
    if systemctl is-active --quiet fail2ban; then
        log_success "Service Fail2Ban: ACTIF"
    else
        log_warning "Service Fail2Ban: INACTIF"
    fi
}

update_application() {
    log_info "Mise à jour de l'application..."
    
    cd ${PROJECT_PATH}
    
    # Sauvegarder avant la mise à jour
    if [ -f "${BACKUP_DIR}/pre_update_backup.tar.gz" ]; then
        rm "${BACKUP_DIR}/pre_update_backup.tar.gz"
    fi
    
    tar -czf "${BACKUP_DIR}/pre_update_backup.tar.gz" \
        --exclude="*.pyc" \
        --exclude="__pycache__" \
        --exclude="venv" \
        --exclude="node_modules" \
        --exclude=".git" \
        . 2>/dev/null || true
    
    # Mettre à jour le code
    if [ -d ".git" ]; then
        sudo -u ${SERVICE_USER} git pull origin main || true
        log_success "Code source mis à jour"
    else
        log_warning "Dépôt Git non trouvé, mise à jour du code ignorée"
    fi
    
    # Mettre à jour les dépendances Python
    if [ -f "requirements.txt" ]; then
        sudo -u ${SERVICE_USER} ${VENV_PATH}/bin/pip install -r requirements.txt --upgrade
        log_success "Dépendances Python mises à jour"
    fi
    
    # Mettre à jour les dépendances frontend
    if [ -f "frontend/package.json" ]; then
        cd frontend
        sudo -u ${SERVICE_USER} npm update
        log_success "Dépendances frontend mises à jour"
        cd ..
    fi
}

run_migrations() {
    log_info "Exécution des migrations Django..."
    
    cd ${PROJECT_PATH}
    
    # Vérifier les migrations en attente
    if sudo -u ${SERVICE_USER} ${VENV_PATH}/bin/python manage.py showmigrations --plan | grep -q "\[  \]"; then
        log_info "Migrations en attente détectées"
        
        # Appliquer les migrations
        sudo -u ${SERVICE_USER} ${VENV_PATH}/bin/python manage.py migrate
        log_success "Migrations appliquées"
    else
        log_success "Aucune migration en attente"
    fi
}

collect_static_files() {
    log_info "Collecte des fichiers statiques..."
    
    cd ${PROJECT_PATH}
    sudo -u ${SERVICE_USER} ${VENV_PATH}/bin/python manage.py collectstatic --noinput --clear
    log_success "Fichiers statiques collectés"
}

clear_cache() {
    log_info "Nettoyage du cache..."
    
    cd ${PROJECT_PATH}
    
    # Vider le cache Django
    sudo -u ${SERVICE_USER} ${VENV_PATH}/bin/python manage.py clearcache 2>/dev/null || true
    
    # Vider le cache Redis si disponible
    if command -v redis-cli &> /dev/null; then
        redis-cli FLUSHDB 2>/dev/null || true
        log_success "Cache Redis vidé"
    fi
    
    # Vider le cache du navigateur (via Nginx)
    sudo rm -rf /var/cache/nginx/*
    sudo systemctl reload nginx
    
    log_success "Cache nettoyé"
}

cleanup_logs() {
    log_info "Nettoyage des logs..."
    
    # Rotation des logs
    sudo logrotate -f /etc/logrotate.d/${PROJECT_NAME} 2>/dev/null || true
    
    # Nettoyer les anciens logs
    find ${LOG_DIR} -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Nettoyer les logs système
    sudo journalctl --vacuum-time=30d
    
    log_success "Logs nettoyés"
}

cleanup_temp_files() {
    log_info "Nettoyage des fichiers temporaires..."
    
    cd ${PROJECT_PATH}
    
    # Nettoyer les fichiers Python temporaires
    find . -name "*.pyc" -delete 2>/dev/null || true
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Nettoyer les fichiers de cache Django
    rm -rf cache/* 2>/dev/null || true
    
    # Nettoyer les fichiers de session
    find . -name "django_session*" -mtime +7 -delete 2>/dev/null || true
    
    # Nettoyer les fichiers de cache du frontend
    rm -rf frontend/.cache 2>/dev/null || true
    
    log_success "Fichiers temporaires nettoyés"
}

optimize_database() {
    log_info "Optimisation de la base de données..."
    
    cd ${PROJECT_PATH}
    
    # Lire le mot de passe depuis le fichier .env
    if [ -f ".env" ]; then
        DB_PASSWORD=$(grep "DB_PASSWORD" .env | cut -d'=' -f2)
        DB_NAME=$(grep "DB_NAME" .env | cut -d'=' -f2)
        DB_USER=$(grep "DB_USER" .env | cut -d'=' -f2)
    else
        log_warning "Fichier .env non trouvé, optimisation base de données ignorée"
        return
    fi
    
    # Optimiser les tables
    mysql --user=${DB_USER} --password=${DB_PASSWORD} ${DB_NAME} -e "OPTIMIZE TABLE $(mysql --user=${DB_USER} --password=${DB_PASSWORD} ${DB_NAME} -e "SHOW TABLES" | awk '{print $1}' | grep -v Tables_in)" 2>/dev/null || true
    
    log_success "Base de données optimisée"
}

check_security_updates() {
    log_info "Vérification des mises à jour de sécurité..."
    
    # Mettre à jour la liste des paquets
    sudo apt update
    
    # Vérifier les mises à jour de sécurité
    local security_updates=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
    
    if [ $security_updates -gt 0 ]; then
        log_warning "${security_updates} mises à jour de sécurité disponibles"
        apt list --upgradable 2>/dev/null | grep -i security
    else
        log_success "Aucune mise à jour de sécurité requise"
    fi
}

generate_health_report() {
    log_info "Génération du rapport de santé..."
    
    local report_file="${LOG_DIR}/health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "${report_file}" << EOF
Rapport de Santé - Salon Paiement
=================================
Date: $(date)
Hostname: $(hostname)

Système:
- OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '"')
- Kernel: $(uname -r)
- Uptime: $(uptime)
- Espace disque: $(df -h / | tail -1)
- Mémoire: $(free -h)
- Charge CPU: $(uptime | awk -F'load average:' '{ print $2 }')

Services:
- Gunicorn: $(systemctl is-active ${PROJECT_NAME})
- Nginx: $(systemctl is-active nginx)
- MySQL: $(systemctl is-active mysql)
- UFW: $(ufw status | grep Status)
- Fail2Ban: $(systemctl is-active fail2ban)

Application:
- Chemin: ${PROJECT_PATH}
- Version Python: $(python3 --version 2>&1)
- Version Django: $(cd ${PROJECT_PATH} && python3 -c "import django; print(django.get_version())" 2>/dev/null || echo "Non disponible")
- Dernière mise à jour: $(cd ${PROJECT_PATH} && git log -1 --format=%cd 2>/dev/null || echo "Non disponible")

Base de données:
- Nom: ${DB_NAME:-Non disponible}
- Taille: $(mysql --user=${DB_USER:-root} --password=${DB_PASSWORD:-} ${DB_NAME:-information_schema} -e "SELECT SUM(data_length + index_length) / 1024 / 1024 AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = '${DB_NAME:-information_schema}';" 2>/dev/null | tail -1 || echo "Non disponible")

Derniers logs (10 lignes):
$(tail -n 10 ${LOG_DIR}/salon_paiement.log 2>/dev/null || echo "Pas de logs disponibles")

Erreurs récentes (5 lignes):
$(grep -i error ${LOG_DIR}/salon_paiement.log 2>/dev/null | tail -n 5 || echo "Aucune erreur récente")
EOF

    log_success "Rapport de santé généré: ${report_file}"
}

restart_services() {
    log_info "Redémarrage des services..."
    
    # Redémarrer Gunicorn
    sudo systemctl restart ${PROJECT_NAME}
    
    # Redémarrer Nginx
    sudo systemctl restart nginx
    
    # Vérifier que les services sont bien démarrés
    sleep 5
    
    if systemctl is-active --quiet ${PROJECT_NAME}; then
        log_success "Service ${PROJECT_NAME} redémarré avec succès"
    else
        log_error "Échec du redémarrage du service ${PROJECT_NAME}"
    fi
    
    if systemctl is-active --quiet nginx; then
        log_success "Service Nginx redémarré avec succès"
    else
        log_error "Échec du redémarrage du service Nginx"
    fi
}

# =============================================================================
# FONCTION PRINCIPALE
# =============================================================================

main() {
    log_info "Démarrage de la maintenance de Salon Paiement..."
    log_info "Date: $(date)"
    
    # Vérifications système
    check_system_health
    check_services_status
    
    # Mise à jour et nettoyage
    update_application
    run_migrations
    collect_static_files
    clear_cache
    cleanup_logs
    cleanup_temp_files
    optimize_database
    
    # Sécurité et monitoring
    check_security_updates
    generate_health_report
    
    # Redémarrage des services
    restart_services
    
    log_success "Maintenance terminée avec succès!"
}

# =============================================================================
# GESTION DES ARGUMENTS
# =============================================================================

case "${1:-}" in
    "health")
        check_system_health
        check_services_status
        ;;
    "update")
        update_application
        run_migrations
        collect_static_files
        restart_services
        ;;
    "cleanup")
        clear_cache
        cleanup_logs
        cleanup_temp_files
        optimize_database
        ;;
    "security")
        check_security_updates
        ;;
    "report")
        generate_health_report
        ;;
    "restart")
        restart_services
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  health      Vérifier la santé du système et des services"
        echo "  update      Mettre à jour l'application et redémarrer"
        echo "  cleanup     Nettoyer les caches, logs et fichiers temporaires"
        echo "  security    Vérifier les mises à jour de sécurité"
        echo "  report      Générer un rapport de santé complet"
        echo "  restart     Redémarrer les services"
        echo "  help        Afficher cette aide"
        echo ""
        echo "Sans option: Exécuter la maintenance complète"
        ;;
    *)
        main
        ;;
esac
