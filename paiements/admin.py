from django.contrib import admin
from .models import Paiement, TransactionExterne


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'prestation', 'montant', 'moyen_paiement_affichage', 'statut', 'date_paiement']
    list_filter = ['moyen_paiement', 'operateur_mobile', 'statut', 'date_paiement']
    search_fields = ['client__nom', 'client__prenom', 'client__telephone', 'reference_paiement']
    readonly_fields = ['id', 'date_paiement', 'date_mise_a_jour']
    fieldsets = (
        ('Informations de base', {
            'fields': ('client', 'prestation', 'montant')
        }),
        ('Moyen de paiement', {
            'fields': ('moyen_paiement', 'operateur_mobile')
        }),
        ('Informations transaction', {
            'fields': ('numero_transaction', 'reference_paiement', 'statut')
        }),
        ('Informations complémentaires', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Informations système', {
            'fields': ('id', 'date_paiement', 'date_mise_a_jour'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-date_paiement']
    list_per_page = 25


@admin.register(TransactionExterne)
class TransactionExterneAdmin(admin.ModelAdmin):
    list_display = ['id', 'paiement', 'fournisseur', 'id_transaction_externe', 'statut_externe', 'date_creation']
    list_filter = ['fournisseur', 'statut_externe', 'date_creation']
    search_fields = ['paiement__reference_paiement', 'id_transaction_externe']
    readonly_fields = ['id', 'date_creation']
    fieldsets = (
        ('Informations de base', {
            'fields': ('paiement', 'fournisseur', 'id_transaction_externe')
        }),
        ('Statut et réponse', {
            'fields': ('statut_externe', 'reponse_api')
        }),
        ('Informations système', {
            'fields': ('id', 'date_creation'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-date_creation']
    list_per_page = 25
