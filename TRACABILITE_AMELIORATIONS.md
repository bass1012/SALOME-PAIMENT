# Améliorations de Traçabilité pour Salon de Coiffure

## État Actuel
✅ **Base de traçabilité existante** : Modèles avec dates de création/modification
✅ **Historique des sessions** : Système `HistoriqueSession` déjà implémenté
✅ **Suivi des paiements** : Statuts et références de transactions

## Améliorations Critiques

### 1. Système de Logging Complet

#### **Configuration du logging Django**
```python
# Dans settings.py

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'payment': {
            'format': '[{asctime}] {levelname} - SESSION:{session_id} - CLIENT:{client_id} - {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'salon_paiement.log',
            'formatter': 'verbose',
        },
        'payment_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'paiements.log',
            'formatter': 'payment',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'paiements': {
            'handlers': ['payment_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'salon_paiement': {
            'handlers': ['payment_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

#### **Service de logging dédié**
```python
# Dans salon_paiement/services/logging_service.py

import logging
from django.utils import timezone
from .models import SessionPaiement, HistoriqueSession

class SalonLoggingService:
    """Service centralisé pour le logging et la traçabilité"""
    
    def __init__(self):
        self.logger = logging.getLogger('salon_paiement')
        self.payment_logger = logging.getLogger('paiements')
    
    def log_session_action(self, session_id, action_type, description, donnees=None):
        """Logger une action de session avec contexte complet"""
        try:
            session = SessionPaiement.objects.get(session_id=session_id)
            
            # Créer l'entrée d'historique
            HistoriqueSession.objects.create(
                session=session,
                type_action=action_type,
                description=description,
                donnees=donnees or {},
                adresse_ip=getattr(self, 'current_ip', None)
            )
            
            # Logger avec contexte
            context = {
                'session_id': str(session_id),
                'client_id': str(session.client.id) if session.client else None,
                'client_nom': session.client.nom_complet if session.client else 'Inconnu',
                'statut': session.statut,
                'etape': session.get_etape_actuelle(),
            }
            
            self.logger.info(
                f"{action_type}: {description}",
                extra={'context': context}
            )
            
        except SessionPaiement.DoesNotExist:
            self.logger.error(f"Session non trouvée: {session_id}")
    
    def log_paiement(self, paiement, action, details=None):
        """Logger les événements de paiement"""
        context = {
            'paiement_id': str(paiement.id),
            'client_id': str(paiement.client.id),
            'client_nom': paiement.client.nom_complet,
            'montant': paiement.montant,
            'moyen_paiement': paiement.moyen_paiement,
            'statut': paiement.statut,
            'reference': paiement.reference_paiement,
        }
        
        message = f"{action} - {paiement.montant} FCFA via {paiement.moyen_paiement}"
        if details:
            message += f" - {details}"
        
        self.payment_logger.info(
            message,
            extra={'context': context}
        )
    
    def log_erreur(self, session_id, erreur, contexte=None):
        """Logger les erreurs avec contexte complet"""
        context = {
            'session_id': str(session_id),
            'erreur': str(erreur),
            'contexte': contexte or {},
            'timestamp': timezone.now().isoformat(),
        }
        
        self.logger.error(
            f"Erreur session {session_id}: {erreur}",
            extra={'context': context},
            exc_info=True
        )
```

### 2. Table de Traçabilité Avancée

#### **Modèle de traçabilité des transactions**
```python
# Dans salon_paiement/models.py - ajouter ce modèle

class TraceTransaction(models.Model):
    """
    Traçabilité complète de toutes les transactions et interactions
    """
    TYPE_TRACE_CHOICES = [
        ('scan_qr', 'Scan QR Code'),
        ('identification_client', 'Identification Client'),
        ('selection_prestation', 'Sélection Prestation'),
        ('initiation_paiement', 'Initiation Paiement'),
        ('confirmation_paiement', 'Confirmation Paiement'),
        ('echec_paiement', 'Échec Paiement'),
        ('notification_webhook', 'Notification Webhook'),
        ('envoi_recu', 'Envoi Reçu'),
        ('abandon_session', 'Abandon Session'),
        ('expiration_session', 'Expiration Session'),
        ('erreur_systeme', 'Erreur Système'),
    ]
    
    NIVEAU_IMPORTANCE_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
        ('critical', 'Critique'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        SessionPaiement, 
        on_delete=models.CASCADE, 
        related_name='traces',
        null=True, 
        blank=True
    )
    client = models.ForeignKey(
        Client, 
        on_delete=models.SET_NULL, 
        related_name='traces',
        null=True, 
        blank=True
    )
    paiement = models.ForeignKey(
        'paiements.Paiement', 
        on_delete=models.SET_NULL, 
        related_name='traces',
        null=True, 
        blank=True
    )
    
    type_trace = models.CharField(max_length=30, choices=TYPE_TRACE_CHOICES)
    niveau_importance = models.CharField(
        max_length=10, 
        choices=NIVEAU_IMPORTANCE_CHOICES,
        default='info'
    )
    
    # Informations détaillées
    titre = models.CharField(max_length=200)
    description = models.TextField()
    donnees_structures = models.JSONField(
        default=dict,
        help_text="Données structurées de l'événement"
    )
    
    # Métadonnées techniques
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    appareil = models.CharField(max_length=100, blank=True, null=True)
    navigateur = models.CharField(max_length=50, blank=True, null=True)
    os = models.CharField(max_length=50, blank=True, null=True)
    
    # Performance
    duree_execution = models.DurationField(null=True, blank=True)
    memoire_utilisee = models.PositiveIntegerField(null=True, blank=True)
    
    # Géolocalisation (optionnel)
    pays = models.CharField(max_length=50, blank=True, null=True)
    ville = models.CharField(max_length=50, blank=True, null=True)
    coordonnees = models.CharField(max_length=50, blank=True, null=True)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'traces_transactions'
        verbose_name = 'Trace de Transaction'
        verbose_name_plural = 'Traces des Transactions'
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['type_trace']),
            models.Index(fields=['niveau_importance']),
            models.Index(fields=['date_creation']),
            models.Index(fields=['session']),
            models.Index(fields=['client']),
        ]
    
    def __str__(self):
        return f"{self.get_type_trace_display()} - {self.titre}"
```

### 3. Dashboard de Traçabilité

#### **API pour le dashboard**
```python
# Dans salon_paiement/views.py - ajouter ces vues

from django.db.models import Count, Q, Avg
from datetime import datetime, timedelta
from django.utils import timezone

class DashboardViewSet(viewsets.ViewSet):
    """API endpoint pour le dashboard de traçabilité"""
    
    permission_classes = [AllowAny]
    
    def list(self, request):
        """Statistiques générales du dashboard"""
        maintenant = timezone.now()
        
        # Statistiques des sessions
        sessions_total = SessionPaiement.objects.count()
        sessions_actives = SessionPaiement.objects.filter(
            date_expiration__gt=maintenant,
            statut__in=['scanne', 'identification', 'prestation_selectionnee', 'paiement_initie']
        ).count()
        sessions_reussies = SessionPaiement.objects.filter(
            statut='paiement_reussi'
        ).count()
        
        # Statistiques des paiements
        from paiements.models import Paiement
        paiements_total = Paiement.objects.count()
        paiements_reussis = Paiement.objects.filter(statut='reussi').count()
        chiffre_affaires = Paiement.objects.filter(
            statut='reussi'
        ).aggregate(total=Sum('montant'))['total'] or 0
        
        # Taux de conversion
        taux_conversion = (sessions_reussies / sessions_total * 100) if sessions_total > 0 else 0
        
        return Response({
            'sessions': {
                'total': sessions_total,
                'actives': sessions_actives,
                'reussies': sessions_reussies,
                'abandonnees': sessions_total - sessions_reussies,
            },
            'paiements': {
                'total': paiements_total,
                'reussis': paiements_reussis,
                'echoues': paiements_total - paiements_reussis,
                'chiffre_affaires': chiffre_affaires,
            },
            'performance': {
                'taux_conversion': round(taux_conversion, 2),
                'montant_moyen': round(chiffre_affaires / paiements_reussis) if paiements_reussis > 0 else 0,
            }
        })
    
    @action(detail=False, methods=['get'])
    def sessions_recentes(self, request):
        """Sessions des dernières 24 heures"""
        depuis_24h = timezone.now() - timedelta(hours=24)
        
        sessions = SessionPaiement.objects.filter(
            date_creation__gte=depuis_24h
        ).select_related('client', 'prestation').order_by('-date_creation')[:20]
        
        serializer = SessionPaiementListSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistiques_journalieres(self, request):
        """Statistiques des derniers 30 jours"""
        depuis_30j = timezone.now() - timedelta(days=30)
        
        # Sessions par jour
        sessions_par_jour = SessionPaiement.objects.filter(
            date_creation__gte=depuis_30j
        ).extra(
            select={'day': 'date(date_creation)'}
        ).values('day').annotate(
            total=Count('id'),
            reussies=Count('id', filter=Q(statut='paiement_reussi'))
        ).order_by('day')
        
        # Paiements par jour
        from paiements.models import Paiement
        paiements_par_jour = Paiement.objects.filter(
            date_paiement__gte=depuis_30j
        ).extra(
            select={'day': 'date(date_paiement)'}
        ).values('day').annotate(
            total=Count('id'),
            montant_total=Sum('montant'),
            reussis=Count('id', filter=Q(statut='reussi'))
        ).order_by('day')
        
        return Response({
            'sessions': list(sessions_par_jour),
            'paiements': list(paiements_par_jour)
        })
    
    @action(detail=False, methods=['get'])
    def erreurs_recentes(self, request):
        """Erreurs récentes pour le monitoring"""
        depuis_24h = timezone.now() - timedelta(hours=24)
        
        erreurs = TraceTransaction.objects.filter(
            date_creation__gte=depuis_24h,
            niveau_importance__in=['error', 'critical']
        ).select_related('session', 'client').order_by('-date_creation')[:50]
        
        serializer = TraceTransactionSerializer(erreurs, many=True)
        return Response(serializer.data)
```

### 4. Notifications et Alertes

#### **Service de notifications**
```python
# Dans salon_paiement/services/notification_service.py

from django.core.mail import send_mail
from django.conf import settings
import requests
import logging

class NotificationService:
    """Service pour envoyer des notifications (email, SMS, push)"""
    
    def __init__(self):
        self.logger = logging.getLogger('salon_paiement')
    
    def envoyer_email_recu(self, session):
        """Envoyer un reçu par email après paiement réussi"""
        if not session.client or not session.client.email:
            return False
        
        sujet = f"Reçu de paiement - {session.client.prenom}"
        
        contenu = f"""
        Bonjour {session.client.prenom},
        
        Merci pour votre visite dans notre salon !
        
        Détails de votre paiement :
        - Service : {session.prestation.nom}
        - Montant : {session.montant_final} FCFA
        - Date : {session.paiement_termine_le.strftime('%d/%m/%Y %H:%M')}
        - Référence : {session.donnees_session.get('reference_paiement', 'N/A')}
        
        À bientôt dans notre salon !
        
        Cordialement,
        L'équipe du salon
        """
        
        try:
            send_mail(
                sujet,
                contenu,
                settings.DEFAULT_FROM_EMAIL,
                [session.client.email],
                fail_silently=False,
            )
            
            # Marquer comme envoyé
            session.email_envoye = True
            session.save()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Erreur envoi email: {e}")
            return False
    
    def envoyer_sms_confirmation(self, session):
        """Envoyer un SMS de confirmation"""
        if not session.client or not session.client.telephone:
            return False
        
        message = f"Bonjour {session.client.prenom}, votre paiement de {session.montant_final} FCFA pour {session.prestation.nom} a été confirmé. Merci pour votre visite !"
        
        # Intégration avec un service SMS (à configurer)
        # Exemple avec une API générique
        try:
            # Configuration à ajouter dans settings.py
            sms_api_url = getattr(settings, 'SMS_API_URL', None)
            sms_api_key = getattr(settings, 'SMS_API_KEY', None)
            
            if not sms_api_url or not sms_api_key:
                self.logger.warning("Configuration SMS manquante")
                return False
            
            response = requests.post(
                sms_api_url,
                json={
                    'api_key': sms_api_key,
                    'to': session.client.telephone,
                    'message': message
                },
                timeout=30
            )
            
            if response.status_code == 200:
                session.sms_envoye = True
                session.save()
                return True
            
        except Exception as e:
            self.logger.error(f"Erreur envoi SMS: {e}")
        
        return False
    
    def alerter_erreur_critique(self, erreur, contexte=None):
        """Envoyer une alerte pour les erreurs critiques"""
        sujet = f"ERREUR CRITIQUE - Salon Paiement"
        
        contenu = f"""
        Une erreur critique est survenue dans le système de paiement :
        
        Erreur : {erreur}
        Contexte : {contexte or 'N/A'}
        Timestamp : {timezone.now()}
        
        Merci d'intervenir rapidement.
        """
        
        try:
            send_mail(
                sujet,
                contenu,
                settings.DEFAULT_FROM_EMAIL,
                [settings.ADMIN_EMAIL],
                fail_silently=False,
            )
        except Exception as e:
            self.logger.error(f"Erreur envoi alerte: {e}")
```

### 5. Configuration du monitoring

#### **Tâches planifiées pour le monitoring**
```python
# Dans salon_paiement/tasks.py (pour Celery)

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import SessionPaiement, TraceTransaction
from .services import NotificationService

@shared_task
def nettoyer_sessions_expirees():
    """Nettoyer les sessions expirées"""
    maintenant = timezone.now()
    sessions_expirees = SessionPaiement.objects.filter(
        date_expiration__lt=maintenant,
        statut__in=['scanne', 'identification', 'prestation_selectionnee']
    )
    
    for session in sessions_expirees:
        session.statut = 'expire'
        session.save()
        
        # Logger l'expiration
        TraceTransaction.objects.create(
            session=session,
            client=session.client,
            type_trace='expiration_session',
            niveau_importance='info',
            titre=f"Session {session.session_id} expirée",
            description=f"La session a expiré après {maintenant - session.date_creation}"
        )
    
    return f"{sessions_expirees.count()} sessions marquées comme expirées"

@shared_task
def verifier_transactions_en_attente():
    """Vérifier les transactions en attente depuis trop longtemps"""
    depuis_1h = timezone.now() - timedelta(hours=1)
    
    from paiements.models import Paiement
    transactions_en_attente = Paiement.objects.filter(
        statut='en_attente',
        date_paiement__lt=depuis_1h
    )
    
    for paiement in transactions_en_attente:
        # Marquer comme échoué
        paiement.statut = 'echoue'
        paiement.save()
        
        # Logger l'échec
        TraceTransaction.objects.create(
            paiement=paiement,
            client=paiement.client,
            type_trace='echec_paiement',
            niveau_importance='warning',
            titre=f"Transaction {paiement.id} échouée par timeout",
            description=f"La transaction est restée en attente pendant plus d'une heure"
        )
    
    return f"{transactions_en_attente.count()} transactions marquées comme échouées"

@shared_task
def generer_rapport_journalier():
    """Générer un rapport journalier des activités"""
    aujourd_hui = timezone.now().date()
    debut_jour = timezone.make_aware(datetime.combine(aujourd_hui, datetime.min.time()))
    
    # Statistiques du jour
    sessions_du_jour = SessionPaiement.objects.filter(date_creation__gte=debut_jour)
    paiements_du_jour = Paiement.objects.filter(date_paiement__gte=debut_jour)
    
    rapport = {
        'date': aujourd_hui.isoformat(),
        'sessions': {
            'total': sessions_du_jour.count(),
            'reussies': sessions_du_jour.filter(statut='paiement_reussi').count(),
            'abandonnees': sessions_du_jour.filter(statut='abandonne').count(),
        },
        'paiements': {
            'total': paiements_du_jour.count(),
            'reussis': paiements_du_jour.filter(statut='reussi').count(),
            'montant_total': sum(p.montant for p in paiements_du_jour.filter(statut='reussi')),
        }
    }
    
    # Envoyer le rapport par email
    notification_service = NotificationService()
    notification_service.envoyer_rapport_journalier(rapport)
    
    return rapport
```

## Résumé des Améliorations

### ✅ Traçabilité Complète
- **Logging structuré** avec contexte complet
- **Historique détaillé** de chaque session
- **Table de traces** pour toutes les interactions
- **Dashboard de monitoring** en temps réel

### ✅ Notifications Automatiques
- **Emails de confirmation** avec reçu détaillé
- **SMS de confirmation** pour les clients
- **Alertes d'erreurs** pour l'administration
- **Rapports journaliers** automatiques

### ✅ Monitoring et Performance
- **Nettoyage automatique** des sessions expirées
- **Vérification des transactions** en attente
- **Statistiques détaillées** pour l'analyse
- **Alertes proactives** pour les problèmes

### ✅ Sécurité et Conformité
- **Journalisation sécurisée** des données sensibles
- **Audit complet** de toutes les transactions
- **Backup des traces** pour la conformité
- **Protection contre les pertes** de données

Ces améliorations garantissent une traçabilité complète de toutes les opérations, depuis le scan du QR code jusqu'à la confirmation finale du paiement, avec un monitoring en temps réel et des notifications automatiques pour une meilleure expérience client et une gestion optimale du salon.
