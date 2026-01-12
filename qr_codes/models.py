from django.db import models
import uuid
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from clients.models import Client


class QRCode(models.Model):
    TYPE_QR_CHOICES = [
        ('identification', 'Identification Client'),
        ('prestation', 'Sélection Prestation'),
        ('paiement', 'Paiement'),
        ('recapitulatif', 'Récapitulatif'),
    ]
    
    STATUT_QR_CHOICES = [
        ('genere', 'Généré'),
        ('scanne', 'Scanné'),
        ('expire', 'Expiré'),
        ('utilise', 'Utilisé'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='qr_codes',
        blank=True,
        null=True
    )
    type_qr = models.CharField(max_length=20, choices=TYPE_QR_CHOICES)
    contenu = models.TextField(help_text="Contenu du QR code (JSON ou URL)")
    statut = models.CharField(
        max_length=20,
        choices=STATUT_QR_CHOICES,
        default='genere'
    )
    date_generation = models.DateTimeField(auto_now_add=True)
    date_scan = models.DateTimeField(blank=True, null=True)
    date_expiration = models.DateTimeField(blank=True, null=True)
    image_qr = models.ImageField(
        upload_to='qr_codes/',
        blank=True,
        null=True,
        help_text="Image du QR code généré"
    )
    nombre_scans = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'qr_codes'
        verbose_name = 'QR Code'
        verbose_name_plural = 'QR Codes'
        ordering = ['-date_generation']
    
    def __str__(self):
        client_info = f" - {self.client.nom_complet}" if self.client else ""
        return f"QR Code {self.get_type_qr_display()}{client_info}"
    
    def generer_qr_code(self):
        """Génère l'image du QR code et la sauvegarde"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(self.contenu)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Sauvegarder l'image dans un buffer
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Générer un nom de fichier unique
        filename = f"qr_{self.id}_{self.type_qr}.png"
        
        # Sauvegarder l'image dans le modèle
        self.image_qr.save(filename, ContentFile(buffer.getvalue()), save=False)
        
    def save(self, *args, **kwargs):
        # Générer le QR code si le contenu est défini et qu'aucune image n'existe
        if self.contenu and not self.image_qr:
            self.generer_qr_code()
        
        # Définir une date d'expiration si non définie (24h par défaut)
        if not self.date_expiration and self.type_qr != 'identification':
            from django.utils import timezone
            from datetime import timedelta
            self.date_expiration = timezone.now() + timedelta(hours=24)
        
        super().save(*args, **kwargs)
    
    def est_valide(self):
        """Vérifie si le QR code est encore valide"""
        from django.utils import timezone
        if not self.actif:
            return False
        if self.statut in ['expire', 'utilise']:
            return False
        if self.date_expiration and timezone.now() > self.date_expiration:
            return False
        return True
    
    def marquer_comme_scanne(self):
        """Marque le QR code comme scanné"""
        from django.utils import timezone
        self.statut = 'scanne'
        self.date_scan = timezone.now()
        self.nombre_scans += 1
        self.save()
    
    def marquer_comme_utilise(self):
        """Marque le QR code comme utilisé"""
        self.statut = 'utilise'
        self.save()
