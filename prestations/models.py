from django.db import models
import uuid


class Prestation(models.Model):
    TYPE_PRESTATION_CHOICES = [
        ('dreadlocks_nouveau', 'Dreadlocks (nouveau)'),
        ('sister_locks', 'Sister locks'),
        ('nids_locks', 'Nids locks'),
        ('shampoing', 'Shampoing'),
        ('resserrage', 'Resserrage'),
        ('coiffure', 'Coiffure'),
        ('autre', 'Autre'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100)
    type_prestation = models.CharField(
        max_length=50,
        choices=TYPE_PRESTATION_CHOICES,
        default='autre'
    )
    description = models.TextField(blank=True, null=True)
    prix_min = models.PositiveIntegerField(help_text="Prix minimum en FCFA")
    prix_max = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Prix maximum en FCFA (laisser vide si prix fixe)"
    )
    duree_estimee = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Durée estimée en minutes"
    )
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prestations'
        verbose_name = 'Prestation'
        verbose_name_plural = 'Prestations'
        ordering = ['type_prestation', 'nom']
    
    def __str__(self):
        return f"{self.get_type_prestation_display()} - {self.nom}"
    
    @property
    def prix_affichage(self):
        if self.prix_max and self.prix_max > self.prix_min:
            return f"{self.prix_min:,} à {self.prix_max:,} FCFA"
        return f"{self.prix_min:,} FCFA"
    
    def save(self, *args, **kwargs):
        # Remplir automatiquement le nom si non spécifié
        if not self.nom:
            self.nom = self.get_type_prestation_display()
        super().save(*args, **kwargs)
