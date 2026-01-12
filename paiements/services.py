import requests
import json
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import Paiement, TransactionExterne
import os
from dotenv import load_dotenv

load_dotenv()


class PaymentService:
    """Service pour gérer les paiements avec différents fournisseurs"""
    
    def __init__(self):
        self.cinetpay_api_key = os.getenv('CINETPAY_API_KEY')
        self.cinetpay_site_id = os.getenv('CINETPAY_SITE_ID')
        self.cinetpay_secret_key = os.getenv('CINETPAY_SECRET_KEY')
        
        self.paydunya_api_key = os.getenv('PAYDUNYA_API_KEY')
        self.paydunya_secret_key = os.getenv('PAYDUNYA_SECRET_KEY')
        self.paydunya_token = os.getenv('PAYDUNYA_TOKEN')
    
    def initier_paiement_cinetpay(self, paiement):
        """Initialiser un paiement avec CinetPay"""
        if not all([self.cinetpay_api_key, self.cinetpay_site_id]):
            raise ValueError("Configuration CinetPay manquante")
        
        # Données du paiement
        payment_data = {
            'apikey': self.cinetpay_api_key,
            'site_id': self.cinetpay_site_id,
            'transaction_id': str(paiement.id),
            'amount': paiement.montant,
            'currency': 'XOF',
            'description': f"Paiement pour {paiement.prestation.nom}",
            'customer_name': paiement.client.nom,
            'customer_surname': paiement.client.prenom,
            'customer_email': paiement.client.email or '',
            'customer_phone_number': paiement.client.telephone,
            'customer_address': paiement.client.lieu_habitation or '',
            'customer_city': '',
            'customer_country': 'CI',
            'return_url': 'http://localhost:3000/paiement/succes',
            'notify_url': 'http://localhost:8000/api/paiements/cinetpay-notification/',
            'metadata': {
                'paiement_id': str(paiement.id),
                'client_id': str(paiement.client.id),
                'prestation_id': str(paiement.prestation.id)
            }
        }
        
        try:
            # Appel à l'API CinetPay
            response = requests.post(
                'https://api-checkout.cinetpay.com/v2/payment',
                json=payment_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == '201':
                    # Créer la transaction externe
                    TransactionExterne.objects.create(
                        paiement=paiement,
                        fournisseur='cinetpay',
                        id_transaction_externe=result.get('data', {}).get('payment_token'),
                        reponse_api=result,
                        statut_externe='initie'
                    )
                    
                    return {
                        'success': True,
                        'payment_url': result.get('data', {}).get('payment_url'),
                        'payment_token': result.get('data', {}).get('payment_token')
                    }
                else:
                    return {
                        'success': False,
                        'error': result.get('message', 'Erreur CinetPay')
                    }
            else:
                return {
                    'success': False,
                    'error': f'Erreur HTTP {response.status_code}'
                }
                
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'Erreur de connexion: {str(e)}'
            }
    
    def verifier_paiement_cinetpay(self, payment_token):
        """Vérifier le statut d'un paiement CinetPay"""
        if not all([self.cinetpay_api_key, self.cinetpay_site_id]):
            raise ValueError("Configuration CinetPay manquante")
        
        try:
            response = requests.post(
                'https://api-checkout.cinetpay.com/v2/payment/check',
                json={
                    'apikey': self.cinetpay_api_key,
                    'site_id': self.cinetpay_site_id,
                    'transaction_id': payment_token
                },
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result
            else:
                return {'error': f'Erreur HTTP {response.status_code}'}
                
        except requests.RequestException as e:
            return {'error': f'Erreur de connexion: {str(e)}'}
    
    def initier_paiement_paydunya(self, paiement):
        """Initialiser un paiement avec PayDunya"""
        if not all([self.paydunya_api_key, self.paydunya_secret_key, self.paydunya_token]):
            raise ValueError("Configuration PayDunya manquante")
        
        # Configuration PayDunya
        headers = {
            'Content-Type': 'application/json',
            'PAYDUNYA-MASTER-KEY': self.paydunya_master_key,
            'PAYDUNYA-PRIVATE-KEY': self.paydunya_private_key,
            'PAYDUNYA-TOKEN': self.paydunya_token
        }
        
        payment_data = {
            'invoice': {
                'items': [
                    {
                        'name': paiement.prestation.nom,
                        'quantity': 1,
                        'unit_price': paiement.montant,
                        'total_price': paiement.montant
                    }
                ],
                'total_amount': paiement.montant,
                'description': f"Paiement pour {paiement.prestation.nom}",
                'callback_url': 'http://localhost:8000/api/paiements/paydunya-notification/',
                'return_url': 'http://localhost:3000/paiement/succes',
                'cancel_url': 'http://localhost:3000/paiement/annule'
            },
            'store': {
                'name': 'Salon de Coiffure',
                'website_url': 'http://localhost:3000'
            },
            'customer': {
                'name': f"{paiement.client.prenom} {paiement.client.nom}",
                'phone': paiement.client.telephone,
                'email': paiement.client.email or ''
            },
            'custom_data': {
                'paiement_id': str(paiement.id),
                'client_id': str(paiement.client.id),
                'prestation_id': str(paiement.prestation.id)
            }
        }
        
        try:
            response = requests.post(
                'https://app.paydunya.com/api/v1/checkout-invoice/create',
                json=payment_data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response_code') == '00':
                    # Créer la transaction externe
                    TransactionExterne.objects.create(
                        paiement=paiement,
                        fournisseur='paydunya',
                        id_transaction_externe=result.get('token'),
                        reponse_api=result,
                        statut_externe='initie'
                    )
                    
                    return {
                        'success': True,
                        'payment_url': result.get('response_text'),
                        'token': result.get('token')
                    }
                else:
                    return {
                        'success': False,
                        'error': result.get('response_text', 'Erreur PayDunya')
                    }
            else:
                return {
                    'success': False,
                    'error': f'Erreur HTTP {response.status_code}'
                }
                
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'Erreur de connexion: {str(e)}'
            }
    
    def traiter_notification_cinetpay(self, data):
        """Traiter les notifications de CinetPay"""
        try:
            transaction_id = data.get('transaction_id')
            statut = data.get('status')
            metadata = data.get('metadata', {})
            
            paiement_id = metadata.get('paiement_id')
            
            if not paiement_id:
                return {'success': False, 'error': 'ID de paiement manquant'}
            
            try:
                paiement = Paiement.objects.get(id=paiement_id)
            except Paiement.DoesNotExist:
                return {'success': False, 'error': 'Paiement non trouvé'}
            
            # Mettre à jour le statut du paiement
            if statut == 'completed':
                paiement.statut = 'reussi'
            elif statut == 'failed':
                paiement.statut = 'echoue'
            elif statut == 'cancelled':
                paiement.statut = 'annule'
            else:
                paiement.statut = 'en_cours'
            
            paiement.date_mise_a_jour = timezone.now()
            paiement.numero_transaction = transaction_id
            paiement.save()
            
            # Mettre à jour la transaction externe
            transaction_externe = TransactionExterne.objects.filter(
                paiement=paiement,
                fournisseur='cinetpay'
            ).first()
            
            if transaction_externe:
                transaction_externe.statut_externe = statut
                transaction_externe.reponse_api = data
                transaction_externe.save()
            
            return {'success': True, 'paiement_id': str(paiement.id)}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def traiter_notification_paydunya(self, data):
        """Traiter les notifications de PayDunya"""
        try:
            token = data.get('token')
            statut = data.get('status')
            custom_data = data.get('custom_data', {})
            
            paiement_id = custom_data.get('paiement_id')
            
            if not paiement_id:
                return {'success': False, 'error': 'ID de paiement manquant'}
            
            try:
                paiement = Paiement.objects.get(id=paiement_id)
            except Paiement.DoesNotExist:
                return {'success': False, 'error': 'Paiement non trouvé'}
            
            # Mettre à jour le statut du paiement
            if statut == 'completed':
                paiement.statut = 'reussi'
            elif statut == 'failed':
                paiement.statut = 'echoue'
            elif statut == 'cancelled':
                paiement.statut = 'annule'
            else:
                paiement.statut = 'en_cours'
            
            paiement.date_mise_a_jour = timezone.now()
            paiement.reference_paiement = token
            paiement.save()
            
            # Mettre à jour la transaction externe
            transaction_externe = TransactionExterne.objects.filter(
                paiement=paiement,
                fournisseur='paydunya'
            ).first()
            
            if transaction_externe:
                transaction_externe.statut_externe = statut
                transaction_externe.reponse_api = data
                transaction_externe.save()
            
            return {'success': True, 'paiement_id': str(paiement.id)}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}


# Instance globale du service de paiement
payment_service = PaymentService()
