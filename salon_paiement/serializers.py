from rest_framework import serializers
from .models import SessionPaiement, HistoriqueSession, Utilisateur
from clients.serializers import ClientSerializer
from prestations.serializers import PrestationSerializer
from paiements.serializers import PaiementDetailSerializer


class HistoriqueSessionSerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des sessions"""
    
    class Meta:
        model = HistoriqueSession
        fields = [
            'id', 'type_action', 'description', 'donnees', 
            'adresse_ip', 'date_action'
        ]
        read_only_fields = ['id', 'date_action']


class SessionPaiementListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des sessions"""
    client_nom = serializers.CharField(source='client.nom_complet', read_only=True)
    prestation_nom = serializers.CharField(source='prestation.nom', read_only=True)
    etape_actuelle = serializers.IntegerField(read_only=True)
    est_active = serializers.BooleanField(read_only=True)
    est_expire = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SessionPaiement
        fields = [
            'id', 'session_id', 'client_nom', 'prestation_nom', 
            'montant_final', 'statut', 'etape_actuelle', 
            'est_active', 'est_expire', 'date_creation', 'date_expiration'
        ]
        read_only_fields = ['id', 'date_creation']


class SessionPaiementSerializer(SessionPaiementListSerializer):
    pass


class SessionPaiementDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les sessions"""
    client = ClientSerializer(read_only=True)
    prestation = PrestationSerializer(read_only=True)
    historique = HistoriqueSessionSerializer(many=True, read_only=True)
    etape_actuelle = serializers.IntegerField(read_only=True)
    est_active = serializers.BooleanField(read_only=True)
    est_expire = serializers.BooleanField(read_only=True)
    duree_session = serializers.DurationField(read_only=True)
    
    class Meta:
        model = SessionPaiement
        fields = [
            'id', 'session_id', 'client', 'prestation', 'montant_final',
            'statut', 'etape_actuelle', 'est_active', 'est_expire',
            'qr_code_scanne', 'identification_terminee', 'prestation_selectionnee_le',
            'paiement_initie_le', 'paiement_termine_le',
            'user_agent', 'adresse_ip', 'appareil', 'donnees_session',
            'email_envoye', 'sms_envoye', 'date_creation', 'date_modification',
            'date_expiration', 'duree_session', 'historique'
        ]
        read_only_fields = [
            'id', 'date_creation', 'date_modification', 'duree_session'
        ]
    
    def to_representation(self, instance):
        """Ajouter des champs calculés"""
        representation = super().to_representation(instance)
        
        # Calculer la durée de la session
        if instance.date_creation:
            from django.utils import timezone
            representation['duree_session'] = timezone.now() - instance.date_creation
        
        # Ajouter le paiement associé si existant
        if 'paiement_id' in instance.donnees_session:
            try:
                from paiements.models import Paiement
                paiement = Paiement.objects.get(id=instance.donnees_session['paiement_id'])
                representation['paiement'] = PaiementDetailSerializer(paiement).data
            except Paiement.DoesNotExist:
                representation['paiement'] = None
        else:
            representation['paiement'] = None
        
        return representation


class SessionPaiementCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de sessions"""
    
    class Meta:
        model = SessionPaiement
        fields = [
            'session_id', 'user_agent', 'adresse_ip', 'appareil', 'date_expiration'
        ]
    
    def create(self, validated_data):
        """Créer une session avec les valeurs par défaut"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Définir une expiration par défaut si non fournie
        if 'date_expiration' not in validated_data:
            validated_data['date_expiration'] = timezone.now() + timedelta(hours=24)
        
        return super().create(validated_data)


class SessionPaiementUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des sessions"""
    
    class Meta:
        model = SessionPaiement
        fields = [
            'client', 'prestation', 'montant_final', 'statut',
            'donnees_session', 'email_envoye', 'sms_envoye'
        ]
    
    def validate(self, attrs):
        """Valider les transitions de statut"""
        instance = self.instance
        
        if 'statut' in attrs and instance:
            nouveau_statut = attrs['statut']
            ancien_statut = instance.statut
            
            # Valider les transitions de statut autorisées
            transitions_autorisees = {
                'scanne': ['identification'],
                'identification': ['prestation_selectionnee', 'abandonne'],
                'prestation_selectionnee': ['paiement_initie', 'abandonne'],
                'paiement_initie': ['paiement_reussi', 'paiement_echoue'],
                'paiement_reussi': [],  # Terminal
                'paiement_echoue': ['abandonne'],
                'abandonne': [],  # Terminal
                'expire': [],  # Terminal
            }
            
            if nouveau_statut not in transitions_autorisees.get(ancien_statut, []):
                raise serializers.ValidationError(
                    f'Transition de statut non autorisée: {ancien_statut} -> {nouveau_statut}'
                )
        
        return attrs


class ClientIdentificationSerializer(serializers.Serializer):
    """Serializer pour l'identification des clients"""
    telephone = serializers.CharField(max_length=20)
    client = ClientSerializer(required=False)
    
    def validate_telephone(self, value):
        """Valider le format du numéro de téléphone"""
        import re
        if not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError(
                "Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
            )
        return value


class PrestationSelectionSerializer(serializers.Serializer):
    """Serializer pour la sélection des prestations"""
    prestation_id = serializers.UUIDField()
    montant_final = serializers.IntegerField(required=False, min_value=0)
    
    def validate(self, attrs):
        """Valider le montant final selon la prestation"""
        prestation_id = attrs.get('prestation_id')
        montant_final = attrs.get('montant_final')
        
        if prestation_id and montant_final:
            try:
                from prestations.models import Prestation
                prestation = Prestation.objects.get(id=prestation_id)
                
                if prestation.prix_max and montant_final > prestation.prix_max:
                    raise serializers.ValidationError(
                        f'Le montant ne peut pas dépasser {prestation.prix_max} FCFA'
                    )
                
                if montant_final < prestation.prix_min:
                    raise serializers.ValidationError(
                        f'Le montant ne peut pas être inférieur à {prestation.prix_min} FCFA'
                    )
                    
            except Prestation.DoesNotExist:
                raise serializers.ValidationError('Prestation non trouvée')
        
        return attrs


class PaiementInitiationSerializer(serializers.Serializer):
    """Serializer pour l'initiation des paiements"""
    moyen_paiement = serializers.ChoiceField(choices=[
        ('mobile_money', 'Mobile Money'),
        ('carte_bancaire', 'Carte Bancaire'),
        ('carte_prepayee', 'Carte Prépayée'),
        ('espece', 'Espèce'),
    ])
    operateur_mobile = serializers.ChoiceField(choices=[
        ('wave', 'Wave'),
        ('orange', 'Orange Money'),
        ('mtn', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
    ], required=False)
    
    def validate(self, attrs):
        """Valider l'opérateur mobile pour les paiements mobile money"""
        moyen_paiement = attrs.get('moyen_paiement')
        operateur_mobile = attrs.get('operateur_mobile')
        
        if moyen_paiement == 'mobile_money' and not operateur_mobile:
            raise serializers.ValidationError(
                "L'opérateur mobile est requis pour les paiements Mobile Money"
            )
        
        if moyen_paiement != 'mobile_money' and operateur_mobile:
            raise serializers.ValidationError(
                "L'opérateur mobile n'est requis que pour les paiements Mobile Money"
            )
        
        return attrs


class UtilisateurSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Utilisateur"""
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'telephone', 'actif', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification']
    
    def validate_telephone(self, value):
        """Valider le format du numéro de téléphone"""
        if value:
            import re
            if not re.match(r'^\+?1?\d{9,15}$', value):
                raise serializers.ValidationError(
                    "Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
                )
        return value


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'utilisateurs"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = Utilisateur
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'role', 'telephone'
        ]
    
    def validate(self, attrs):
        """Valider que les mots de passe correspondent"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        
        return attrs
    
    def create(self, validated_data):
        """Créer un utilisateur avec un mot de passe hashé"""
        password = validated_data.pop('password_confirm')
        user = Utilisateur.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UtilisateurUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour des utilisateurs"""
    
    class Meta:
        model = Utilisateur
        fields = [
            'email', 'first_name', 'last_name', 'role', 'telephone', 'actif'
        ]
    
    def validate_telephone(self, value):
        """Valider le format du numéro de téléphone"""
        if value:
            import re
            if not re.match(r'^\+?1?\d{9,15}$', value):
                raise serializers.ValidationError(
                    "Le numéro de téléphone doit être au format: '+999999999'. Jusqu'à 15 chiffres autorisés."
                )
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer pour l'authentification des utilisateurs"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Valider les identifiants de connexion"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError(
                "Le nom d'utilisateur et le mot de passe sont requis"
            )
        
        # Vérifier si l'utilisateur existe et est actif
        try:
            user = Utilisateur.objects.get(username=username)
            if not user.actif:
                raise serializers.ValidationError(
                    "Ce compte est désactivé"
                )
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError(
                "Nom d'utilisateur ou mot de passe incorrect"
            )
        
        return attrs


class UtilisateurDetailSerializer(UtilisateurSerializer):
    """Serializer détaillé pour les utilisateurs"""
    
    class Meta(UtilisateurSerializer.Meta):
        fields = UtilisateurSerializer.Meta.fields + [
            'last_login', 'is_staff', 'is_superuser'
        ]
        read_only_fields = UtilisateurSerializer.Meta.read_only_fields + [
            'last_login', 'is_staff', 'is_superuser'
        ]
