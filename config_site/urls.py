from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteSettingsViewSet

# Créer un router pour les ViewSets
router = DefaultRouter()
router.register(r'settings', SiteSettingsViewSet, basename='sitesettings')

urlpatterns = [
    path('api/', include(router.urls)),
]
