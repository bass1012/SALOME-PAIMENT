from django.db import models
from django.core.validators import RegexValidator
import uuid
from clients.models import Client
from prestations.models import Prestation


class Paiement(models.Model):
    STATUT_PAIEMENT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('reussi', 'Réussi'),
        ('echoue', 'Échoué'),
        ('annule', 'Annulé'),
    ]
    
    MOYEN_PAIEMENT_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('carte_bancaire', 'Carte Bancaire'),
        ('carte_prepayee', 'Carte Prépayée'),
        ('espece', 'Espèce'),
    ]
    
    OPERATEUR_MOBILE_CHOICES = [
        ('wave', 'Wave'),
        ('orange', 'Orange Money'),
        ('mtn', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='paiements')
    prestation = models.ForeignKey(Prestation, on_delete=models.PROTECT, related_name='paiements')
    montant = models.PositiveIntegerField(help_text="Montant payé en FCFA")
    moyen_paiement = models.CharField(max_length=20, choices=MOYEN_PAIEMENT_CHOICES)
    operateur_mobile = models.CharField(
        max_length=20,
        choices=OPERATEUR_MOBILE_CHOICES,
        blank=True,
        null=True
    )
    numero_transaction = models.CharField(max_length=100, blank=True, null=True)
    reference_paiement = models.CharField(max_length=100, blank=True, null=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_PAIEMENT_CHOICES,
        default='en_attente'
    )
    date_paiement = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'paiements'
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.id} - {self.client.nom_complet} - {self.montant:,} FCFA"
    
    @property
    def moyen_paiement_affichage(self):
        if self.moyen_paiement == 'mobile_money' and self.operateur_mobile:
            return f"{self.get_moyen_paiement_display()} ({self.get_operateur_mobile_display()})"
        return self.get_moyen_paiement_display()
    
    def save(self, *args, **kwargs):
        # Valider que l'opérateur mobile est spécifié si le moyen de paiement est mobile money
        if self.moyen_paiement == 'mobile_money' and not self.operateur_mobile:
            raise ValueError("L'opérateur mobile doit être spécifié pour les paiements Mobile Money")
        super().save(*args, **kwargs)


class TransactionExterne(models.Model):
    """Modèle pour suivre les transactions avec les services de paiement externes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paiement = models.ForeignKey(Paiement, on_delete=models.CASCADE, related_name='transactions_externes')
    fournisseur = models.CharField(max_length=50)  # CinetPay, PayDunya, etc.
    id_transaction_externe = models.CharField(max_length=100)
    reponse_api = models.JSONField(blank=True, null=True)
    statut_externe = models.CharField(max_length=50)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transactions_externes'
        verbose_name = 'Transaction Externe'
        verbose_name_plural = 'Transactions Externes'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Transaction {self.fournisseur} - {self.id_transaction_externe}"
