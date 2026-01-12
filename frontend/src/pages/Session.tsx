import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
} from '@mui/material';
import { RateReview } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface ClientData {
  id: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  telephone: string;
  email?: string;
  date_anniversaire?: string;
  lieu_habitation?: string;
}

interface SessionPrestation {
  id: string;
  nom: string;
  type_prestation: string;
  prix_min?: number | null;
  prix_max?: number | null;
}

interface SessionData {
  session_id: string;
  statut: string;
  client?: ClientData | null;
  prestation?: SessionPrestation | null;
  montant_final?: number | null;
}

interface PrestationListItem {
  id: string;
  nom: string;
  type_prestation: string;
  prix_affichage: string;
  duree_estimee?: number | null;
  actif: boolean;
}

type MoyenPaiement = 'mobile_money' | 'carte_bancaire' | 'carte_prepayee' | 'espece' | '';
type OperateurMobile = 'wave' | 'orange' | 'mtn' | 'moov' | '';

const Session: React.FC = () => {
  const { session_id } = useParams<{ session_id: string }>();

  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Formulaire d'identification / inscription
  const [telephone, setTelephone] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F' | ''>('');
  const [email, setEmail] = useState('');
  const [dateAnniversaire, setDateAnniversaire] = useState('');
  const [lieuHabitation, setLieuHabitation] = useState('');

  // Sélection de prestation
  const [prestations, setPrestations] = useState<PrestationListItem[]>([]);
  const [loadingPrestations, setLoadingPrestations] = useState<boolean>(false);
  const [selectedPrestationId, setSelectedPrestationId] = useState<string>('');
  const [selecting, setSelecting] = useState<boolean>(false);
  const [prestationValidee, setPrestationValidee] = useState<boolean>(false);
  const prestationSectionRef = useRef<HTMLDivElement | null>(null);

  // Paiement
  const [moyenPaiement, setMoyenPaiement] = useState<MoyenPaiement>('');
  const [operateurMobile, setOperateurMobile] = useState<OperateurMobile>('');
  const [initiatingPayment, setInitiatingPayment] = useState<boolean>(false);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);

  // Récapitulatif final
  const [recap, setRecap] = useState<any>(null);
  const recapSectionRef = useRef<HTMLDivElement | null>(null);

  // États pour la notation et les commentaires
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Popup d'au revoir
  const [showAuRevoirDialog, setShowAuRevoirDialog] = useState<boolean>(false);

  useEffect(() => {
    if (!session_id) {
      console.error('[SESSION] Session ID manquant dans les paramètres URL');
      const errorMsg = "Identifiant de session manquant dans l'URL";
      setSessionError(errorMsg);
      toast.error(errorMsg);
      setLoadingSession(false);
      return;
    }

    console.log('[SESSION] Chargement de la session avec ID:', session_id);

    const initSession = async () => {
      setLoadingSession(true);
      try {
        // D'abord essayer de récupérer la session existante
        console.log('[SESSION] Tentative de récup��ration de la session existante...');
        const resGet = await api.get(`/sessions-paiement/${session_id}/`);
        console.log('[SESSION] Session existante trouvée:', resGet.data);
        setSession(resGet.data);
        toast.success('Session chargée avec succès');
      } catch (err: any) {
        console.log('[SESSION] Session non trouvée, erreur:', err.response?.status, err.response?.data);
        
        // Si la session n'existe pas (404), essayer de la créer
        if (err.response?.status === 404) {
          try {
            console.log("[SESSION] Tentative de création d'une nouvelle session...");
            const res = await api.post('/sessions-paiement/demarrer_session/', {
              session_id,
            });
            console.log('[SESSION] Nouvelle session créée:', res.data);
            setSession(res.data);
            toast.success('Session démarrée');
          } catch (e: any) {
            console.error('[SESSION] Erreur lors de la création de la session:', e);
            console.error('[SESSION] Détails erreur:', e.response?.data);
            
            // Gérer les erreurs spécifiques lors de la création
            if (e.response?.status === 400) {
              const errorMsg = 'Données invalides pour la création de session: ' + (e.response?.data?.detail || 'erreur inconnue');
              console.error('[SESSION] Erreur 400 création session:', errorMsg);
              setSessionError(errorMsg);
              toast.error(errorMsg);
            } else if (e.response?.status === 409) {
              const errorMsg = "Conflit: la session existe déjà ou est en cours d'utilisation.";
              console.error('[SESSION] Erreur 409 création session:', errorMsg);
              setSessionError(errorMsg);
              toast.error(errorMsg);
            } else {
              const errorMsg = "Impossible d'initialiser la session: " + (e.response?.data?.detail || e.message);
              console.error('[SESSION] Autre erreur création session:', errorMsg);
              setSessionError(errorMsg);
              toast.error(errorMsg);
            }
          }
        } else {
          console.error('[SESSION] Erreur inattendue lors du chargement de la session:', err);
          console.error('[SESSION] Status:', err.response?.status);
          console.error('[SESSION] Data:', err.response?.data);
          
          // Gérer les erreurs réseau et autres erreurs
          if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
            const errorMsg = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion.';
            console.error('[SESSION] Erreur réseau:', errorMsg);
            setSessionError(errorMsg);
            toast.error(errorMsg);
          } else if (err.response?.status === 500) {
            const errorMsg = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
            console.error('[SESSION] Erreur serveur 500:', errorMsg);
            setSessionError(errorMsg);
            toast.error(errorMsg);
          } else {
            const errorMsg = 'Erreur lors du chargement de la session: ' + (err.response?.data?.detail || err.message);
            console.error('[SESSION] Autre erreur:', errorMsg);
            setSessionError(errorMsg);
            toast.error(errorMsg);
          }
        }
      } finally {
        setLoadingSession(false);
      }
    };

    initSession();
  }, [session_id]);

  useEffect(() => {
    // Préremplir le formulaire si un client existe déjà sur la session
    console.log('[SESSION] Session mise à jour, vérification du client:', session);
    if (session?.client) {
      console.log('[SESSION] Client trouvé dans la session, préremplissage du formulaire:', session.client);
      setTelephone(session.client.telephone || '');
      setNom(session.client.nom || '');
      setPrenom(session.client.prenom || '');
      setSexe(session.client.sexe || '');
      setEmail(session.client.email || '');
      setDateAnniversaire(session.client.date_anniversaire || '');
      setLieuHabitation(session.client.lieu_habitation || '');

      // Charger les prestations et faire défiler vers la section
      loadPrestations();

      // Si une prestation est déjà liée (rechargement), initialiser l'état
      if (session.prestation?.id) {
        setSelectedPrestationId(session.prestation.id);
        setPrestationValidee(true);
      } else {
        setPrestationValidee(false);
      }
    } else {
      console.log('[SESSION] Aucun client trouvé dans la session');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    // Si le statut devient paiement_reussi (ex: espèce), charger le récap
    if (session?.statut === 'paiement_reussi' && session_id) {
      fetchRecapitulatif();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.statut, session_id]);

  const fetchRecapitulatif = async () => {
    if (!session_id) return;
    try {
      const recapRes = await api.get(`/sessions-paiement/${session_id}/recapitulatif/`);
      setRecap(recapRes.data);
      console.log('[SESSION] Récapitulatif chargé:', recapRes.data);
      if (recapRes.data?.message_remerciement) {
        toast.success(recapRes.data.message_remerciement);
      }
      setTimeout(() => {
        if (recapSectionRef.current) {
          recapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[SESSION] Défilement vers la section récapitulatif exécuté');
        }
      }, 200);
    } catch (e: any) {
      console.error('[SESSION] Erreur lors du chargement du récapitulatif:', e.response?.data || e.message);
    }
  };

  const loadPrestations = async () => {
    console.log('[SESSION] Chargement des prestations actives...');
    setLoadingPrestations(true);
    try {
      const res = await api.get('/prestations/?actif=true');
      console.log('[SESSION] Prestations reçues (brut):', res.data);
      const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      if (!Array.isArray(arr)) {
        console.error("[SESSION] Format inattendu des prestations, utilisation d'un tableau vide.", res.data);
      }
      setPrestations(Array.isArray(arr) ? arr : []);
      if (!selectedPrestationId && Array.isArray(arr) && arr.length > 0) {
        setSelectedPrestationId(arr[0].id);
      }
      // Rediriger l'utilisateur visuellement vers la section prestation
      setTimeout(() => {
        if (prestationSectionRef.current) {
          prestationSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[SESSION] Défilement vers la section prestation exécuté');
        }
      }, 200);
    } catch (err: any) {
      console.error('[SESSION] Erreur chargement prestations:', err.response?.data || err.message);
      toast.error('Erreur lors du chargement des prestations');
    } finally {
      setLoadingPrestations(false);
    }
  };

  const handleIdentify = async () => {
    if (!session_id) {
      console.error("[SESSION] Session ID manquant lors de l'identification");
      return;
    }

    console.log('[SESSION] Début identification client');
    console.log('[SESSION] Téléphone:', telephone);
    console.log('[SESSION] Données client:', { nom, prenom, sexe });

    if (!telephone) {
      toast.error('Le téléphone est requis');
      return;
    }
    if (!nom || !prenom || !sexe) {
      toast.error('Nom, prénom et sexe sont requis pour un nouvel enregistrement');
      // On autorise le cas client existant (par téléphone) uniquement si nom/prenom/sexe vides
      // Le backend créera s'il n'existe pas.
    }

    const payload: any = {
      telephone,
      client: {
        nom: nom || undefined,
        prenom: prenom || undefined,
        sexe: sexe || undefined,
        email: email || undefined,
        date_anniversaire: dateAnniversaire || undefined,
        lieu_habitation: lieuHabitation || undefined,
      },
    };

    console.log('[SESSION] Payload envoyé:', payload);

    setSubmitting(true);
    try {
      const res = await api.post(`/sessions-paiement/${session_id}/identifier_client/`, payload);
      console.log('[SESSION] Réponse identification:', res.data);
      setSession(res.data);
      toast.success('Identification réussie');

      // Charger les prestations et diriger vers la section
      await loadPrestations();
      // Focus/scroll sera géré dans loadPrestations
    } catch (err: any) {
      console.error('[SESSION] Erreur identification:', err);
      console.error('[SESSION] Status erreur:', err.response?.status);
      console.error('[SESSION] Data erreur:', err.response?.data);
      
      let message = "Erreur lors de l'identification";
      if (err.response?.status === 400) {
        message = 'Données invalides: ' + (err.response?.data?.error || err.response?.data?.detail || 'champs manquants');
      } else if (err.response?.status === 404) {
        message = 'Session non trouvée, veuillez recommencer';
      } else if (err.response?.status === 409) {
        message = 'Conflit: client déjà identifié ou session en cours';
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.detail) {
        message = err.response.data.detail;
      }
      
      console.error('[SESSION] Message erreur final:', message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPrestation = async () => {
    if (!session_id) return;
    if (!selectedPrestationId) {
      toast.error('Veuillez sélectionner une prestation');
      return;
    }

    console.log('[SESSION] Sélection de la prestation:', selectedPrestationId);
    setSelecting(true);
    try {
      const res = await api.post(`/sessions-paiement/${session_id}/selectionner_prestation/`, {
        prestation_id: selectedPrestationId,
        // Pas de montant_final: le backend utilisera prix_min par défaut
      });
      console.log('[SESSION] Prestation sélectionnée, session mise à jour:', res.data);
      setSession(res.data);
      setPrestationValidee(true);
      toast.success('Prestation sélectionnée');

      // Rafraîchir la session pour garantir la présence de prestation et du montant_final
      try {
        const refreshed = await api.get(`/sessions-paiement/${session_id}/`);
        setSession(refreshed.data);
        console.log('[SESSION] Session rafraîchie après sélection prestation:', refreshed.data);
      } catch (e) {
        console.warn('[SESSION] Impossible de rafraîchir la session après sélection prestation:', e);
      }

      // Initialiser le moyen de paiement par défaut et défiler vers la section Paiement
      setMoyenPaiement('mobile_money');
      setOperateurMobile('');
      setTimeout(() => {
        if (paymentSectionRef.current) {
          paymentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('[SESSION] Défilement vers la section paiement exécuté');
        }
      }, 200);
    } catch (err: any) {
      console.error('[SESSION] Erreur sélection prestation:', err.response?.data || err.message);
      const message = err.response?.data?.error || 'Erreur lors de la sélection de la prestation';
      toast.error(message);
    } finally {
      setSelecting(false);
    }
  };

  const handleInitierPaiement = async () => {
    if (!session_id) return;
    if (!moyenPaiement) {
      toast.error('Veuillez sélectionner un moyen de paiement');
      return;
    }
    if (moyenPaiement === 'mobile_money' && !operateurMobile) {
      toast.error("Veuillez sélectionner l'opérateur Mobile Money");
      return;
    }

    console.log('[SESSION] Initier paiement - moyen:', moyenPaiement, 'opérateur:', operateurMobile);
    setInitiatingPayment(true);
    try {
      const payload: any = { moyen_paiement: moyenPaiement };
      if (moyenPaiement === 'mobile_money') {
        payload.operateur_mobile = operateurMobile;
      }
      const res = await api.post(`/sessions-paiement/${session_id}/initier_paiement/`, payload);
      console.log('[SESSION] Paiement initié - réponse:', res.data);
      toast.success('Paiement initié');

      // Redirection vers l'URL de paiement si disponible (mobile money)
      if (res.data?.paiement_url) {
        console.log('[SESSION] Redirection vers URL de paiement:', res.data.paiement_url);
        window.location.href = res.data.paiement_url;
        return;
      }

      // Sinon (ex: espèce, carte), charger le récapitulatif directement
      await fetchRecapitulatif();
    } catch (err: any) {
      console.error('[SESSION] Erreur lors de l\'initiation du paiement:', err.response?.data || err.message);
      const message = err.response?.data?.error || 'Erreur lors de l\'initiation du paiement';
      toast.error(message);
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Handlers pour le feedback
  const handleOpenFeedbackDialog = () => {
    setOpenFeedbackDialog(true);
    setRating(0);
    setComment('');
  };

  const handleCloseFeedbackDialog = () => {
    setOpenFeedbackDialog(false);
    setRating(0);
    setComment('');
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    setSubmittingFeedback(true);
    try {
      // Préparer les données du feedback
      const feedbackData = {
        client_telephone: session?.client?.telephone || telephone,
        rating: rating,
        comment: comment.trim() || null,
        client_nom: session?.client?.nom || nom,
        client_prenom: session?.client?.prenom || prenom,
      };

      console.log('[SESSION] Envoi du feedback:', feedbackData);
      
      // Appel API pour sauvegarder le feedback
      const response = await api.post('/client-feedback/', feedbackData);
      console.log('[SESSION] Feedback sauvegardé:', response.data);
      
      toast.success('Merci pour votre avis !');
      handleCloseFeedbackDialog();
    } catch (error: any) {
      console.error('[SESSION] Erreur lors de la soumission du feedback:', error);
      
      if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data
          : JSON.stringify(error.response.data);
        toast.error(`Erreur: ${errorMessage}`);
      } else {
        toast.error('Erreur lors de la soumission de votre avis');
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loadingSession) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessionError) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {sessionError}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/'}
          sx={{ mt: 2 }}
        >
          Retour à l'accueil
        </Button>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6 }}>
        <Alert severity="error">Session introuvable ou non initialisée.</Alert>
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/'}
          sx={{ mt: 2 }}
        >
          Retour à l'accueil
        </Button>
      </Box>
    );
  }

  const paiementPret = !!session.client && (session.statut === 'prestation_selectionnee' || !!session.prestation || prestationValidee);
  const nomPrestationAffichage = session.prestation?.nom || prestations.find(p => p.id === selectedPrestationId)?.nom || '—';
  const montantAffichage = (session.montant_final ?? undefined) !== undefined ? `${session.montant_final} FCFA` : '—';

  return (
    <Box 
      sx={{ 
        maxWidth: 720, 
        mx: 'auto', 
        mt: 4,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/logo.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          opacity: 0.03,
          zIndex: -1,
          pointerEvents: 'none',
        }
      }}
    >
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Identification du Client
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Session: {session.session_id}
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 100%', minWidth: '250px' }}>
              <TextField
                label="Téléphone *"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                fullWidth
                placeholder="Ex: +2250700000000"
                disabled={!!session.client}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                fullWidth
                disabled={!!session.client}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                fullWidth
                disabled={!!session.client}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Sexe"
                value={sexe}
                onChange={(e) => setSexe(e.target.value as any)}
                fullWidth
                select
                disabled={!!session.client}
              >
                <MenuItem value="M">Masculin</MenuItem>
                <MenuItem value="F">Féminin</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Email (optionnel)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={!!session.client}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Date d'anniversaire (optionnel)"
                type="date"
                value={dateAnniversaire}
                onChange={(e) => setDateAnniversaire(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={!!session.client}
              />
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                label="Lieu d'habitation (optionnel)"
                value={lieuHabitation}
                onChange={(e) => setLieuHabitation(e.target.value)}
                fullWidth
                disabled={!!session.client}
              />
            </Box>

            {!session.client && (
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleIdentify}
                  disabled={submitting}
                  sx={{
                    background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                    color: '#1A1A1A',
                  }}
                >
                  {submitting ? 'En cours...' : 'Continuer'}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Section Sélection de Prestation */}
      <Box ref={prestationSectionRef} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Sélection de la Prestation
            </Typography>
            {!session.client ? (
              <Alert severity="info">
                Veuillez d'abord vous identifier pour accéder à la sélection des prestations.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Client: {session.client.prenom} {session.client.nom}
                </Typography>

                {loadingPrestations ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 300 }}>
                      <InputLabel id="prestation-label">Prestation</InputLabel>
                      <Select
                        labelId="prestation-label"
                        value={selectedPrestationId}
                        label="Prestation"
                        onChange={(e) => setSelectedPrestationId(e.target.value as string)}
                      >
                        {prestations.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nom} — {p.prix_affichage}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      onClick={handleSelectPrestation}
                      disabled={!selectedPrestationId || selecting}
                      sx={{
                        background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                        color: '#1A1A1A',
                        height: 40,
                      }}
                    >
                      {selecting ? 'Validation...' : 'Valider la prestation'}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Section Paiement */}
      <Box ref={paymentSectionRef} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Paiement
            </Typography>

            {!paiementPret ? (
              <Alert severity="info">Sélectionnez d'abord une prestation pour accéder au paiement.</Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Prestation: {nomPrestationAffichage} | Montant: {montantAffichage}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <FormControl sx={{ minWidth: 220 }}>
                    <InputLabel id="moyen-label">Moyen de paiement</InputLabel>
                    <Select
                      labelId="moyen-label"
                      value={moyenPaiement}
                      label="Moyen de paiement"
                      onChange={(e) => setMoyenPaiement(e.target.value as MoyenPaiement)}
                    >
                      <MenuItem value="mobile_money">Mobile Money</MenuItem>
                      <MenuItem value="carte_bancaire">Carte Bancaire</MenuItem>
                      <MenuItem value="carte_prepayee">Carte Prépayée</MenuItem>
                      <MenuItem value="espece">Espèce</MenuItem>
                    </Select>
                  </FormControl>

                  {moyenPaiement === 'mobile_money' && (
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id="operateur-label">Opérateur</InputLabel>
                      <Select
                        labelId="operateur-label"
                        value={operateurMobile}
                        label="Opérateur"
                        onChange={(e) => setOperateurMobile(e.target.value as OperateurMobile)}
                      >
                        <MenuItem value="wave">Wave</MenuItem>
                        <MenuItem value="orange">Orange Money</MenuItem>
                        <MenuItem value="mtn">MTN Mobile Money</MenuItem>
                        <MenuItem value="moov">Moov Money</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleInitierPaiement}
                    disabled={initiatingPayment || !moyenPaiement || (moyenPaiement === 'mobile_money' && !operateurMobile)}
                    sx={{
                      background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                      color: '#1A1A1A',
                      height: 40,
                    }}
                  >
                    {initiatingPayment ? 'Démarrage…' : 'Initier le paiement'}
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Section Récapitulatif */}
      <Box ref={recapSectionRef} sx={{ mt: 3 }}>
        {recap && (
          <Card>
            <CardContent>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Récapitulatif
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                {recap.message_remerciement || 'Merci ! Votre paiement a été traité.'}
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  Session: {recap.session?.session_id}
                </Typography>
                <Typography variant="body2">
                  Statut: {recap.session?.statut}
                </Typography>
                <Typography variant="body2">
                  Client: {recap.session?.client?.prenom} {recap.session?.client?.nom}
                </Typography>
                <Typography variant="body2">
                  Prestation: {recap.session?.prestation?.nom || nomPrestationAffichage}
                </Typography>
                <Typography variant="body2">
                  Montant: {recap.session?.montant_final ?? session.montant_final ?? '—'} FCFA
                </Typography>
                {recap.paiement && (
                  <>
                    <Typography variant="body2">Moyen: {recap.paiement?.moyen_paiement}</Typography>
                    <Typography variant="body2">Statut paiement: {recap.paiement?.statut}</Typography>
                  </>
                )}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => setShowAuRevoirDialog(true)}>
                  Ok
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RateReview />}
                  onClick={handleOpenFeedbackDialog}
                  sx={{
                    borderColor: '#EADFBC',
                    color: '#8B7355',
                    backgroundColor: 'rgba(234, 223, 188, 0.1)',
                    '&:hover': {
                      borderColor: '#EADFBC',
                      backgroundColor: 'rgba(234, 223, 188, 0.2)',
                    },
                    minWidth: 150,
                  }}
                >
                  Donner mon avis
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          Après identification et sélection de la prestation, initiez le paiement pour finaliser.
        </Alert>
      </Box>

      {/* Dialogue de feedback */}
      <Dialog
        open={openFeedbackDialog}
        onClose={handleCloseFeedbackDialog}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'none',
          }
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(239, 230, 206, 0.95)',
            border: '1px solid rgba(234, 223, 188, 0.5)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#8B7355', fontWeight: 'bold' }}>
          Donner votre avis
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2, color: '#8B7355' }}>
              Notez notre service et laissez un commentaire :
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2, color: '#8B7355' }}>
                Votre note :
              </Typography>
              <Rating
                value={rating}
                onChange={(event, newValue) => {
                  setRating(newValue || 0);
                }}
                size="large"
                sx={{
                  color: '#EADFBC',
                  '& .MuiRating-iconFilled': {
                    color: '#EADFBC',
                  },
                  '& .MuiRating-iconHover': {
                    color: '#EAE0BD',
                  },
                }}
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Votre commentaire (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(234, 223, 188, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#EADFBC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#EADFBC',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseFeedbackDialog}
            sx={{
              color: '#8B7355',
              borderColor: '#EADFBC',
              '&:hover': {
                backgroundColor: 'rgba(234, 223, 188, 0.1)',
              },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback || rating === 0}
            variant="contained"
            sx={{
              backgroundColor: '#EADFBC',
              color: '#8B7355',
              '&:hover': {
                backgroundColor: '#EAE0BD',
              },
              '&:disabled': {
                backgroundColor: 'rgba(234, 223, 188, 0.3)',
              },
            }}
          >
            {submittingFeedback ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Envoyer mon avis'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup d'au revoir */}
      <Dialog
        open={showAuRevoirDialog}
        onClose={() => setShowAuRevoirDialog(false)}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'none',
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
          color: '#1A1A1A',
          fontWeight: 700
        }}>
          Au Revoir !
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h6" gutterBottom>
            Merci pour votre visite !
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Votre paiement a été traité avec succès. Nous espérons vous revoir très prochainement.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {recap?.session?.client?.prenom} {recap?.session?.client?.nom}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowAuRevoirDialog(false);
              // Optionnel: rediriger vers une page d'accueil ou fermer la session
              window.location.href = '/';
            }}
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
              color: '#1A1A1A',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
              }
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Session;
