from rest_framework import serializers
from .models import QRCode


class QRCodeSerializer(serializers.ModelSerializer):
    client_nom_complet = serializers.CharField(source='client.nom_complet', read_only=True)
    type_qrcode_display = serializers.CharField(source='get_type_qrcode_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    est_expire = serializers.ReadOnlyField()
    est_valide = serializers.ReadOnlyField()
    
    class Meta:
        model = QRCode
        fields = [
            'id', 'client', 'client_nom_complet', 'type_qrcode', 'type_qrcode_display',
            'contenu', 'statut', 'statut_display', 'image', 'date_expiration',
            'nombre_scans', 'nombre_utilisations', 'est_expire', 'est_valide',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'image', 'nombre_scans', 'nombre_utilisations', 
                           'date_creation', 'date_modification']
    
    def validate(self, data):
        """Valider les données du QR code"""
        # Valider que le client est spécifié
        if not data.get('client'):
            raise serializers.ValidationError("Le client doit être spécifié")
        
        # Valider la date d'expiration si spécifiée
        if data.get('date_expiration') and data['date_expiration'] < timezone.now():
            raise serializers.ValidationError("La date d'expiration doit être dans le futur")
        
        return data


class QRCodeListSerializer(serializers.ModelSerializer):
    client_nom_complet = serializers.CharField(source='client.nom_complet', read_only=True)
    type_qrcode_display = serializers.CharField(source='get_type_qrcode_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    est_expire = serializers.ReadOnlyField()
    
    class Meta:
        model = QRCode
        fields = [
            'id', 'client_nom_complet', 'type_qrcode_display', 'statut_display',
            'date_expiration', 'est_expire', 'date_creation'
        ]


class QRCodeDetailSerializer(serializers.ModelSerializer):
    client_nom_complet = serializers.CharField(source='client.nom_complet', read_only=True)
    type_qrcode_display = serializers.CharField(source='get_type_qrcode_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    est_expire = serializers.ReadOnlyField()
    est_valide = serializers.ReadOnlyField()
    
    class Meta:
        model = QRCode
        fields = [
            'id', 'client', 'client_nom_complet', 'type_qrcode', 'type_qrcode_display',
            'contenu', 'statut', 'statut_display', 'image', 'date_expiration',
            'nombre_scans', 'nombre_utilisations', 'est_expire', 'est_valide',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'image', 'nombre_scans', 'nombre_utilisations', 
                           'date_creation', 'date_modification']


class QRCodeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCode
        fields = ['client', 'type_qrcode', 'contenu', 'date_expiration']
    
    def validate(self, data):
        """Valider les données du QR code"""
        # Valider que le client est spécifié
        if not data.get('client'):
            raise serializers.ValidationError("Le client doit être spécifié")
        
        # Valider la date d'expiration si spécifiée
        if data.get('date_expiration') and data['date_expiration'] < timezone.now():
            raise serializers.ValidationError("La date d'expiration doit être dans le futur")
        
        return data
