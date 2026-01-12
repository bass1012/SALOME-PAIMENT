from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from .models import SiteSettings
from .serializers import SiteSettingsSerializer, SiteSettingsUpdateSerializer


class SiteSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des paramètres du site"""
    
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """S'assurer qu'il y a toujours une instance de paramètres"""
        if not SiteSettings.objects.exists():
            SiteSettings.get_settings()
        return super().get_queryset()
    
    def get_object(self):
        """Toujours retourner la première (et unique) instance"""
        queryset = self.get_queryset()
        obj = queryset.first()
        if obj is None:
            obj = SiteSettings.get_settings()
        self.check_object_permissions(self.request, obj)
        return obj
    
    def get_serializer_class(self):
        """Utiliser le serializer approprié selon l'action"""
        if self.action in ['update', 'partial_update']:
            return SiteSettingsUpdateSerializer
        return SiteSettingsSerializer
    
    @method_decorator(cache_page(60 * 5))  # Cache de 5 minutes
    @method_decorator(vary_on_headers('Authorization'))
    def list(self, request, *args, **kwargs):
        """Récupérer les paramètres du site (avec cache)"""
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def retrieve(self, request, *args, **kwargs):
        """Récupérer les paramètres du site (avec cache)"""
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Mettre à jour les paramètres du site"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Invalider le cache après mise à jour
        from django.core.cache import cache
        cache.clear()
        
        # Retourner les données mises à jour avec le serializer complet
        response_serializer = SiteSettingsSerializer(instance)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Endpoint public pour récupérer les paramètres du site sans authentification"""
        try:
            settings = SiteSettings.get_settings()
            serializer = SiteSettingsSerializer(settings, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': 'Erreur lors de la récupération des paramètres', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Vider le cache des paramètres"""
        from django.core.cache import cache
        cache.clear()
        return Response({'message': 'Cache vidé avec succès'})
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Récupérer les valeurs par défaut"""
        defaults = {
            'site_title': 'Salon de Paiement',
            'site_subtitle': 'Système de gestion de paiements',
            'welcome_message': 'Bienvenue sur votre espace de gestion',
            'primary_color': '#FFD700',
            'secondary_color': '#E3F2FD',
            'contact_email': '',
            'contact_phone': '',
            'meta_description': 'Système de gestion de paiements pour salon'
        }
        return Response(defaults)
