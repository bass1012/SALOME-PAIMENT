# Configuration Mobile Money pour Salon de Coiffure

## État Actuel
✅ **Infrastructure prête** : Votre projet a déjà l'intégration CinetPay et PayDunya configurée
✅ **Modèles complets** : Supporte Wave, Orange Money, MTN Mobile Money, Moov Money
✅ **Service de paiement** : `paiements/services.py` contient la logique d'intégration

## Configuration Requise

### 1. Obtenir les clés API

#### **CinetPay** (Recommandé pour l'Afrique de l'Ouest)
1. Créer un compte sur [CinetPay](https://www.cinetpay.com/)
2. Obtenir les clés :
   - `CINETPAY_API_KEY`
   - `CINETPAY_SITE_ID` 
   - `CINETPAY_SECRET_KEY`

#### **PayDunya** (Alternative pour le Sénégal)
1. Créer un compte sur [PayDunya](https://paydunya.com/)
2. Obtenir les clés :
   - `PAYDUNYA_API_KEY`
   - `PAYDUNYA_SECRET_KEY`
   - `PAYDUNYA_TOKEN`

### 2. Mettre à jour le fichier `.env`
```bash
# Configuration CinetPay
CINETPAY_API_KEY=votre_api_key_cinetpay
CINETPAY_SITE_ID=votre_site_id_cinetpay
CINETPAY_SECRET_KEY=votre_secret_key_cinetpay

# Configuration PayDunya (optionnel)
PAYDUNYA_API_KEY=votre_api_key_paydunya
PAYDUNYA_SECRET_KEY=votre_secret_key_paydunya
PAYDUNYA_TOKEN=votre_token_paydunya
```

### 3. Configurer les URLs de retour
Dans votre dashboard CinetPay/PayDunya, configurer :

**URLs de succès :**
- `http://localhost:3000/paiement/succes` (développement)
- `https://votre-domaine.com/paiement/succes` (production)

**URLs de notification (webhooks) :**
- `http://localhost:8000/api/paiements/cinetpay-notification/` (développement)
- `https://votre-api.com/api/paiements/cinetpay-notification/` (production)

## Améliorations du Service de Paiement

### Service amélioré pour CinetPay
```python
# Dans paiements/services.py - ajouter ces méthodes

def verifier_statut_paiement(self, transaction_id):
    """Vérifier le statut d'une transaction CinetPay"""
    if not all([self.cinetpay_api_key, self.cinetpay_site_id]):
        raise ValueError("Configuration CinetPay manquante")
    
    url = "https://api-checkout.cinetpay.com/v2/payment/check"
    data = {
        'apikey': self.cinetpay_api_key,
        'site_id': self.cinetpay_site_id,
        'transaction_id': transaction_id
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        return {
            'success': result.get('code') == '00',
            'status': result.get('status'),
            'message': result.get('message'),
            'data': result.get('data', {})
        }
    except requests.RequestException as e:
        return {
            'success': False,
            'error': str(e),
            'message': 'Erreur de connexion à CinetPay'
        }

def gerer_notification_cinetpay(self, request_data):
    """Gérer les notifications webhook de CinetPay"""
    transaction_id = request_data.get('cpm_trans_id')
    paiement_id = request_data.get('metadata', {}).get('paiement_id')
    
    if not paiement_id:
        return {'success': False, 'message': 'Paiement ID manquant'}
    
    try:
        paiement = Paiement.objects.get(id=paiement_id)
        
        # Vérifier le statut réel auprès de CinetPay
        statut_info = self.verifier_statut_paiement(transaction_id)
        
        if statut_info['success']:
            if statut_info['status'] == 'ACCEPTED':
                paiement.statut = 'reussi'
                paiement.numero_transaction = transaction_id
                paiement.reference_paiement = request_data.get('cpm_payment_date')
            elif statut_info['status'] == 'FAILED':
                paiement.statut = 'echoue'
            
            paiement.save()
            
            # Mettre à jour la session associée
            from salon_paiement.models import SessionPaiement
            try:
                session = SessionPaiement.objects.get(
                    donnees_session__paiement_id=str(paiement.id)
                )
                if paiement.statut == 'reussi':
                    session.statut = 'paiement_reussi'
                else:
                    session.statut = 'paiement_echoue'
                session.save()
            except SessionPaiement.DoesNotExist:
                pass
            
            return {'success': True, 'message': 'Paiement mis à jour'}
        else:
            return {'success': False, 'message': statut_info.get('message', 'Erreur inconnue')}
            
    except Paiement.DoesNotExist:
        return {'success': False, 'message': 'Paiement non trouvé'}
```

### 4. Webhook pour les notifications
```python
# Dans paiements/views.py - ajouter cette vue

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

@csrf_exempt
def cinetpay_webhook(request):
    """Webhook pour recevoir les notifications de CinetPay"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
    
    try:
        data = json.loads(request.body)
        payment_service = PaymentService()
        result = payment_service.gerer_notification_cinetpay(data)
        
        if result['success']:
            return JsonResponse({'message': 'Notification traitée avec succès'})
        else:
            return JsonResponse({'error': result['message']}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON invalide'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
```

### 5. URLs pour les webhooks
```python
# Dans salon_paiement/urls.py

from django.urls import path
from paiements.views import cinetpay_webhook

urlpatterns = [
    # ... vos autres URLs
    path('cinetpay-notification/', cinetpay_webhook, name='cinetpay-webhook'),
]
```

## Test de l'intégration

### 1. Test en mode sandbox
CinetPay offre un mode sandbox pour tester :
```python
# Dans settings.py
CINETPAY_SANDBOX = True  # Passer à False en production
```

### 2. Scénarios de test
- ✅ Paiement réussi avec Mobile Money
- ✅ Paiement échoué (fonds insuffisants)
- ✅ Annulation de paiement
- ✅ Notification webhook reçue
- ✅ Mise à jour du statut dans la base de données

## Déploiement en Production

### 1. Configuration HTTPS
- SSL obligatoire pour les paiements
- Utiliser Let's Encrypt ou un certificat commercial

### 2. Sécurité
- Ne jamais exposer les clés API dans le frontend
- Utiliser des variables d'environnement
- Valider toutes les données reçues des webhooks

### 3. Monitoring
- Logger toutes les transactions
- Surveiller les taux d'échec
- Mettre en place des alertes pour les erreurs critiques

## Prochaines Étapes

1. **Obtenir les clés API** CinetPay/PayDunya
2. **Configurer le fichier `.env`** avec les clés
3. **Tester l'intégration** en mode sandbox
4. **Déployer en production** avec HTTPS
5. **Monitorer les transactions** et les performances
