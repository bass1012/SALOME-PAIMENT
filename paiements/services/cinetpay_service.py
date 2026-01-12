"""
Service CinetPay pour la gestion des paiements
"""
import requests
import json
import logging
from datetime import datetime
from django.conf import settings
from django.urls import reverse
from ..models import Paiement
from salon_paiement.cinetpay_config import CINETPAY_CONFIG, CINETPAY_URLS

logger = logging.getLogger(__name__)

class CinetPayService:
    """
    Service pour interagir avec l'API CinetPay
    """
    
    def __init__(self):
        self.config = CINETPAY_CONFIG
        self.mode = self.config['MODE']
        self.urls = CINETPAY_URLS[self.mode]
    
    def initier_paiement(self, session_paiement, montant, moyen_paiement):
        """
        Initialiser un paiement via CinetPay
        """
        try:
            # Générer un identifiant de transaction unique
            transaction_id = f"TRX_{datetime.now().strftime('%Y%m%d%H%M%S')}_{session_paiement.id}"
            
            # Construire l'URL de base
            base_url = "http://localhost:8000"  # À remplacer par votre domaine en production
            
            # Préparer les données pour CinetPay
            payment_data = {
                'apikey': self.config['API_KEY'],
                'site_id': self.config['SITE_ID'],
                'transaction_id': transaction_id,
                'amount': montant,
                'currency': self.config['CURRENCY'],
                'description': f'Paiement pour session {session_paiement.id}',
                'customer_id': str(session_paiement.client.id),
                'customer_name': session_paiement.client.nom,
                'customer_surname': session_paiement.client.prenom,
                'customer_email': getattr(session_paiement.client, 'email', ''),
                'customer_phone_number': session_paiement.client.telephone,
                'customer_address': getattr(session_paiement.client, 'adresse', ''),
                'customer_city': getattr(session_paiement.client, 'ville', ''),
                'customer_country': getattr(session_paiement.client, 'pays', 'CI'),
                'notify_url': base_url + reverse('cinetpay-notify'),
                'return_url': base_url + reverse('session-confirmation', kwargs={'session_id': session_paiement.id}),
                'cancel_url': base_url + reverse('session-annulation', kwargs={'session_id': session_paiement.id}),
                'metadata': json.dumps({
                    'session_id': session_paiement.id,
                    'paiement_id': None,  # Sera mis à jour après création du paiement
                    'moyen_paiement': moyen_paiement
                }),
                'alternative_currency': '',
                'customer_language': self.config['LANGUE'],
                'channels': self._get_channel_for_payment_method(moyen_paiement)
            }
            
            # Créer le paiement en base de données
            paiement = Paiement.objects.create(
                session_paiement=session_paiement,
                montant=montant,
                moyen_paiement=moyen_paiement,
                reference_transaction=transaction_id,
                statut='en_attente'
            )
            
            # Mettre à jour le metadata avec l'ID du paiement
            payment_data['metadata'] = json.dumps({
                'session_id': session_paiement.id,
                'paiement_id': paiement.id,
                'moyen_paiement': moyen_paiement
            })
            
            # Appeler l'API CinetPay
            response = requests.post(
                self.urls['payment_url'],
                json=payment_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('code') == '201':
                    # Paiement initié avec succès
                    paiement.url_paiement = result.get('data', {}).get('payment_url')
                    paiement.save()
                    
                    return {
                        'success': True,
                        'payment_url': paiement.url_paiement,
                        'transaction_id': transaction_id,
                        'paiement_id': paiement.id
                    }
                else:
                    # Erreur dans la réponse CinetPay
                    logger.error(f"Erreur CinetPay: {result.get('message', 'Erreur inconnue')}")
                    paiement.statut = 'echoue'
                    paiement.message_erreur = result.get('message', 'Erreur CinetPay')
                    paiement.save()
                    
                    return {
                        'success': False,
                        'error': result.get('message', 'Erreur lors de l\'initialisation du paiement')
                    }
            else:
                # Erreur HTTP
                logger.error(f"Erreur HTTP CinetPay: {response.status_code} - {response.text}")
                paiement.statut = 'echoue'
                paiement.message_erreur = f"Erreur HTTP {response.status_code}"
                paiement.save()
                
                return {
                    'success': False,
                    'error': f"Erreur technique lors de l'initialisation du paiement"
                }
                
        except Exception as e:
            logger.error(f"Exception lors de l'initialisation CinetPay: {str(e)}")
            return {
                'success': False,
                'error': f"Erreur technique: {str(e)}"
            }
    
    def verifier_paiement(self, transaction_id):
        """
        Vérifier le statut d'un paiement
        """
        try:
            check_data = {
                'apikey': self.config['API_KEY'],
                'site_id': self.config['SITE_ID'],
                'transaction_id': transaction_id
            }
            
            response = requests.post(
                self.urls['check_url'],
                json=check_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('code') == '00':
                    # Paiement réussi
                    payment_data = result.get('data', {})
                    metadata = json.loads(payment_data.get('metadata', '{}'))
                    
                    # Mettre à jour le paiement
                    paiement_id = metadata.get('paiement_id')
                    if paiement_id:
                        paiement = Paiement.objects.get(id=paiement_id)
                        paiement.statut = 'reussi'
                        paiement.date_paiement = datetime.now()
                        paiement.reference_transaction = payment_data.get('cpm_trans_id', transaction_id)
                        paiement.save()
                    
                    return {
                        'success': True,
                        'status': 'success',
                        'payment_data': payment_data
                    }
                else:
                    # Paiement échoué ou en attente
                    payment_data = result.get('data', {})
                    metadata = json.loads(payment_data.get('metadata', '{}'))
                    
                    paiement_id = metadata.get('paiement_id')
                    if paiement_id:
                        paiement = Paiement.objects.get(id=paiement_id)
                        paiement.statut = 'echoue'
                        paiement.message_erreur = result.get('message', 'Paiement échoué')
                        paiement.save()
                    
                    return {
                        'success': False,
                        'status': 'failed',
                        'message': result.get('message', 'Paiement échoué')
                    }
            else:
                logger.error(f"Erreur HTTP vérification: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Erreur technique lors de la vérification"
                }
                
        except Exception as e:
            logger.error(f"Exception vérification paiement: {str(e)}")
            return {
                'success': False,
                'error': f"Erreur technique: {str(e)}"
            }
    
    def traiter_notification(self, notification_data):
        """
        Traiter les notifications de CinetPay (IPN)
        """
        try:
            transaction_id = notification_data.get('cpm_trans_id')
            site_id = notification_data.get('cpm_site_id')
            
            # Vérifier que la notification vient bien de notre site
            if site_id != self.config['SITE_ID']:
                logger.error(f"Notification non autorisée pour le site_id: {site_id}")
                return {'success': False, 'error': 'Site non autorisé'}
            
            # Vérifier le statut du paiement
            verification_result = self.verifier_paiement(transaction_id)
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Exception traitement notification: {str(e)}")
            return {
                'success': False,
                'error': f"Erreur technique: {str(e)}"
            }
    
    def _get_channel_for_payment_method(self, moyen_paiement):
        """
        Déterminer le canal CinetPay en fonction du moyen de paiement
        """
        method_mapping = {
            'mobile_money': 'MOBILE_MONEY',
            'carte_bancaire': 'CARD',
            'bank_transfer': 'BANK_TRANSFER'
        }
        
        return method_mapping.get(moyen_paiement, 'ALL')
