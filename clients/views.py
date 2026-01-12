from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from salon_paiement.permissions import CanManageClients, IsOwnerOrAdmin, IsVendeurOrAdmin
from django.db.models import Q, ProtectedError, Avg
from django.utils.translation import gettext_lazy as _
from .models import Client, ClientFeedback
from .serializers import ClientSerializer, ClientListSerializer, ClientDetailSerializer, ClientFeedbackSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des clients
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, CanManageClients]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'list':
            return ClientListSerializer
        elif self.action == 'retrieve':
            return ClientDetailSerializer
        return ClientSerializer
    
    def get_queryset(self):
        """Filtrer les clients selon les paramètres de recherche"""
        queryset = Client.objects.all()
        
        # Recherche par nom, prénom ou téléphone
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(telephone__icontains=search)
            )
        
        # Filtrer par statut actif/inactif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')
        
        return queryset.order_by('-date_creation')
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def recherche_par_telephone(self, request):
        """Rechercher un client par son numéro de téléphone
        Accessible publiquement pour le processus de session de paiement
        """
        telephone = request.data.get('telephone', None)
        if not telephone:
            return Response(
                {'error': 'Le numéro de téléphone est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(telephone=telephone)
            serializer = ClientDetailSerializer(client)
            return Response(serializer.data)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def desactiver(self, request, pk=None):
        """Désactiver un client"""
        client = self.get_object()
        client.actif = False
        client.save()
        return Response({'message': 'Client désactivé avec succès'})
    
    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Activer un client"""
        client = self.get_object()
        client.actif = True
        client.save()
        return Response({'message': 'Client activé avec succès'})
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un client avec gestion des erreurs de contraintes"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({'message': 'Client supprimé avec succès'}, status=status.HTTP_200_OK)
        except ProtectedError as e:
            # Récupérer les objets liés qui empêchent la suppression
            related_objects = []
            for field in instance._meta.get_fields():
                if hasattr(field, 'related_query_name') and hasattr(instance, field.get_accessor_name()):
                    related_manager = getattr(instance, field.get_accessor_name())
                    if related_manager.exists():
                        related_objects.append(f"{field.name} ({related_manager.count()})")
            
            error_message = _(
                "Impossible de supprimer ce client car il est lié à d'autres données. "
                f"Données liées : {', '.join(related_objects)}. "
                "Veuillez désactiver le client à la place."
            )
            return Response(
                {'error': error_message, 'related_objects': related_objects},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la suppression du client: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClientFeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des feedbacks clients
    """
    queryset = ClientFeedback.objects.all()
    serializer_class = ClientFeedbackSerializer
    permission_classes = [AllowAny]  # Accessible publiquement pour le processus de feedback
    
    def get_queryset(self):
        """Filtrer les feedbacks selon les paramètres"""
        queryset = ClientFeedback.objects.all()
        
        # Filtrer par numéro de téléphone
        telephone = self.request.query_params.get('telephone', None)
        if telephone:
            queryset = queryset.filter(client_telephone=telephone)
        
        # Filtrer par note maximale
        max_rating = self.request.query_params.get('max_rating', None)
        if max_rating:
            try:
                max_rating = int(max_rating)
                queryset = queryset.filter(rating__lte=max_rating)
            except ValueError:
                pass
        
        return queryset.order_by('-date_creation')
    
    def perform_create(self, serializer):
        """Créer un nouveau feedback"""
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Obtenir des statistiques sur les feedbacks"""
        queryset = self.get_queryset()
        
        total_feedbacks = queryset.count()
        if total_feedbacks == 0:
            return Response({
                'total_feedbacks': 0,
                'average_rating': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            })
        
        # Calculer la moyenne des notes
        average_rating = queryset.aggregate(models.Avg('rating'))['rating__avg'] or 0
        
        # Distribution des notes
        rating_distribution = {}
        for i in range(1, 6):
            rating_distribution[i] = queryset.filter(rating=i).count()
        
        return Response({
            'total_feedbacks': total_feedbacks,
            'average_rating': round(average_rating, 2),
            'rating_distribution': rating_distribution
        })
