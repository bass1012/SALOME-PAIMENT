from rest_framework import permissions
from .models import Utilisateur


class IsVendeur(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur est un vendeur
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.est_vendeur()


class IsAdmin(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur est un admin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.est_admin()


class IsVendeurOrAdmin(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur est un vendeur ou un admin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.est_vendeur() or request.user.est_admin())


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur est le propriétaire de la ressource ou un admin
    """
    def has_object_permission(self, request, view, obj):
        # L'admin a accès à tout
        if request.user.est_admin():
            return True
        
        # Vérifier si l'utilisateur est le propriétaire
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        elif hasattr(obj, 'utilisateur'):
            return obj.utilisateur == request.user
        elif hasattr(obj, 'id') and hasattr(request.user, 'id'):
            # Pour les objets utilisateur eux-mêmes
            return obj.id == request.user.id
        
        return False


class IsActiveUser(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur est actif
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif


class CanManageUsers(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer d'autres utilisateurs
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.est_admin()


class CanViewDashboard(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut accéder au dashboard
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanManageClients(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer les clients
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanManagePrestations(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer les prestations
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanManagePaiements(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer les paiements
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanManageSessions(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer les sessions de paiement
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanViewReports(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut voir les rapports
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and (request.user.est_vendeur() or request.user.est_admin())


class CanManageSystem(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut gérer les paramètres système
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.actif and request.user.est_admin()


class CanViewCreatePaiements(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut voir et créer des paiements
    Les vendeurs peuvent voir et créer, mais pas modifier ou supprimer
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.actif:
            return False
        
        # Les admins peuvent tout faire
        if request.user.est_admin():
            return True
        
        # Les vendeurs peuvent seulement voir et créer
        if request.user.est_vendeur():
            return view.action in ['list', 'retrieve', 'create']
        
        return False


class CanViewCreatePrestations(permissions.BasePermission):
    """
    Permission pour vérifier si l'utilisateur peut voir et créer des prestations
    Les vendeurs peuvent voir et créer, mais pas modifier ou supprimer
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.actif:
            return False
        
        # Les admins peuvent tout faire
        if request.user.est_admin():
            return True
        
        # Les vendeurs peuvent seulement voir et créer
        if request.user.est_vendeur():
            return view.action in ['list', 'retrieve', 'create']
        
        return False
