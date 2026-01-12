"""
URL configuration for salon_paiement project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static

# Importer les routeurs des applications
from clients.urls import router as clients_router
from prestations.urls import router as prestations_router
from paiements.urls import router as paiements_router
from qr_codes.urls import router as qr_codes_router
from config_site.urls import router as config_site_router
from salon_paiement.views import SessionPaiementViewSet, UtilisateurViewSet

# Combiner tous les routeurs
router = routers.DefaultRouter()
router.registry.extend(clients_router.registry)
router.registry.extend(prestations_router.registry)
router.registry.extend(paiements_router.registry)
router.registry.extend(qr_codes_router.registry)
router.registry.extend(config_site_router.registry)
router.register(r'sessions-paiement', SessionPaiementViewSet, basename='sessions-paiement')
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateurs')

urlpatterns = [
    path('admin/', admin.site.urls),
    # API REST principale
    path('api/', include(router.urls)),
    # Documentation API DRF
    path('api-auth/', include('rest_framework.urls')),
]

# URLs pour les fichiers médias en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
