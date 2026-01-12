from django.db import models
from django.core.validators import FileExtensionValidator

class SiteSettings(models.Model):
    """Modèle pour stocker les paramètres personnalisés du site"""
    
    # Paramètres principaux
    site_title = models.CharField(
        max_length=200, 
        verbose_name="Titre du site",
        default="Salon de Paiement",
        help_text="Le titre principal qui apparaît sur le site"
    )
    
    site_subtitle = models.CharField(
        max_length=300, 
        verbose_name="Sous-titre du site",
        default="Système de gestion de paiements",
        help_text="Le sous-titre qui apparaît sous le titre principal"
    )
    
    welcome_message = models.TextField(
        verbose_name="Message de bienvenue",
        default="Bienvenue sur votre espace de gestion",
        help_text="Message personnalisé pour la page d'accueil"
    )
    
    # Logo
    logo = models.ImageField(
        upload_to='logos/',
        verbose_name="Logo du site",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'svg', 'webp'])],
        help_text="Format recommandé: PNG ou SVG avec fond transparent. Taille max: 2MB"
    )
    
    favicon = models.ImageField(
        upload_to='favicon/',
        verbose_name="Favicon",
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['ico', 'png', 'jpg', 'jpeg'])],
        help_text="Favicon pour le navigateur. Format recommandé: 32x32px ou 64x64px"
    )
    
    # Thème et apparence
    theme = models.CharField(
        max_length=10,
        verbose_name="Thème",
        default="auto",
        choices=[
            ('clair', 'Clair'),
            ('sombre', 'Sombre'),
            ('auto', 'Auto'),
        ],
        help_text="Thème de l'application"
    )
    
    font_size = models.CharField(
        max_length=10,
        verbose_name="Taille de police",
        default="moyenne",
        choices=[
            ('petite', 'Petite'),
            ('moyenne', 'Moyenne'),
            ('grande', 'Grande'),
        ],
        help_text="Taille de police par défaut"
    )
    
    # Couleurs personnalisées
    primary_color = models.CharField(
        max_length=7, 
        verbose_name="Couleur principale",
        default="#FFD700",
        help_text="Couleur principale du thème (format hex: #FFD700)"
    )
    
    secondary_color = models.CharField(
        max_length=7, 
        verbose_name="Couleur secondaire",
        default="#E3F2FD",
        help_text="Couleur secondaire du thème (format hex: #E3F2FD)"
    )
    
    # Informations de contact
    contact_email = models.EmailField(
        verbose_name="Email de contact",
        blank=True,
        help_text="Email de contact affiché sur le site"
    )
    
    contact_phone = models.CharField(
        max_length=20, 
        verbose_name="Téléphone de contact",
        blank=True,
        help_text="Numéro de téléphone de contact"
    )
    
    # Métadonnées
    meta_description = models.TextField(
        verbose_name="Meta description",
        default="Système de gestion de paiements pour salon",
        help_text="Description pour les moteurs de recherche"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        verbose_name = "Paramètres du site"
        verbose_name_plural = "Paramètres du site"
        
    def __str__(self):
        return f"Paramètres du site - {self.site_title}"
    
    def save(self, *args, **kwargs):
        # S'assurer qu'il n'y a qu'une seule instance de configuration
        if not self.pk and SiteSettings.objects.exists():
            # Si c'est une nouvelle création et qu'il existe déjà une instance
            raise ValueError("Il ne peut y avoir qu'une seule instance de SiteSettings")
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Méthode pour obtenir les paramètres actuels ou en créer des par défaut"""
        try:
            return cls.objects.get()
        except cls.DoesNotExist:
            return cls.objects.create()
    
    def get_logo_url(self):
        """Retourne l'URL du logo ou une valeur par défaut"""
        if self.logo and hasattr(self.logo, 'url'):
            return self.logo.url
        return None
    
    def get_favicon_url(self):
        """Retourne l'URL du favicon ou une valeur par défaut"""
        if self.favicon and hasattr(self.favicon, 'url'):
            return self.favicon.url
        return None
