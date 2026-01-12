from django.contrib import admin
from .models import Prestation


@admin.register(Prestation)
class PrestationAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type_prestation', 'prix_min', 'prix_max', 'prix_affichage', 'duree_estimee', 'actif']
    list_filter = ['type_prestation', 'actif', 'date_creation']
    search_fields = ['nom', 'description']
    readonly_fields = ['id', 'date_creation', 'date_modification']
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'type_prestation', 'description')
        }),
        ('Tarification', {
            'fields': ('prix_min', 'prix_max')
        }),
        ('Informations complémentaires', {
            'fields': ('duree_estimee', 'actif'),
            'classes': ('collapse',)
        }),
        ('Informations système', {
            'fields': ('id', 'date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['type_prestation', 'nom']
    list_per_page = 25
