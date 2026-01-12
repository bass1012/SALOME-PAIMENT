from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.utils import timezone
from clients.models import Client
from prestations.models import Prestation


class SessionPaiement(models.Model):
    """
    Modèle pour suivre le flux de paiement complet du client
    du scan du QR code jusqu'au paiement final
    """
    STATUT_SESSION_CHOICES = [
        ('scanne', 'QR Code Scanné'),
        ('identification', 'En Identification'),
        ('prestation_selectionnee', 'Prestation Sélectionnée'),
        ('paiement_initie', 'Paiement Initlié'),
        ('paiement_reussi', 'Paiement Réussi'),
        ('paiement_echoue', 'Paiement Échoué'),
        ('abandonne', 'Abandonné'),
        ('expire', 'Expiré'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        Client, 
        on_delete=models.SET_NULL, 
        related_name='sessions_paiement',
        null=True, 
        blank=True
    )
    prestation = models.ForeignKey(
        Prestation, 
        on_delete=models.SET_NULL, 
        related_name='sessions_paiement',
        null=True, 
        blank=True
    )
    montant_final = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Montant final choisi par le client (dans la fourchette si applicable)"
    )
    
    # Traçabilité du workflow
    statut = models.CharField(
        max_length=30, 
        choices=STATUT_SESSION_CHOICES,
        default='scanne'
    )
    qr_code_scanne = models.DateTimeField(default=timezone.now)
    identification_terminee = models.DateTimeField(null=True, blank=True)
    prestation_selectionnee_le = models.DateTimeField(null=True, blank=True)
    paiement_initie_le = models.DateTimeField(null=True, blank=True)
    paiement_termine_le = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    user_agent = models.TextField(blank=True, null=True)
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    appareil = models.CharField(max_length=100, blank=True, null=True)
    
    # Données de session
    donnees_session = models.JSONField(
        default=dict,
        help_text="Données temporaires stockées pendant la session"
    )
    
    # Notifications
    email_envoye = models.BooleanField(default=False)
    sms_envoye = models.BooleanField(default=False)
    
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_expiration = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Date d'expiration de la session (24h par défaut)"
    )
    
    class Meta:
        db_table = 'sessions_paiement'
        verbose_name = 'Session de Paiement'
        verbose_name_plural = 'Sessions de Paiement'
        ordering = ['-date_creation']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['statut']),
            models.Index(fields=['date_creation']),
        ]
    
    def __str__(self):
        client_nom = self.client.nom_complet if self.client else "Client inconnu"
        return f"Session {self.session_id} - {client_nom} - {self.get_statut_display()}"
    
    def est_expire(self):
        """Vérifie si la session est expirée"""
        if self.date_expiration:
            return timezone.now() > self.date_expiration
        # Par défaut, expiration après 24 heures
        return timezone.now() > self.date_creation + timezone.timedelta(hours=24)
    
    def est_active(self):
        """Vérifie si la session est toujours active"""
        return not self.est_expire() and self.statut not in ['paiement_reussi', 'abandonne', 'expire']
    
    def get_etape_actuelle(self):
        """Retourne l'étape actuelle du workflow"""
        if self.statut == 'scanne':
            return 1
        elif self.statut == 'identification':
            return 2
        elif self.statut == 'prestation_selectionnee':
            return 3
        elif self.statut in ['paiement_initie', 'paiement_reussi', 'paiement_echoue']:
            return 4
        elif self.statut in ['abandonne', 'expire']:
            return 5
        return 1
    
    def marquer_etape_terminee(self, etape):
        """Marque une étape comme terminée avec la date actuelle"""
        maintenant = timezone.now()
        if etape == 'identification':
            self.identification_terminee = maintenant
        elif etape == 'prestation':
            self.prestation_selectionnee_le = maintenant
        elif etape == 'paiement':
            self.paiement_termine_le = maintenant
        self.save()


class HistoriqueSession(models.Model):
    """
    Historique détaillé des actions dans une session pour une traçabilité complète
    """
    TYPE_ACTION_CHOICES = [
        ('scan_qr', 'Scan QR Code'),
        ('authentification_directe', 'Authentification Directe'),
        ('recherche_client', 'Recherche Client'),
        ('creation_client', 'Création Client'),
        ('selection_prestation', 'Sélection Prestation'),
        ('initiation_paiement', 'Initiation Paiement'),
        ('confirmation_paiement', 'Confirmation Paiement'),
        ('echec_paiement', 'Échec Paiement'),
        ('envoi_email', 'Envoi Email'),
        ('envoi_sms', 'Envoi SMS'),
        ('abandon', 'Abandon Session'),
        ('expiration', 'Expiration Session'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        SessionPaiement, 
        on_delete=models.CASCADE, 
        related_name='historique'
    )
    type_action = models.CharField(max_length=30, choices=TYPE_ACTION_CHOICES)
    description = models.TextField()
    donnees = models.JSONField(default=dict, help_text="Données liées à l'action")
    adresse_ip = models.GenericIPAddressField(null=True, blank=True)
    date_action = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'historique_sessions'
        verbose_name = 'Historique de Session'
        verbose_name_plural = 'Historiques des Sessions'
        ordering = ['-date_action']
    
    def __str__(self):
        return f"{self.session.session_id} - {self.get_type_action_display()} - {self.date_action}"


class Utilisateur(AbstractUser):
    """
    Modèle d'utilisateur personnalisé pour la gestion des rôles vendeur et admin
    """
    ROLE_CHOICES = [
        ('vendeur', 'Vendeur'),
        ('admin', 'Administrateur'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='vendeur',
        help_text="Rôle de l'utilisateur dans le système"
    )
    telephone = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="Numéro de téléphone de l'utilisateur"
    )
    actif = models.BooleanField(
        default=True,
        help_text="Indique si l'utilisateur est actif"
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'utilisateurs'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def est_vendeur(self):
        """Vérifie si l'utilisateur a le rôle vendeur"""
        return self.role == 'vendeur'
    
    def est_admin(self):
        """Vérifie si l'utilisateur a le rôle admin"""
        return self.role == 'admin'
    
    def a_permission(self, permission_requise):
        """Vérifie si l'utilisateur a la permission requise"""
        if self.est_admin():
            return True  # L'admin a toutes les permissions
        
        # Permissions spécifiques pour les vendeurs
        permissions_vendeur = [
            'voir_dashboard',
            'voir_paiements',
            'voir_clients',
            'voir_prestations',
            'voir_qr_codes',
            'creer_paiement',
            'creer_client',
            'modifier_client',
        ]
        
        return permission_requise in permissions_vendeur
