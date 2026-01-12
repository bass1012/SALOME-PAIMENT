from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrestationViewSet

# Créer un routeur et enregistrer les viewsets
router = DefaultRouter()
router.register(r'prestations', PrestationViewSet)

# Les URLs de l'API sont déterminées automatiquement par le routeur
urlpatterns = [
    path('api/', include(router.urls)),
]
