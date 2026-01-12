from django.contrib import admin
from .models import QRCode


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ['id', 'type_qr', 'client', 'statut', 'date_generation', 'date_expiration', 'nombre_scans', 'actif']
    list_filter = ['type_qr', 'statut', 'actif', 'date_generation']
    search_fields = ['client__nom', 'client__prenom', 'client__telephone', 'contenu']
    readonly_fields = ['id', 'date_generation', 'date_scan', 'nombre_scans']
    fieldsets = (
        ('Informations de base', {
            'fields': ('type_qr', 'client', 'statut')
        }),
        ('Contenu et image', {
            'fields': ('contenu', 'image_qr')
        }),
        ('Dates et suivi', {
            'fields': ('date_generation', 'date_scan', 'date_expiration')
        }),
        ('Informations système', {
            'fields': ('id', 'nombre_scans', 'actif'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-date_generation']
    list_per_page = 25
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('client')
