from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['nom', 'prenom', 'telephone', 'email', 'sexe', 'date_creation', 'actif']
    list_filter = ['sexe', 'actif', 'date_creation']
    search_fields = ['nom', 'prenom', 'telephone', 'email']
    readonly_fields = ['id', 'date_creation', 'date_modification']
    fieldsets = (
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'sexe', 'telephone', 'email')
        }),
        ('Informations complémentaires', {
            'fields': ('date_anniversaire', 'lieu_habitation'),
            'classes': ('collapse',)
        }),
        ('Informations système', {
            'fields': ('id', 'date_creation', 'date_modification', 'actif'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-date_creation']
    list_per_page = 25
