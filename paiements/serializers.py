from rest_framework import serializers
from .models import Paiement, TransactionExterne
from clients.serializers import ClientSerializer
from prestations.serializers import PrestationSerializer


class TransactionExterneSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionExterne
        fields = [
            'id', 'fournisseur', 'id_transaction_externe', 'reponse_api', 
            'statut_externe', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation']


class PaiementSerializer(serializers.ModelSerializer):
    moyen_paiement_affichage = serializers.ReadOnlyField()
    client_nom_complet = serializers.CharField(source='client.nom_complet', read_only=True)
    prestation_nom = serializers.CharField(source='prestation.nom', read_only=True)
    transactions_externes = TransactionExterneSerializer(many=True, read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'id', 'client', 'client_nom_complet', 'prestation', 'prestation_nom',
            'montant', 'moyen_paiement', 'operateur_mobile', 'moyen_paiement_affichage',
            'numero_transaction', 'reference_paiement', 'statut', 'date_paiement',
            'date_mise_a_jour', 'notes', 'transactions_externes'
        ]
        read_only_fields = ['id', 'date_paiement', 'date_mise_a_jour']
    
    def validate(self, data):
        """Valider les données du paiement"""
        # Valider que l'opérateur mobile est spécifié si le moyen de paiement est mobile money
        if data.get('moyen_paiement') == 'mobile_money' and not data.get('operateur_mobile'):
            raise serializers.ValidationError(
                "L'opérateur mobile doit être spécifié pour les paiements Mobile Money"
            )
        
        # Valider que le montant est positif
        if data.get('montant', 0) <= 0:
            raise serializers.ValidationError("Le montant doit être positif")
        
        return data


class PaiementListSerializer(serializers.ModelSerializer):
    moyen_paiement_affichage = serializers.ReadOnlyField()
    client_nom_complet = serializers.CharField(source='client.nom_complet', read_only=True)
    prestation_nom = serializers.CharField(source='prestation.nom', read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'id', 'client_nom_complet', 'prestation_nom', 'montant', 
            'moyen_paiement_affichage', 'statut', 'date_paiement'
        ]


class PaiementDetailSerializer(serializers.ModelSerializer):
    moyen_paiement_affichage = serializers.ReadOnlyField()
    client = ClientSerializer(read_only=True)
    prestation = PrestationSerializer(read_only=True)
    transactions_externes = TransactionExterneSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    moyen_paiement_display = serializers.CharField(source='get_moyen_paiement_display', read_only=True)
    operateur_mobile_display = serializers.CharField(source='get_operateur_mobile_display', read_only=True)
    
    class Meta:
        model = Paiement
        fields = [
            'id', 'client', 'prestation', 'montant', 'moyen_paiement', 
            'moyen_paiement_display', 'operateur_mobile', 'operateur_mobile_display',
            'moyen_paiement_affichage', 'numero_transaction', 'reference_paiement', 
            'statut', 'statut_display', 'date_paiement', 'date_mise_a_jour', 
            'notes', 'transactions_externes'
        ]
        read_only_fields = ['id', 'date_paiement', 'date_mise_a_jour']


class PaiementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = [
            'client', 'prestation', 'montant', 'moyen_paiement', 
            'operateur_mobile', 'notes'
        ]
    
    def validate(self, data):
        """Valider les données du paiement"""
        # Valider que l'opérateur mobile est spécifié si le moyen de paiement est mobile money
        if data.get('moyen_paiement') == 'mobile_money' and not data.get('operateur_mobile'):
            raise serializers.ValidationError(
                "L'opérateur mobile doit être spécifié pour les paiements Mobile Money"
            )
        
        # Valider que le montant est positif
        if data.get('montant', 0) <= 0:
            raise serializers.ValidationError("Le montant doit être positif")
        
        return data
