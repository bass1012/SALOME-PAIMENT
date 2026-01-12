from rest_framework import serializers
from .models import Client, ClientFeedback


class ClientSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'prenom', 'sexe', 'telephone', 'email', 
            'date_anniversaire', 'lieu_habitation', 'nom_complet',
            'date_creation', 'date_modification', 'actif'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
    
    def validate_telephone(self, value):
        """Valider le format du numéro de téléphone"""
        # Vérifier si le téléphone est déjà utilisé par un autre client
        queryset = Client.objects.filter(telephone=value)
        # Exclure l'instance actuelle lors de la mise à jour
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError("Ce numéro de téléphone est déjà utilisé.")
        return value


class ClientListSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'prenom', 'sexe', 'telephone', 'email', 
            'date_anniversaire', 'lieu_habitation', 'nom_complet',
            'date_creation', 'date_modification', 'actif'
        ]


class ClientDetailSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    nombre_paiements = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'prenom', 'sexe', 'telephone', 'email', 
            'date_anniversaire', 'lieu_habitation', 'nom_complet',
            'date_creation', 'date_modification', 'actif', 'nombre_paiements'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
    
    def get_nombre_paiements(self, obj):
        return obj.paiements.count()


class ClientFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientFeedback
        fields = [
            'id', 'client_telephone', 'client_nom', 'client_prenom', 
            'rating', 'comment', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation']
    
    def validate_rating(self, value):
        """Valider que la note est entre 1 et 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value
    
    def validate(self, data):
        """Valider les données du feedback"""
        if not data.get('client_telephone'):
            raise serializers.ValidationError({"client_telephone": "Le numéro de téléphone est requis."})
        if not data.get('client_nom'):
            raise serializers.ValidationError({"client_nom": "Le nom du client est requis."})
        if not data.get('client_prenom'):
            raise serializers.ValidationError({"client_prenom": "Le prénom du client est requis."})
        return data
