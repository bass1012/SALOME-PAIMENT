from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from salon_paiement.permissions import CanManagePrestations, IsOwnerOrAdmin, CanViewCreatePrestations
from django.db.models import Q, ProtectedError
from django.utils.translation import gettext_lazy as _
from .models import Prestation
from .serializers import PrestationSerializer, PrestationListSerializer, PrestationDetailSerializer


class PrestationViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des prestations
    """
    queryset = Prestation.objects.all()
    serializer_class = PrestationSerializer
    
    def get_permissions(self):
        """Retourne les permissions selon l'action"""
        if self.action == 'list':
            # Permettre l'accès public à la liste des prestations
            return [AllowAny()]
        return [IsAuthenticated(), CanViewCreatePrestations()]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'list':
            return PrestationListSerializer
        elif self.action == 'retrieve':
            return PrestationDetailSerializer
        return PrestationSerializer
    
    def get_queryset(self):
        """Filtrer les prestations selon les paramètres de recherche"""
        queryset = Prestation.objects.all()
        
        # Recherche par nom ou description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filtrer par type de prestation
        type_prestation = self.request.query_params.get('type', None)
        if type_prestation:
            queryset = queryset.filter(type_prestation=type_prestation)
        
        # Filtrer par statut actif/inactif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')
        
        return queryset.order_by('type_prestation', 'nom')
    
    @action(detail=False, methods=['get'])
    def par_type(self, request):
        """Retourner les prestations groupées par type"""
        prestations = Prestation.objects.filter(actif=True)
        result = {}
        
        for prestation in prestations:
            type_key = prestation.get_type_prestation_display()
            if type_key not in result:
                result[type_key] = []
            result[type_key].append(PrestationListSerializer(prestation).data)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def creer_prestations_defaut(self, request):
        """Créer les prestations par défaut du salon"""
        prestations_defaut = [
            {
                'type_prestation': 'dreadlocks_nouveau',
                'prix_min': 25000,
                'prix_max': 75000,
                'duree_estimee': 180
            },
            {
                'type_prestation': 'sister_locks',
                'prix_min': 50000,
                'prix_max': 100000,
                'duree_estimee': 240
            },
            {
                'type_prestation': 'nids_locks',
                'prix_min': 25000,
                'duree_estimee': 120
            },
            {
                'type_prestation': 'shampoing',
                'prix_min': 5000,
                'duree_estimee': 30
            },
            {
                'type_prestation': 'resserrage',
                'prix_min': 10000,
                'duree_estimee': 60
            },
            {
                'type_prestation': 'coiffure',
                'prix_min': 5000,
                'duree_estimee': 45
            }
        ]
        
        created_prestations = []
        for prestation_data in prestations_defaut:
            # Vérifier si la prestation existe déjà
            if not Prestation.objects.filter(type_prestation=prestation_data['type_prestation']).exists():
                prestation = Prestation.objects.create(**prestation_data)
                created_prestations.append(PrestationSerializer(prestation).data)
        
        return Response({
            'message': f'{len(created_prestations)} prestations créées avec succès',
            'prestations': created_prestations
        })
    
    @action(detail=True, methods=['post'])
    def desactiver(self, request, pk=None):
        """Désactiver une prestation"""
        prestation = self.get_object()
        prestation.actif = False
        prestation.save()
        return Response({'message': 'Prestation désactivée avec succès'})
    
    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        """Activer une prestation"""
        prestation = self.get_object()
        prestation.actif = True
        prestation.save()
        return Response({'message': 'Prestation activée avec succès'})
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer une prestation avec gestion des erreurs de contraintes"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({'message': 'Prestation supprimée avec succès'}, status=status.HTTP_200_OK)
        except ProtectedError as e:
            # Récupérer les objets liés qui empêchent la suppression
            related_objects = []
            for field in instance._meta.get_fields():
                if hasattr(field, 'related_query_name') and hasattr(instance, field.get_accessor_name()):
                    related_manager = getattr(instance, field.get_accessor_name())
                    if related_manager.exists():
                        related_objects.append(f"{field.name} ({related_manager.count()})")
            
            error_message = _(
                "Impossible de supprimer cette prestation car elle est liée à d'autres données. "
                f"Données liées : {', '.join(related_objects)}. "
                "Veuillez désactiver la prestation à la place."
            )
            return Response(
                {'error': error_message, 'related_objects': related_objects},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la suppression de la prestation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
