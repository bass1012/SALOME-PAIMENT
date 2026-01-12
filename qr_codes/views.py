from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from salon_paiement.permissions import CanManageSessions, IsOwnerOrAdmin
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import QRCode
from .serializers import (
    QRCodeSerializer, QRCodeListSerializer, QRCodeDetailSerializer, 
    QRCodeCreateSerializer
)


class QRCodeViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour la gestion des QR codes
    """
    queryset = QRCode.objects.all()
    serializer_class = QRCodeSerializer
    permission_classes = [IsAuthenticated, CanManageSessions]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'list':
            return QRCodeListSerializer
        elif self.action == 'retrieve':
            return QRCodeDetailSerializer
        elif self.action == 'create':
            return QRCodeCreateSerializer
        return QRCodeSerializer
    
    def get_queryset(self):
        """Filtrer les QR codes selon les paramètres de recherche"""
        queryset = QRCode.objects.select_related('client').all()
        
        # Recherche par client ou contenu
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(client__nom__icontains=search) |
                Q(client__prenom__icontains=search) |
                Q(client__telephone__icontains=search) |
                Q(contenu__icontains=search)
            )
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par type
        type_qrcode = self.request.query_params.get('type', None)
        if type_qrcode:
            queryset = queryset.filter(type_qrcode=type_qrcode)
        
        # Filtrer par statut
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrer par expiration
        expire = self.request.query_params.get('expire', None)
        if expire is not None:
            if expire.lower() == 'true':
                queryset = queryset.filter(date_expiration__lt=timezone.now())
            else:
                queryset = queryset.filter(
                    Q(date_expiration__gte=timezone.now()) | Q(date_expiration__isnull=True)
                )
        
        return queryset.order_by('-date_creation')
    
    def perform_create(self, serializer):
        """Générer l'image du QR code lors de la création"""
        qr_code = serializer.save()
        qr_code.generer_image()
        qr_code.save()
    
    @action(detail=False, methods=['post'])
    def generer_pour_client(self, request):
        """Générer un QR code pour un client spécifique"""
        client_id = request.data.get('client_id')
        type_qrcode = request.data.get('type_qrcode', 'identification')
        contenu = request.data.get('contenu', '')
        date_expiration = request.data.get('date_expiration')
        
        if not client_id:
            return Response(
                {'error': 'L\'ID du client est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from clients.models import Client
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Créer le QR code
        qr_code = QRCode.objects.create(
            client=client,
            type_qrcode=type_qrcode,
            contenu=contenu,
            date_expiration=date_expiration
        )
        
        # Générer l'image
        qr_code.generer_image()
        qr_code.save()
        
        serializer = QRCodeDetailSerializer(qr_code)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def scanner(self, request, pk=None):
        """Enregistrer un scan de QR code"""
        qr_code = self.get_object()
        
        # Vérifier si le QR code est valide
        if not qr_code.est_valide:
            return Response(
                {'error': 'QR code invalide ou expiré'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Incrémenter le nombre de scans
        qr_code.nombre_scans += 1
        qr_code.save()
        
        return Response({
            'message': 'QR code scanné avec succès',
            'client': qr_code.client.nom_complet,
            'type': qr_code.get_type_qrcode_display(),
            'nombre_scans': qr_code.nombre_scans
        })
    
    @action(detail=True, methods=['post'])
    def utiliser(self, request, pk=None):
        """Marquer un QR code comme utilisé"""
        qr_code = self.get_object()
        
        # Vérifier si le QR code est valide
        if not qr_code.est_valide:
            return Response(
                {'error': 'QR code invalide ou expiré'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marquer comme utilisé
        qr_code.statut = 'utilise'
        qr_code.nombre_utilisations += 1
        qr_code.save()
        
        return Response({
            'message': 'QR code utilisé avec succès',
            'client': qr_code.client.nom_complet,
            'nombre_utilisations': qr_code.nombre_utilisations
        })
    
    @action(detail=True, methods=['post'])
    def regenerer_image(self, request, pk=None):
        """Régénérer l'image du QR code"""
        qr_code = self.get_object()
        qr_code.generer_image()
        qr_code.save()
        
        return Response({'message': 'Image du QR code régénérée avec succès'})
    
    @action(detail=False, methods=['get'])
    def nettoyer_expires(self, request):
        """Nettoyer les QR codes expirés"""
        from datetime import datetime
        
        # Trouver les QR codes expirés depuis plus de 30 jours
        date_limite = timezone.now() - timedelta(days=30)
        qr_codes_expires = QRCode.objects.filter(
            date_expiration__lt=timezone.now(),
            date_modification__lt=date_limite
        )
        
        count = qr_codes_expires.count()
        qr_codes_expires.delete()
        
        return Response({
            'message': f'{count} QR codes expirés ont été supprimés'
        })
