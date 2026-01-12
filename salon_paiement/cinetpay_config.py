"""
Configuration pour CinetPay
À compléter avec vos identifiants CinetPay réels
"""

# Configuration CinetPay
CINETPAY_CONFIG = {
    'SITE_ID': '',  # Votre Site ID CinetPay
    'API_KEY': '',  # Votre API Key CinetPay
    'SECRET_KEY': '',  # Votre Secret Key CinetPay
    'MODE': 'test',  # 'test' pour le mode test, 'prod' pour la production
    'VERSION': 'v2',  # Version de l'API CinetPay
    'CURRENCY': 'XOF',  # Devise (XOF pour Franc CFA)
    'LANGUE': 'fr',  # Langue
    'NOTIFY_URL': 'https://votre-domaine.com/api/cinetpay/notify/',  # URL de notification
    'RETURN_URL': 'https://votre-domaine.com/session/{session_id}/confirmation/',  # URL de retour
    'CANCEL_URL': 'https://votre-domaine.com/session/{session_id}/annulation/',  # URL d'annulation
}

# URLs de l'API CinetPay
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

# Modes de paiement disponibles
CINETPAY_PAYMENT_METHODS = {
    'mobile_money': [
        'mtn_ci', 'orange_ci', 'moov_ci', 'wave_ci',  # Côte d'Ivoire
        'mtn_bj', 'moov_bj',  # Bénin
        'mtn_sn', 'orange_sn', 'wave_sn',  # Sénégal
        'mtn_ml', 'orange_ml', 'moov_ml',  # Mali
        'mtn_bf', 'orange_bf', 'moov_bf',  # Burkina Faso
        'mtn_ne', 'orange_ne', 'moov_ne',  # Niger
        'mtn_tg', 'moov_tg',  # Togo
        'mtn_cm', 'orange_cm', 'mtncam',  # Cameroun
    ],
    'card': ['visa', 'mastercard'],
    'bank_transfer': ['bank_transfer']
}
