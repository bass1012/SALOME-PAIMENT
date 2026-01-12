"""
Service principal de gestion des paiements
"""
import logging
from .cinetpay_service import CinetPayService

logger = logging.getLogger(__name__)

class PaymentService:
    """
    Service principal qui coordonne les différents fournisseurs de paiement
    """
    
    def __init__(self):
        self.cinetpay_service = CinetPayService()
    
    def initier_paiement_cinetpay(self, paiement):
        """
        Initialiser un paiement via CinetPay
        """
        try:
            session_paiement = paiement.session_paiement
            result = self.cinetpay_service.initier_paiement(
                session_paiement=session_paiement,
                montant=paiement.montant,
                moyen_paiement=paiement.moyen_paiement
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation CinetPay: {str(e)}")
            return {
                'success': False,
                'error': f"Erreur technique: {str(e)}"
            }
    
    def traiter_notification_cinetpay(self, notification_data):
        """
        Traiter les notifications de CinetPay
        """
        try:
            result = self.cinetpay_service.traiter_notification(notification_data)
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement notification CinetPay: {str(e)}")
            return {
                'success': False,
                'error': f"Erreur technique: {str(e)}"
            }
    
    def initier_paiement_paydunya(self, paiement):
        """
        Initialiser un paiement via PayDunya (à implémenter)
        """
        return {
            'success': False,
            'error': 'PayDunya non implémenté'
        }
    
    def traiter_notification_paydunya(self, notification_data):
        """
        Traiter les notifications de PayDunya (à implémenter)
        """
        return {
            'success': False,
            'error': 'PayDunya non implémenté'
        }

# Instance unique du service
payment_service = PaymentService()
