#!/usr/bin/env python
"""
Script de test pour vérifier que les vendeurs ne peuvent pas modifier ou supprimer
les paiements et les prestations
"""
import os
import sys
import django

# Ajouter le chemin du projet au Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'salon_paiement.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import force_authenticate, APIRequestFactory
from salon_paiement.permissions import CanViewCreatePaiements, CanViewCreatePrestations
from paiements.views import PaiementViewSet
from prestations.views import PrestationViewSet

User = get_user_model()

def create_test_users():
    """Créer des utilisateurs de test"""
    # Créer un vendeur
    vendeur = User.objects.create_user(
        username='test_vendeur',
        telephone='771234567',
        role='vendeur',
        actif=True
    )
    
    # Créer un admin
    admin = User.objects.create_user(
        username='test_admin',
        telephone='777654321',
        role='admin',
        actif=True
    )
    
    return vendeur, admin

def test_payment_permissions():
    """Tester les permissions pour les paiements"""
    print("=== Test des permissions pour les paiements ===")
    
    factory = APIRequestFactory()
    vendeur, admin = create_test_users()
    permission = CanViewCreatePaiements()
    
    # Actions à tester
    actions = ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']
    
    for action in actions:
        # Créer une requête factice
        request = factory.get(f'/api/paiements/')
        
        # Créer une vue factice
        view = PaiementViewSet()
        view.action = action
        
        # Tester pour le vendeur
        force_authenticate(request, user=vendeur)
        vendeur_has_permission = permission.has_permission(request, view)
        
        # Tester pour l'admin
        force_authenticate(request, user=admin)
        admin_has_permission = permission.has_permission(request, view)
        
        print(f"Action '{action}':")
        print(f"  - Vendeur: {'✓ Autorisé' if vendeur_has_permission else '✗ Refusé'}")
        print(f"  - Admin: {'✓ Autorisé' if admin_has_permission else '✗ Refusé'}")
        
        # Vérifier que les vendeurs ne peuvent pas modifier ou supprimer
        if action in ['update', 'partial_update', 'destroy']:
            assert not vendeur_has_permission, f"Le vendeur ne devrait pas pouvoir {action} les paiements"
            assert admin_has_permission, f"L'admin devrait pouvoir {action} les paiements"
        else:
            assert vendeur_has_permission, f"Le vendeur devrait pouvoir {action} les paiements"
            assert admin_has_permission, f"L'admin devrait pouvoir {action} les paiements"
    
    print("✓ Test des permissions pour les paiements réussi\n")

def test_service_permissions():
    """Tester les permissions pour les prestations"""
    print("=== Test des permissions pour les prestations ===")
    
    factory = APIRequestFactory()
    vendeur, admin = create_test_users()
    permission = CanViewCreatePrestations()
    
    # Actions à tester
    actions = ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']
    
    for action in actions:
        # Créer une requête factice
        request = factory.get(f'/api/prestations/')
        
        # Créer une vue factice
        view = PrestationViewSet()
        view.action = action
        
        # Tester pour le vendeur
        force_authenticate(request, user=vendeur)
        vendeur_has_permission = permission.has_permission(request, view)
        
        # Tester pour l'admin
        force_authenticate(request, user=admin)
        admin_has_permission = permission.has_permission(request, view)
        
        print(f"Action '{action}':")
        print(f"  - Vendeur: {'✓ Autorisé' if vendeur_has_permission else '✗ Refusé'}")
        print(f"  - Admin: {'✓ Autorisé' if admin_has_permission else '✗ Refusé'}")
        
        # Vérifier que les vendeurs ne peuvent pas modifier ou supprimer
        if action in ['update', 'partial_update', 'destroy']:
            assert not vendeur_has_permission, f"Le vendeur ne devrait pas pouvoir {action} les prestations"
            assert admin_has_permission, f"L'admin devrait pouvoir {action} les prestations"
        else:
            assert vendeur_has_permission, f"Le vendeur devrait pouvoir {action} les prestations"
            assert admin_has_permission, f"L'admin devrait pouvoir {action} les prestations"
    
    print("✓ Test des permissions pour les prestations réussi\n")

def cleanup_test_users():
    """Nettoyer les utilisateurs de test"""
    User.objects.filter(username__in=['test_vendeur', 'test_admin']).delete()
    print("✓ Nettoyage des utilisateurs de test terminé")

if __name__ == '__main__':
    try:
        test_payment_permissions()
        test_service_permissions()
        print("🎉 Tous les tests de permissions ont réussi!")
        print("\nRésumé:")
        print("- Les vendeurs peuvent: lister, voir, créer des paiements et prestations")
        print("- Les vendeurs ne peuvent PAS: modifier, supprimer des paiements et prestations")
        print("- Les admins peuvent: toutes les opérations")
        
    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        raise
    finally:
        cleanup_test_users()
