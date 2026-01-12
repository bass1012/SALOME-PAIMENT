from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from salon_paiement.permissions import CanManagePaiements, IsOwnerOrAdmin, CanViewCreatePaiements
from django.db.models import Q, ProtectedError
from django.utils.translation import gettext_lazy as _
from .models import Paiement, TransactionExterne
from .serializers import (
    PaiementSerializer, PaiementListSerializer, PaiementDetailSerializer, 
    PaiementCreateSerializer, TransactionExterneSerializer
)
from .services import payment_service
from .services.cinetpay_service import CinetPayService


class PaiementViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des paiements
    """
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated, CanViewCreatePaiements]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'list':
            return PaiementListSerializer
        elif self.action == 'retrieve':
            return PaiementDetailSerializer
        elif self.action == 'create':
            return PaiementCreateSerializer
        return PaiementSerializer
    
    def get_queryset(self):
        """Filtrer les paiements selon les paramètres de recherche"""
        queryset = Paiement.objects.select_related('client', 'prestation').all()
        
        # Recherche par client ou référence
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(client__nom__icontains=search) |
                Q(client__prenom__icontains=search) |
                Q(client__telephone__icontains=search) |
                Q(reference_paiement__icontains=search)
            )
        
        # Filtrer par statut
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrer par moyen de paiement
        moyen_paiement = self.request.query_params.get('moyen_paiement', None)
        if moyen_paiement:
            queryset = queryset.filter(moyen_paiement=moyen_paiement)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par date
        date_debut = self.request.query_params.get('date_debut', None)
        date_fin = self.request.query_params.get('date_fin', None)
        if date_debut:
            queryset = queryset.filter(date_paiement__date__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_paiement__date__lte=date_fin)
        
        return queryset.order_by('-date_paiement')
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Retourner des statistiques sur les paiements"""
        today = timezone.now().date()
        last_week = today - timedelta(days=7)
        last_month = today - timedelta(days=30)
        
        # Statistiques générales
        total_paiements = Paiement.objects.count()
        total_revenus = Paiement.objects.filter(statut='reussi').aggregate(
            total=Sum('montant'))['total'] or 0
        
        # Statistiques par période
        paiements_aujourd_hui = Paiement.objects.filter(
            date_paiement__date=today).count()
        revenus_aujourd_hui = Paiement.objects.filter(
            date_paiement__date=today, statut='reussi').aggregate(
            total=Sum('montant'))['total'] or 0
        
        paiements_semaine = Paiement.objects.filter(
            date_paiement__date__gte=last_week).count()
        revenus_semaine = Paiement.objects.filter(
            date_paiement__date__gte=last_week, statut='reussi').aggregate(
            total=Sum('montant'))['total'] or 0
        
        paiements_mois = Paiement.objects.filter(
            date_paiement__date__gte=last_month).count()
        revenus_mois = Paiement.objects.filter(
            date_paiement__date__gte=last_month, statut='reussi').aggregate(
            total=Sum('montant'))['total'] or 0
        
        # Statistiques par moyen de paiement
        stats_moyen_paiement = Paiement.objects.filter(statut='reussi').values(
            'moyen_paiement').annotate(
            count=Count('id'),
            total=Sum('montant')
        )
        
        return Response({
            'general': {
                'total_paiements': total_paiements,
                'total_revenus': total_revenus
            },
            'aujourd_hui': {
                'paiements': paiements_aujourd_hui,
                'revenus': revenus_aujourd_hui
            },
            'semaine': {
                'paiements': paiements_semaine,
                'revenus': revenus_semaine
            },
            'mois': {
                'paiements': paiements_mois,
                'revenus': revenus_mois
            },
            'par_moyen_paiement': list(stats_moyen_paiement)
        })
    
    def annuler(self, request, pk=None):
        """Annuler un paiement"""
        paiement = self.get_object()
        paiement.statut = 'annule'
        paiement.save()
        return Response({'message': 'Paiement annulé avec succès'})
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un paiement avec gestion des erreurs de contraintes"""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({'message': 'Paiement supprimé avec succès'}, status=status.HTTP_200_OK)
        except ProtectedError as e:
            # Récupérer les objets liés qui empêchent la suppression
            related_objects = []
            for field in instance._meta.get_fields():
                if hasattr(field, 'related_query_name') and hasattr(instance, field.get_accessor_name()):
                    related_manager = getattr(instance, field.get_accessor_name())
                    if related_manager.exists():
                        related_objects.append(f"{field.name} ({related_manager.count()})")
            
            error_message = _(
                "Impossible de supprimer ce paiement car il est lié à d'autres données. "
                f"Données liées : {', '.join(related_objects)}. "
                "Veuillez annuler le paiement à la place."
            )
            return Response(
                {'error': error_message, 'related_objects': related_objects},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la suppression du paiement: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def initier_paiement_cinetpay(self, request, pk=None):
        """Initialiser un paiement avec CinetPay"""
        paiement = self.get_object()
        
        # Vérifier que le paiement est en attente
        if paiement.statut != 'en_attente':
            return Response(
                {'error': 'Le paiement doit être en attente pour être initialisé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = payment_service.initier_paiement_cinetpay(paiement)
        
        if result['success']:
            paiement.statut = 'en_cours'
            paiement.save()
            return Response(result)
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def initier_paiement_paydunya(self, request, pk=None):
        """Initialiser un paiement avec PayDunya"""
        paiement = self.get_object()
        
        # Vérifier que le paiement est en attente
        if paiement.statut != 'en_attente':
            return Response(
                {'error': 'Le paiement doit être en attente pour être initialisé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = payment_service.initier_paiement_paydunya(paiement)
        
        if result['success']:
            paiement.statut = 'en_cours'
            paiement.save()
            return Response(result)
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def cinetpay_notification(self, request):
        """Webhook pour les notifications CinetPay"""
        result = payment_service.traiter_notification_cinetpay(request.data)
        
        if result['success']:
            return Response({'message': 'Notification traitée avec succès'})
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def paydunya_notification(self, request):
        """Webhook pour les notifications PayDunya"""
        result = payment_service.traiter_notification_paydunya(request.data)
        
        if result['success']:
            return Response({'message': 'Notification traitée avec succès'})
        else:
            return Response(
                {'error': result['error']},
                status=status.HTTP_400_BAD_REQUEST
            )


class TransactionExterneViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des transactions externes
    """
    queryset = TransactionExterne.objects.all()
    serializer_class = TransactionExterneSerializer
    permission_classes = [IsAuthenticated, CanViewCreatePaiements]
    
    def get_queryset(self):
        """Filtrer les transactions par paiement"""
        queryset = TransactionExterne.objects.select_related('paiement').all()
        
        # Filtrer par paiement
        paiement_id = self.request.query_params.get('paiement', None)
        if paiement_id:
            queryset = queryset.filter(paiement_id=paiement_id)
        
        # Filtrer par fournisseur
        fournisseur = self.request.query_params.get('fournisseur', None)
        if fournisseur:
            queryset = queryset.filter(fournisseur=fournisseur)
        
        return queryset.order_by('-date_creation')
