#!/usr/bin/env python
"""
Script pour initialiser les paramètres du site
"""

import os
import sys
import django

# Ajouter le chemin du projet au Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'salon_paiement.settings')
django.setup()

from config_site.models import SiteSettings


def init_site_settings():
    """Initialiser les paramètres du site avec des valeurs par défaut"""
    
    print("Initialisation des paramètres du site...")
    
    # Vérifier si des paramètres existent déjà
    if SiteSettings.objects.exists():
        print("Des paramètres existent déjà. Mise à jour des valeurs par défaut.")
        settings = SiteSettings.objects.first()
    else:
        print("Création des paramètres par défaut.")
        settings = SiteSettings()
    
    # Définir les valeurs par défaut
    settings.site_title = 'Salomé Paiement'
    settings.site_subtitle = 'Système de gestion de paiements'
    settings.welcome_message = 'Bienvenue sur votre espace de gestion'
    settings.primary_color = '#FFD700'
    settings.secondary_color = '#E3F2FD'
    settings.contact_email = ''
    settings.contact_phone = ''
    settings.meta_description = 'Système de gestion de paiements pour salon'
    
    # Sauvegarder les paramètres
    settings.save()
    
    print("Paramètres du site initialisés avec succès !")
    print(f"ID: {settings.id}")
    print(f"Titre: {settings.site_title}")
    print(f"Sous-titre: {settings.site_subtitle}")
    print(f"Couleur principale: {settings.primary_color}")
    print(f"Couleur secondaire: {settings.secondary_color}")
    
    return settings


if __name__ == '__main__':
    init_site_settings()
