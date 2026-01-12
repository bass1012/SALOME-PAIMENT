from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementViewSet, TransactionExterneViewSet

# Créer un routeur et enregistrer les viewsets
router = DefaultRouter()
router.register(r'paiements', PaiementViewSet)
router.register(r'transactions-externes', TransactionExterneViewSet)

# Les URLs de l'API sont déterminées automatiquement par le routeur
urlpatterns = [
    path('api/', include(router.urls)),
]
