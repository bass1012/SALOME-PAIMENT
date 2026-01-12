from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QRCodeViewSet

# Créer un routeur et enregistrer les viewsets
router = DefaultRouter()
router.register(r'qr-codes', QRCodeViewSet)

# Les URLs de l'API sont déterminées automatiquement par le routeur
urlpatterns = [
    path('api/', include(router.urls)),
]
