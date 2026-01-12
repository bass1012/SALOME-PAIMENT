# Système de Permissions - Contrôle d'Accès par Rôle

## Vue d'ensemble

Le système de permissions de l'application est conçu pour restreindre l'accès aux fonctionnalités en fonction du rôle de l'utilisateur. Il existe deux rôles principaux :

- **Vendeur** : Peut créer et consulter des paiements et prestations, mais ne peut pas les modifier ou les supprimer
- **Administrateur** : A accès complet à toutes les fonctionnalités

## Classes de Permissions

### 1. CanViewCreatePaiements

**Fichier**: `salon_paiement/permissions.py`

**Description**: Permission pour vérifier si l'utilisateur peut voir et créer des paiements.

**Règles**:
- Les administrateurs peuvent effectuer toutes les actions (list, retrieve, create, update, partial_update, destroy)
- Les vendeurs peuvent seulement : list, retrieve, create
- Les vendeurs ne peuvent PAS : update, partial_update, destroy

**Utilisation**: 
```python
from salon_paiement.permissions import CanViewCreatePaiements

class PaiementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCreatePaiements]
```

### 2. CanViewCreatePrestations

**Fichier**: `salon_paiement/permissions.py`

**Description**: Permission pour vérifier si l'utilisateur peut voir et créer des prestations.

**Règles**:
- Les administrateurs peuvent effectuer toutes les actions (list, retrieve, create, update, partial_update, destroy)
- Les vendeurs peuvent seulement : list, retrieve, create
- Les vendeurs ne peuvent PAS : update, partial_update, destroy

**Utilisation**: 
```python
from salon_paiement.permissions import CanViewCreatePrestations

class PrestationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CanViewCreatePrestations]
```

## Implémentation Actuelle

### Paiements (paiements/views.py)

```python
class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated, CanViewCreatePaiements]
```

**Actions disponibles pour les vendeurs**:
- `GET /api/paiements/` - Lister les paiements
- `GET /api/paiements/{id}/` - Voir un paiement spécifique
- `POST /api/paiements/` - Créer un nouveau paiement

**Actions refusées pour les vendeurs**:
- `PUT /api/paiements/{id}/` - Modifier un paiement
- `PATCH /api/paiements/{id}/` - Modifier partiellement un paiement
- `DELETE /api/paiements/{id}/` - Supprimer un paiement

### Prestations (prestations/views.py)

```python
class PrestationViewSet(viewsets.ModelViewSet):
    queryset = Prestation.objects.all()
    serializer_class = PrestationSerializer
    permission_classes = [IsAuthenticated, CanViewCreatePrestations]
```

**Actions disponibles pour les vendeurs**:
- `GET /api/prestations/` - Lister les prestations
- `GET /api/prestations/{id}/` - Voir une prestation spécifique
- `POST /api/prestations/` - Créer une nouvelle prestation

**Actions refusées pour les vendeurs**:
- `PUT /api/prestations/{id}/` - Modifier une prestation
- `PATCH /api/prestations/{id}/` - Modifier partiellement une prestation
- `DELETE /api/prestations/{id}/` - Supprimer une prestation

## Actions Personnalisées

### Actions de Paiement

Les actions personnalisées suivantes sont également protégées par le système de permissions :

- `POST /api/paiements/{id}/marquer_reussi/` - Marquer un paiement comme réussi
- `POST /api/paiements/{id}/marquer_echoue/` - Marquer un paiement comme échoué
- `POST /api/paiements/{id}/annuler/` - Annuler un paiement
- `POST /api/paiements/{id}/initier_paiement_cinetpay/` - Initialiser un paiement CinetPay
- `POST /api/paiements/{id}/initier_paiement_paydunya/` - Initialiser un paiement PayDunya

Ces actions suivent les mêmes règles que les actions de base (update/destroy).

### Actions de Prestation

Les actions personnalisées suivantes sont également protégées :

- `POST /api/prestations/{id}/desactiver/` - Désactiver une prestation
- `POST /api/prestations/{id}/activer/` - Activer une prestation

Ces actions sont considérées comme des modifications et sont donc refusées aux vendeurs.

## Tests

Le système de permissions est testé avec le script `test_permissions_simple.py` qui vérifie :

1. Les vendeurs peuvent lister, voir et créer des paiements et prestations
2. Les vendeurs ne peuvent pas modifier ou supprimer des paiements et prestations
3. Les administrateurs peuvent effectuer toutes les opérations

Pour exécuter les tests :
```bash
python test_permissions_simple.py
```

## Sécurité

### Points Importants

1. **Validation au niveau des permissions** : Toutes les vérifications sont faites au niveau des classes de permissions Django REST Framework
2. **Séparation des responsabilités** : Les vendeurs sont limités aux opérations de création et consultation
3. **Audit trail** : Les modifications sont tracées et seuls les administrateurs peuvent effectuer des changements

### Bonnes Pratises

1. **Toujours utiliser les classes de permissions** : Ne jamais contourner le système de permissions
2. **Vérifier les rôles** : Toujours vérifier que l'utilisateur a le rôle approprié avant d'effectuer des actions sensibles
3. **Journalisation** : Les actions sensibles doivent être journalisées pour l'audit

## Évolution Future

### Améliorations Possibles

1. **Permissions plus granulaires** : Ajouter des permissions pour des actions spécifiques
2. **Gestion des rôles dynamiques** : Permettre de configurer les permissions via l'interface d'administration
3. **Audit détaillé** : Ajouter un système d'audit plus complet pour tracer toutes les actions

### Migration

Si vous devez modifier le système de permissions :

1. Créer une nouvelle classe de permission
2. Mettre à jour les ViewSets concernés
3. Mettre à jour les tests
4. Documenter les changements

## Conclusion

Le système de permissions actuel répond parfaitement à l'exigence de restreindre les vendeurs à la création et consultation des paiements et prestations, tout en permettant aux administrateurs d'avoir un contrôle complet sur le système.
