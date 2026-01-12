from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    """Configuration de l'interface d'administration pour le modèle Utilisateur"""
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'telephone', 'actif', 'date_creation')
    list_filter = ('role', 'actif', 'is_staff', 'is_superuser', 'date_creation')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'telephone')
    ordering = ('-date_creation',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'telephone', 'actif', 'date_creation', 'date_modification')
        }),
    )
    
    readonly_fields = ('date_creation', 'date_modification')
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'telephone', 'actif')
        }),
    )
