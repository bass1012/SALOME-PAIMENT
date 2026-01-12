# Guide d'intégration de CinetPay

## 📋 Prérequis

1. **Compte CinetPay**
   - Créer un compte sur [CinetPay](https://www.cinetpay.com/)
   - Obtenir vos identifiants API
   - Configurer vos modes de paiement

2. **Configuration technique**
   - Python 3.9+
   - Django 4.2+
   - SDK CinetPay installé

## 🔧 Installation

### 1. Installer le SDK CinetPay
```bash
pip install cinetpay==1.0.5
```

### 2. Configurer les identifiants
Éditez le fichier `cinetpay_config.py`:

```python
CINETPAY_CONFIG = {
    'SITE_ID': 'VOTRE_SITE_ID',  # Votre Site ID CinetPay
    'API_KEY': 'VOTRE_API_KEY',  # Votre API Key CinetPay
    'SECRET_KEY': 'VOTRE_SECRET_KEY',  # Votre Secret Key CinetPay
    'MODE': 'test',  # 'test' pour le mode test, 'prod' pour la production
    'VERSION': 'v2',
    'CURRENCY': 'XOF',
    'LANGUE': 'fr',
    'NOTIFY_URL': 'https://votre-domaine.com/api/cinetpay/notify/',
    'RETURN_URL': 'https://votre-domaine.com/session/{session_id}/confirmation/',
    'CANCEL_URL': 'https://votre-domaine.com/session/{session_id}/annulation/',
}
```

### 3. Configurer les URLs de notification
Assurez-vous que les URLs suivantes sont accessibles publiquement :

- **URL de notification (IPN)** : `https://votre-domaine.com/api/cinetpay/notify/`
- **URL de retour succès** : `https://votre-domaine.com/session/{session_id}/confirmation/`
- **URL de retour échec** : `https://votre-domaine.com/session/{session_id}/annulation/`

## 🚀 Utilisation

### 1. Initialiser un paiement

```python
from paiements.services.cinetpay_service import CinetPayService

# Créer une instance du service
cinetpay_service = CinetPayService()

# Initialiser un paiement
result = cinetpay_service.initier_paiement(
    session_paiement=session,
    montant=1000,
    moyen_paiement='mobile_money'
)

if result['success']:
    # Rediriger l'utilisateur vers l'URL de paiement
    payment_url = result['payment_url']
    return redirect(payment_url)
else:
    # Gérer l'erreur
    error_message = result['error']
```

### 2. Vérifier le statut d'un paiement

```python
# Vérifier le statut
result = cinetpay_service.verifier_paiement(transaction_id)

if result['success']:
    if result['status'] == 'success':
        # Paiement réussi
        print("Paiement réussi!")
    else:
        # Paiement échoué
        print("Paiement échoué:", result['message'])
```

### 3. Traiter les notifications (IPN)

Le système traite automatiquement les notifications via le webhook configuré.

## 📱 Modes de paiement supportés

### Mobile Money
- **Côte d'Ivoire**: MTN, Orange, Moov, Wave
- **Bénin**: MTN, Moov
- **Sénégal**: MTN, Orange, Wave
- **Mali**: MTN, Orange, Moov
- **Burkina Faso**: MTN, Orange, Moov
- **Niger**: MTN, Orange, Moov
- **Togo**: MTN, Moov
- **Cameroun**: MTN, Orange, MTN Cameroun

### Carte Bancaire
- Visa
- Mastercard

### Virement Bancaire
- Virement bancaire direct

## 🔍 Configuration des URLs

### 1. URLs de l'API
```python
CINETPAY_URLS = {
    'test': {
        'payment_url': 'https://api-checkout.cinetpay.com/v2/payment',
        'check_url': 'https://api-checkout.cinetpay.com/v2/payment/check',
        'notify_url': 'https://api-checkout.cinetpay.com/v2/payment/notify',
    },
    'prod': {
        'payment_url': 'https://api.cinetpay.com/v2/payment',
        'check_url': 'https://api.cinetpay.com/v2/payment/check',
        'notify_url': 'https://api.cinetpay.com/v2/payment/notify',
    }
}
```

### 2. URLs de callback
Configurez ces URLs dans votre dashboard CinetPay :

- **URL IPN**: `https://votre-domaine.com/api/paiements/cinetpay_notification/`
- **URL Return**: `https://votre-domaine.com/session/{session_id}/confirmation/`
- **URL Cancel**: `https://votre-domaine.com/session/{session_id}/annulation/`

## 🧪 Tests

### 1. Mode Test
Utilisez le mode test pour vos développements :

```python
CINETPAY_CONFIG = {
    'MODE': 'test',
    # ... autres configurations
}
```

### 2. Données de test
CinetPay fournit des données de test pour simuler des paiements.

## 🚨 Sécurité

### 1. Validation des notifications
Toutes les notifications sont validées avec le Site ID pour éviter les requêtes non autorisées.

### 2. HTTPS
Assurez-vous que toutes les URLs utilisent HTTPS en production.

### 3. Clés API
Ne communiquez jamais vos clés API et gardez-les sécurisées.

## 📊 Monitoring

### 1. Logs
Le système génère des logs détaillés pour toutes les opérations CinetPay.

### 2. Statuts de paiement
- `en_attente`: Paiement en attente d'initialisation
- `en_cours`: Paiement en cours de traitement
- `reussi`: Paiement réussi
- `echoue`: Paiement échoué
- `annule`: Paiement annulé

## 🔧 Dépannage

### 1. Erreurs courantes

#### "Site non autorisé"
- Vérifiez votre Site ID dans la configuration
- Assurez-vous que le Site ID est correct dans le dashboard CinetPay

#### "API Key invalide"
- Vérifiez votre API Key
- Assurez-vous que la clé est active dans le dashboard CinetPay

#### "URL de notification inaccessible"
- Vérifiez que votre URL de notification est accessible publiquement
- Assurez-vous que le port 80/443 est ouvert

### 2. Debug
Activez les logs pour voir les détails des requêtes :

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📞 Support

- **Documentation CinetPay**: https://docs.cinetpay.com/
- **Support CinetPay**: support@cinetpay.com
- **Dashboard**: https://secure.cinetpay.com/

## 🔄 Migration vers la production

1. **Mettre à jour la configuration**:
   ```python
   CINETPAY_CONFIG = {
       'MODE': 'prod',
       # ... autres configurations
   }
   ```

2. **Mettre à jour les URLs**:
   - Remplacez `http://localhost:8000` par votre domaine de production
   - Assurez-vous que toutes les URLs utilisent HTTPS

3. **Tester en production**:
   - Faites des tests avec de petits montants
   - Vérifiez que les notifications fonctionnent correctement

4. **Monitor les transactions**:
   - Surveillez les logs
   - Vérifiez régulièrement le dashboard CinetPay
