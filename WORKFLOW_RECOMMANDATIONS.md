# Workflow Recommandé pour Salon de Coiffure

## Niveau 1: Scan de QR Code
- Créer une page publique `/scan` pour scanner les QR codes
- Le QR code doit contenir une URL unique: `https://votre-domaine.com/scan/{uuid}`
- Au scan, rediriger vers l'étape d'identification

## Niveau 2: Identification Client
- URL: `/scan/{uuid}/identification`
- Vérifier si le client existe par téléphone
- Si nouveau client: formulaire d'inscription
- Si client existant: afficher ses informations et confirmer
- Stocker le client_id en session

## Niveau 3: Choix de Prestation
- URL: `/scan/{uuid}/prestations`
- Afficher les prestations disponibles avec prix
- Permettre la sélection d'une prestation
- Pour les prestations avec fourchette de prix, demander le montant exact
- Stocker la prestation sélectionnée en session

## Niveau 4: Paiement
- URL: `/scan/{uuid}/paiement`
- Afficher le récapitulatif (client + prestation + montant)
- Proposer les moyens de paiement disponibles
- Rediriger vers la page de paiement du fournisseur (CinetPay)
- Gérer les webhooks de notification

## Niveau 5: Récapitulatif
- URL: `/scan/{uuid}/recapitulatif`
- Afficher le récapitulatif complet
- Message de remerciement personnalisé
- Option d'envoi par email/SMS
- Générer un reçu PDF

## Traçabilité
- Créer une table `SessionPaiement` pour suivre le flux
- Logger chaque étape du processus
- Stocker les métadonnées de navigation
- Suivre les abandons et les erreurs
