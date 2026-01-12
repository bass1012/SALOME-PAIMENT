#!/usr/bin/env python
"""
Script pour créer des utilisateurs de démonstration pour le système Salon Paiement
"""

import os
import sys
import django

# Ajouter le chemin du projet
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'salon_paiement.settings')
django.setup()

from salon_paiement.models import Utilisateur

def create_demo_users():
    """Crée des utilisateurs de démonstration"""
    
    # Définition des utilisateurs à créer
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@salon.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'Système',
            'role': 'admin',
            'telephone': '+2250708085501',
            'actif': True
        },
        {
            'username': 'vendeur1',
            'email': 'vendeur1@salon.com',
            'password': 'vendeur123',
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'role': 'vendeur',
            'telephone': '+2250708085502',
            'actif': True
        },
        {
            'username': 'vendeur2',
            'email': 'vendeur2@salon.com',
            'password': 'vendeur123',
            'first_name': 'Marie',
            'last_name': 'Curie',
            'role': 'vendeur',
            'telephone': '+2250708085503',
            'actif': True
        },
        {
            'username': 'vendeur3',
            'email': 'vendeur3@salon.com',
            'password': 'vendeur123',
            'first_name': 'Paul',
            'last_name': 'Martin',
            'role': 'vendeur',
            'telephone': '+2250708085504',
            'actif': True
        },
        {
            'username': 'manager',
            'email': 'manager@salon.com',
            'password': 'manager123',
            'first_name': 'Sophie',
            'last_name': 'Laurent',
            'role': 'admin',
            'telephone': '+2250708085505',
            'actif': True
        }
    ]
    
    created_users = []
    existing_users = []
    
    for user_data in users_data:
        username = user_data['username']
        
        # Vérifier si l'utilisateur existe déjà
        if Utilisateur.objects.filter(username=username).exists():
            existing_users.append(username)
            print(f"L'utilisateur '{username}' existe déjà.")
            continue
        
        # Créer l'utilisateur
        try:
            user = Utilisateur.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                telephone=user_data['telephone'],
                actif=user_data['actif']
            )
            created_users.append(user)
            print(f"✅ Utilisateur '{username}' créé avec succès.")
        except Exception as e:
            print(f"❌ Erreur lors de la création de l'utilisateur '{username}': {e}")
    
    # Résumé
    print(f"\n📊 RÉSUMÉ:")
    print(f"   Utilisateurs créés: {len(created_users)}")
    print(f"   Utilisateurs existants: {len(existing_users)}")
    print(f"   Total utilisateurs dans la base: {Utilisateur.objects.count()}")
    
    if created_users:
        print(f"\n🔑 IDENTIFIANTS DE CONNEXION:")
        for user in created_users:
            print(f"   {user.username}: {user_data['password']}")
    
    return created_users

if __name__ == '__main__':
    print("🚀 Création des utilisateurs de démonstration...")
    create_demo_users()
    print("\n✅ Terminé!")
