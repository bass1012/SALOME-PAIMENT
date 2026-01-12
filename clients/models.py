from django.db import models
from django.core.validators import RegexValidator
import uuid


class Client(models.Model):
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    telephone = models.CharField(
        max_length=20,
        unique=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message="Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
        )]
    )
    email = models.EmailField(blank=True, null=True)
    date_anniversaire = models.DateField(blank=True, null=True)
    lieu_habitation = models.CharField(max_length=200, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    actif = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.telephone}"
    
    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"


class ClientFeedback(models.Model):
    RATING_CHOICES = [
        (1, '1 étoile'),
        (2, '2 étoiles'),
        (3, '3 étoiles'),
        (4, '4 étoiles'),
        (5, '5 étoiles'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_telephone = models.CharField(max_length=20)
    client_nom = models.CharField(max_length=100)
    client_prenom = models.CharField(max_length=100)
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'client_feedbacks'
        verbose_name = 'Feedback Client'
        verbose_name_plural = 'Feedbacks Clients'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"Feedback de {self.client_prenom} {self.client_nom} - {self.rating}/5"
