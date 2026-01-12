from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import SiteSettings

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """Configuration de l'interface admin pour les paramètres du site"""
    
    # Affichage dans la liste
    list_display = ['site_title', 'logo_preview', 'primary_color_preview', 'updated_at']
    list_display_links = ['site_title']
    
    # Filtres et recherche
    search_fields = ['site_title', 'site_subtitle', 'contact_email']
    list_filter = ['created_at', 'updated_at']
    
    # Organisation des champs dans le formulaire
    fieldsets = (
        ('Informations principales', {
            'fields': ('site_title', 'site_subtitle', 'welcome_message'),
            'description': 'Configurez le titre et les messages principaux du site'
        }),
        ('Images et branding', {
            'fields': ('logo', 'favicon'),
            'description': 'Téléchargez le logo et le favicon de votre site'
        }),
        ('Couleurs du thème', {
            'fields': ('primary_color', 'secondary_color'),
            'description': 'Personnalisez les couleurs principales du thème'
        }),
        ('Informations de contact', {
            'fields': ('contact_email', 'contact_phone'),
            'description': 'Coordonnées de contact affichées sur le site'
        }),
        ('Référencement (SEO)', {
            'fields': ('meta_description',),
            'description': 'Optimisation pour les moteurs de recherche'
        }),
        ('Informations système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Informations de suivi des modifications'
        }),
    )
    
    # Configuration en lecture seule
    readonly_fields = ['created_at', 'updated_at']
    
    # Personnalisation du template
    change_form_template = 'admin/config_site/sitesettings_change_form.html'
    
    def has_add_permission(self, request):
        """Empêcher la création de multiples instances"""
        if SiteSettings.objects.exists():
            return False
        return super().has_add_permission(request)
    
    def has_delete_permission(self, request, obj=None):
        """Empêcher la suppression de l'instance unique"""
        return False
    
    def logo_preview(self, obj):
        """Afficher un aperçu du logo dans la liste"""
        if obj.logo and hasattr(obj.logo, 'url'):
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;" />',
                obj.logo.url
            )
        return format_html('<span style="color: #999;">Aucun logo</span>')
    logo_preview.short_description = 'Logo'
    
    def primary_color_preview(self, obj):
        """Afficher un aperçu de la couleur principale"""
        return format_html(
            '<div style="width: 30px; height: 30px; background-color: {}; border-radius: 50%; border: 1px solid #ddd; display: inline-block;"></div> {}',
            obj.primary_color,
            obj.primary_color
        )
    primary_color_preview.short_description = 'Couleur principale'
    
    def response_change(self, request, obj):
        """Personnaliser le message de succès"""
        from django.contrib import messages
        messages.success(request, f"Les paramètres du site ont été mis à jour avec succès !")
        return super().response_change(request, obj)
    
    def get_queryset(self, request):
        """S'assurer qu'il y a toujours une instance"""
        qs = super().get_queryset(request)
        if not qs.exists():
            SiteSettings.get_settings()
        return qs
    
    class Media:
        css = {
            'all': ('admin/css/sitesettings_admin.css',)
        }
        js = ('admin/js/sitesettings_admin.js',)
