from rest_framework import serializers
from .models import Prestation


class PrestationSerializer(serializers.ModelSerializer):
    prix_affichage = serializers.ReadOnlyField()
    
    class Meta:
        model = Prestation
        fields = [
            'id', 'nom', 'type_prestation', 'description', 'prix_min', 
            'prix_max', 'prix_affichage', 'duree_estimee', 'actif',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
    
    def validate(self, data):
        """Valider les données de la prestation"""
        # Vérifier que prix_max est supérieur ou égal à prix_min si spécifié
        if data.get('prix_max') and data['prix_max'] < data['prix_min']:
            raise serializers.ValidationError(
                "Le prix maximum doit être supérieur ou égal au prix minimum"
            )
        return data


class PrestationListSerializer(serializers.ModelSerializer):
    prix_affichage = serializers.ReadOnlyField()
    
    class Meta:
        model = Prestation
        fields = ['id', 'nom', 'type_prestation', 'prix_affichage', 'duree_estimee', 'actif']


class PrestationDetailSerializer(serializers.ModelSerializer):
    prix_affichage = serializers.ReadOnlyField()
    type_prestation_display = serializers.CharField(source='get_type_prestation_display', read_only=True)
    
    class Meta:
        model = Prestation
        fields = [
            'id', 'nom', 'type_prestation', 'type_prestation_display', 'description', 
            'prix_min', 'prix_max', 'prix_affichage', 'duree_estimee', 'actif',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
