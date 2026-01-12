from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import (
    IsVendeur, IsAdmin, IsVendeurOrAdmin, IsOwnerOrAdmin, IsActiveUser,
    CanManageUsers, CanViewDashboard, CanManageClients, CanManagePrestations,
    CanManagePaiements, CanManageSessions, CanViewReports, CanManageSystem
)
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import SessionPaiement, HistoriqueSession, Utilisateur
from clients.models import Client
from prestations.models import Prestation
from paiements.models import Paiement
from .serializers import (
    SessionPaiementSerializer, SessionPaiementCreateSerializer,
    SessionPaiementDetailSerializer, HistoriqueSessionSerializer,
    UtilisateurSerializer, UtilisateurCreateSerializer, UtilisateurUpdateSerializer,
    LoginSerializer, UtilisateurDetailSerializer
)
from clients.serializers import ClientSerializer
from paiements.serializers import PaiementDetailSerializer
import uuid
import json


class SessionPaiementViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer le workflow de paiement complet
    """
    queryset = SessionPaiement.objects.all()
    serializer_class = SessionPaiementSerializer
    permission_classes = [AllowAny]  # Les sessions de paiement sont accessibles sans authentification
    lookup_field = 'session_id'
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'create':
            return SessionPaiementCreateSerializer
        elif self.action == 'retrieve':
            return SessionPaiementDetailSerializer
        return SessionPaiementSerializer
    
    def get_queryset(self):
        """Filtrer les sessions selon les paramètres"""
        queryset = SessionPaiement.objects.select_related('client', 'prestation').all()
        
        # Filtrer par statut
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Ne montrer que les sessions actives (non expirées)
        actives_seulement = self.request.query_params.get('actives', 'false')
        if actives_seulement.lower() == 'true':
            now = timezone.now()
            twenty_four_hours_ago = now - timedelta(hours=24)
            queryset = queryset.exclude(
                statut__in=['paiement_reussi', 'abandonne', 'expire']
            ).filter(
                (Q(date_expiration__isnull=True) & Q(date_creation__gt=twenty_four_hours_ago)) |
                (Q(date_expiration__isnull=False) & Q(date_expiration__gt=now))
            )
        
        return queryset.order_by('-date_creation')
    
    @action(detail=False, methods=['post'])
    def demarrer_session(self, request):
        """Démarrer une nouvelle session de paiement (après scan QR)"""
        session_id = request.data.get('session_id', str(uuid.uuid4()))
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        adresse_ip = request.META.get('REMOTE_ADDR', '')
        
        # Créer la session
        session = SessionPaiement.objects.create(
            session_id=session_id,
            user_agent=user_agent,
            adresse_ip=adresse_ip,
            date_expiration=timezone.now() + timedelta(hours=24)
        )
        
        # Enregistrer l'action dans l'historique
        HistoriqueSession.objects.create(
            session=session,
            type_action='scan_qr',
            description='QR Code scanné, session démarrée',
            donnees={'session_id': session_id},
            adresse_ip=adresse_ip
        )
        
        serializer = SessionPaiementDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def identifier_client(self, request, session_id=None):
        """Identifier le client par téléphone ou créer un nouveau client"""
        session = self.get_object()
        
        if not session.est_active():
            return Response(
                {'error': 'Session expirée ou inactive'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        telephone = request.data.get('telephone')
        client_data = request.data.get('client', {})
        
        if not telephone:
            return Response(
                {'error': 'Le numéro de téléphone est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rechercher le client existant
        try:
            client = Client.objects.get(telephone=telephone)
            action_type = 'recherche_client'
            description = f'Client existant trouvé: {client.nom_complet}'
        except Client.DoesNotExist:
            # Créer un nouveau client
            client_data['telephone'] = telephone
            serializer = ClientSerializer(data=client_data)
            if serializer.is_valid():
                client = serializer.save()
                action_type = 'creation_client'
                description = f'Nouveau client créé: {client.nom_complet}'
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Mettre à jour la session
        session.client = client
        session.statut = 'identification'
        session.marquer_etape_terminee('identification')
        session.save()
        
        # Enregistrer dans l'historique
        HistoriqueSession.objects.create(
            session=session,
            type_action=action_type,
            description=description,
            donnees={'client_id': str(client.id), 'telephone': telephone},
            adresse_ip=request.META.get('REMOTE_ADDR', '')
        )
        
        serializer = SessionPaiementDetailSerializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def selectionner_prestation(self, request, session_id=None):
        """Sélectionner une prestation pour la session"""
        session = self.get_object()
        
        if not session.est_active() or not session.client:
            return Response(
                {'error': 'Session inactive ou client non identifié'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prestation_id = request.data.get('prestation_id')
        montant_final = request.data.get('montant_final')
        if montant_final is not None:
            try:
                montant_final = int(montant_final)
            except (TypeError, ValueError):
                return Response(
                    {'error': 'Le montant doit être un entier positif'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not prestation_id:
            return Response(
                {'error': 'L\'ID de la prestation est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            prestation = Prestation.objects.get(id=prestation_id)
        except Prestation.DoesNotExist:
            return Response(
                {'error': 'Prestation non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Valider le montant si la prestation a une fourchette de prix
        if montant_final is not None:
            if prestation.prix_max and montant_final > prestation.prix_max:
                return Response(
                    {'error': f'Le montant ne peut pas dépasser {prestation.prix_max} FCFA'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if montant_final < prestation.prix_min:
                return Response(
                    {'error': f'Le montant ne peut pas être inférieur à {prestation.prix_min} FCFA'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            montant_final = prestation.prix_min
        
        # Mettre à jour la session
        session.prestation = prestation
        session.montant_final = montant_final
        session.statut = 'prestation_selectionnee'
        session.marquer_etape_terminee('prestation')
        session.save()
        
        # Enregistrer dans l'historique
        HistoriqueSession.objects.create(
            session=session,
            type_action='selection_prestation',
            description=f'Prestation sélectionnée: {prestation.nom} - {montant_final} FCFA',
            donnees={
                'prestation_id': str(prestation.id),
                'montant_final': montant_final
            },
            adresse_ip=request.META.get('REMOTE_ADDR', '')
        )
        
        serializer = SessionPaiementDetailSerializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def initier_paiement(self, request, session_id=None):
        """Initier le processus de paiement"""
        session = self.get_object()
        
        if not session.est_active() or not session.client or not session.prestation:
            return Response(
                {'error': 'Session incomplète: client ou prestation manquant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        moyen_paiement = request.data.get('moyen_paiement')
        operateur_mobile = request.data.get('operateur_mobile')
        
        if not moyen_paiement:
            return Response(
                {'error': 'Le moyen de paiement est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer l'objet paiement
        paiement = Paiement.objects.create(
            client=session.client,
            prestation=session.prestation,
            montant=session.montant_final,
            moyen_paiement=moyen_paiement,
            operateur_mobile=operateur_mobile,
            statut='en_attente'
        )
        
        # Mettre à jour la session
        session.statut = 'paiement_initie'
        session.paiement_initie_le = timezone.now()
        session.donnees_session['paiement_id'] = str(paiement.id)
        session.save()
        
        # Enregistrer dans l'historique
        HistoriqueSession.objects.create(
            session=session,
            type_action='initiation_paiement',
            description=f'Paiement initié: {session.montant_final} FCFA via {moyen_paiement}',
            donnees={
                'paiement_id': str(paiement.id),
                'moyen_paiement': moyen_paiement,
                'operateur_mobile': operateur_mobile
            },
            adresse_ip=request.META.get('REMOTE_ADDR', '')
        )
        
        # Retourner les détails pour rediriger vers le paiement
        from paiements.services import payment_service
        
        try:
            if moyen_paiement == 'mobile_money':
                result = payment_service.initier_paiement_cinetpay(paiement)
                if result.get('success'):
                    paiement.statut = 'en_cours'
                    paiement.save()
                    return Response({
                        'paiement_id': str(paiement.id),
                        'paiement_url': result.get('payment_url'),
                        'montant': session.montant_final,
                        'moyen_paiement': moyen_paiement
                    })
                else:
                    paiement.statut = 'echoue'
                    paiement.save()
                    return Response(
                        {'error': result.get('error', "Échec d'initialisation du paiement")},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Pour les autres moyens, marquer comme réussi immédiatement
                paiement.statut = 'reussi'
                paiement.save()
                session.statut = 'paiement_reussi'
                session.paiement_termine_le = timezone.now()
                session.save()
                return Response({
                    'paiement_id': str(paiement.id),
                    'paiement_url': None,
                    'montant': session.montant_final,
                    'moyen_paiement': moyen_paiement
                })
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'initiation du paiement: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def recapitulatif(self, request, session_id=None):
        """Obtenir le récapitulatif final de la session"""
        session = self.get_object()
        
        # Récupérer le paiement associé si existant
        paiement = None
        if 'paiement_id' in session.donnees_session:
            try:
                paiement = Paiement.objects.get(id=session.donnees_session['paiement_id'])
            except Paiement.DoesNotExist:
                pass
        
        return Response({
            'session': SessionPaiementDetailSerializer(session).data,
            'paiement': PaiementDetailSerializer(paiement).data if paiement else None,
            'message_remerciement': self.generer_message_remerciement(session)
        })
    
    def generer_message_remerciement(self, session):
        """Générer un message de remerciement personnalisé"""
        if not session.client:
            return "Merci pour votre visite !"
        
        client = session.client
        prestation = session.prestation
        
        message = f"Merci {client.prenom} !"
        
        if prestation:
            message += f" Votre {prestation.get_type_prestation_display().lower()} a été enregistré avec succès."
        
        if session.statut == 'paiement_reussi':
            message += " Votre paiement a été confirmé. À bientôt dans notre salon !"
        
        return message
    
    @action(detail=False, methods=['post'])
    def authentification_directe(self, request):
        """Endpoint pour l'authentification client directe sans QR code"""
        telephone = request.data.get('telephone')
        client_data = request.data.get('client', {})
        
        if not telephone:
            return Response(
                {'error': 'Le numéro de téléphone est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer une nouvelle session
        session_id = str(uuid.uuid4())
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        adresse_ip = request.META.get('REMOTE_ADDR', '')
        
        session = SessionPaiement.objects.create(
            session_id=session_id,
            user_agent=user_agent,
            adresse_ip=adresse_ip,
            date_expiration=timezone.now() + timedelta(hours=24)
        )
        
        # Rechercher ou créer le client
        try:
            client = Client.objects.get(telephone=telephone)
            action_type = 'recherche_client'
            description = f'Client existant trouvé: {client.nom_complet}'
        except Client.DoesNotExist:
            # Créer un nouveau client
            client_data['telephone'] = telephone
            serializer = ClientSerializer(data=client_data)
            if serializer.is_valid():
                client = serializer.save()
                action_type = 'creation_client'
                description = f'Nouveau client créé: {client.nom_complet}'
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Mettre à jour la session avec le client
        session.client = client
        session.statut = 'identification'
        session.marquer_etape_terminee('identification')
        session.save()
        
        # Enregistrer dans l'historique
        HistoriqueSession.objects.create(
            session=session,
            type_action='authentification_directe',
            description=f'Authentification directe: {description}',
            donnees={'client_id': str(client.id), 'telephone': telephone},
            adresse_ip=adresse_ip
        )
        
        serializer = SessionPaiementDetailSerializer(session)
        return Response({
            'session': serializer.data,
            'redirect_url': f'/session/{session_id}'
        }, status=status.HTTP_201_CREATED)


class UtilisateurViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les utilisateurs du système
    """
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated, IsActiveUser]
    
    def get_serializer_class(self):
        """Retourne le serializer approprié selon l'action"""
        if self.action == 'create':
            return UtilisateurCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UtilisateurUpdateSerializer
        elif self.action == 'retrieve':
            return UtilisateurDetailSerializer
        return UtilisateurSerializer
    
    def get_queryset(self):
        """Filtrer les utilisateurs selon les permissions"""
        user = self.request.user
        if not user or not user.is_authenticated:
            return Utilisateur.objects.none()
        
        # Les admins voient tous les utilisateurs
        if user.est_admin():
            return Utilisateur.objects.all()
        
        # Les vendeurs ne voient qu'eux-mêmes
        return Utilisateur.objects.filter(id=user.id)
    
    def get_permissions(self):
        """Définir les permissions selon l'action"""
        if self.action == 'create':
            return [AllowAny()]  # Tout le monde peut créer un compte
        elif self.action in ['login', 'logout']:
            return [AllowAny()]  # Login et logout sont accessibles sans authentification
        elif self.action == 'list':
            return [IsAuthenticated(), IsActiveUser(), IsAdmin()]  # Seuls les admins peuvent voir la liste des utilisateurs
        elif self.action in ['retrieve', 'profile', 'change_password']:
            return [IsAuthenticated(), IsActiveUser()]  # Les utilisateurs connectés et actifs peuvent voir leur profil
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsActiveUser(), IsOwnerOrAdmin()]  # Seul le propriétaire ou un admin peut modifier/supprimer
        return [IsAuthenticated(), IsActiveUser()]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Endpoint pour la connexion des utilisateurs"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(username=username, password=password)
            if user:
                if not user.actif:
                    return Response(
                        {'error': 'Ce compte est désactivé'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Créer ou récupérer le token
                token, created = Token.objects.get_or_create(user=user)
                
                # Mettre à jour la date de dernière connexion
                user.last_login = timezone.now()
                user.save()
                
                return Response({
                    'token': token.key,
                    'user': UtilisateurDetailSerializer(user).data,
                    'message': 'Connexion réussie'
                })
            else:
                return Response(
                    {'error': 'Nom d\'utilisateur ou mot de passe incorrect'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Endpoint pour la déconnexion des utilisateurs"""
        if request.user.is_authenticated:
            try:
                # Supprimer le token de l'utilisateur
                token = Token.objects.get(user=request.user)
                token.delete()
            except Token.DoesNotExist:
                pass
            
            # Déconnecter l'utilisateur de la session Django
            logout(request)
            
            return Response({'message': 'Déconnexion réussie'})
        
        return Response(
            {'error': 'Aucun utilisateur connecté'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Endpoint pour obtenir le profil de l'utilisateur connecté"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Non authentifié'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = UtilisateurDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Endpoint pour changer le mot de passe"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Non authentifié'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')
        
        if not current_password or not new_password or not new_password_confirm:
            return Response(
                {'error': 'Tous les champs sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != new_password_confirm:
            return Response(
                {'error': 'Les nouveaux mots de passe ne correspondent pas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {'error': 'Le nouveau mot de passe doit contenir au moins 8 caractères'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier le mot de passe actuel
        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Mot de passe actuel incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        request.user.set_password(new_password)
        request.user.save()
        
        # Supprimer l'ancien token pour forcer une reconnexion
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
        except Token.DoesNotExist:
            pass
        
        return Response({'message': 'Mot de passe changé avec succès'})
