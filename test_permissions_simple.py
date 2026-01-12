#!/usr/bin/env python
"""
Script de test simple pour vérifier que les vendeurs ne peuvent pas modifier ou supprimer
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

from salon_paiement.permissions import CanViewCreatePaiements, CanViewCreatePrestations

class MockRequest:
    """Classe pour simuler une requête Django"""
    def __init__(self, user):
        self.user = user

class MockView:
    """Classe pour simuler une vue Django REST Framework"""
    def __init__(self, action):
        self.action = action

class MockUser:
    """Classe pour simuler un utilisateur Django"""
    def __init__(self, role='vendeur', actif=True):
        self.role = role
        self.actif = actif
        self.is_authenticated = True
    
    def est_vendeur(self):
        return self.role == 'vendeur'
    
    def est_admin(self):
        return self.role == 'admin'

def test_payment_permissions():
    """Tester les permissions pour les paiements"""
    print("=== Test des permissions pour les paiements ===")
    
    permission = CanViewCreatePaiements()
    
    # Actions à tester
    actions = ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']
    
    for action in actions:
        # Créer une vue factice
        view = MockView(action)
        
        # Tester pour le vendeur
        vendeur = MockUser('vendeur')
        request_vendeur = MockRequest(vendeur)
        vendeur_has_permission = permission.has_permission(request_vendeur, view)
        
        # Tester pour l'admin
        admin = MockUser('admin')
        request_admin = MockRequest(admin)
        admin_has_permission = permission.has_permission(request_admin, view)
        
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
    
    permission = CanViewCreatePrestations()
    
    # Actions à tester
    actions = ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']
    
    for action in actions:
        # Créer une vue factice
        view = MockView(action)
        
        # Tester pour le vendeur
        vendeur = MockUser('vendeur')
        request_vendeur = MockRequest(vendeur)
        vendeur_has_permission = permission.has_permission(request_vendeur, view)
        
        # Tester pour l'admin
        admin = MockUser('admin')
        request_admin = MockRequest(admin)
        admin_has_permission = permission.has_permission(request_admin, view)
        
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
