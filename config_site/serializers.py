from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer pour les paramètres du site"""
    
    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteSettings
        fields = [
            'id',
            'site_title',
            'site_subtitle', 
            'welcome_message',
            'logo',
            'logo_url',
            'favicon',
            'favicon_url',
            'theme',
            'font_size',
            'primary_color',
            'secondary_color',
            'contact_email',
            'contact_phone',
            'meta_description',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        """Retourne l'URL complète du logo"""
        if obj.logo and hasattr(obj.logo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_favicon_url(self, obj):
        """Retourne l'URL complète du favicon"""
        if obj.favicon and hasattr(obj.favicon, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.favicon.url)
            return obj.favicon.url
        return None
    
    def validate_primary_color(self, value):
        """Valide le format de la couleur principale"""
        if not value.startswith('#') or len(value) not in [4, 7]:
            raise serializers.ValidationError("La couleur principale doit être au format hexadécimal (#FFD700 ou #FD0)")
        return value
    
    def validate_secondary_color(self, value):
        """Valide le format de la couleur secondaire"""
        if not value.startswith('#') or len(value) not in [4, 7]:
            raise serializers.ValidationError("La couleur secondaire doit être au format hexadécimal (#E3F2FD ou #E3F)")
        return value


class SiteSettingsUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des paramètres du site"""
    
    class Meta:
        model = SiteSettings
        fields = [
            'site_title',
            'site_subtitle',
            'welcome_message',
            'logo',
            'favicon',
            'primary_color',
            'secondary_color',
            'contact_email',
            'contact_phone',
            'meta_description'
        ]
    
    def validate_primary_color(self, value):
        """Valide le format de la couleur principale"""
        if not value.startswith('#') or len(value) not in [4, 7]:
            raise serializers.ValidationError("La couleur principale doit être au format hexadécimal (#FFD700 ou #FD0)")
        return value
    
    def validate_secondary_color(self, value):
        """Valide le format de la couleur secondaire"""
        if not value.startswith('#') or len(value) not in [4, 7]:
            raise serializers.ValidationError("La couleur secondaire doit être au format hexadécimal (#E3F2FD ou #E3F)")
        return value
