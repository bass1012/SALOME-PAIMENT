import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Container,
  Paper,
} from '@mui/material';
import { Phone, Email, Cake, LocationOn } from '@mui/icons-material';
import { toast } from 'react-hot-toast';


interface ClientData {
  nom: string;
  prenom: string;
  sexe: 'M' | 'F' | '';
  email?: string;
  date_anniversaire?: string;
  lieu_habitation?: string;
}

const AuthDirecte: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [clientExistant, setClientExistant] = useState<boolean>(false);
  const [clientData, setClientData] = useState<ClientData>({
    nom: '',
    prenom: '',
    sexe: '',
    email: '',
    date_anniversaire: '',
    lieu_habitation: '',
  });

  // Formulaire d'identification
  const [telephone, setTelephone] = useState('');

  const handleTelephoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telephone) {
      console.error('[AUTH_DIRECTE] Téléphone vide');
      toast.error('Le numéro de téléphone est requis');
      return;
    }

    console.log('[AUTH_DIRECTE] Vérification du téléphone:', telephone);

    setLoading(true);
    try {
      // Utiliser l'endpoint dédié de recherche par téléphone
      const checkResponse = await api.post('/clients/recherche_par_telephone/', { telephone });
      console.log('[AUTH_DIRECTE] Réponse vérification client (200 attendu si trouvé):', checkResponse.data);

      // Si 200, client trouvé
      setClientExistant(true);
      const client = checkResponse.data;
      setClientData({
        nom: client.nom,
        prenom: client.prenom,
        sexe: client.sexe,
        email: client.email || '',
        date_anniversaire: client.date_anniversaire || '',
        lieu_habitation: client.lieu_habitation || '',
      });
      toast.success('Client trouvé !');
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      console.error('[AUTH_DIRECTE] Erreur vérification téléphone:', err);
      console.error('[AUTH_DIRECTE] Status:', status);
      console.error('[AUTH_DIRECTE] Data:', data);

      if (status === 404) {
        // Client inexistant -> passage en mode création
        console.log('[AUTH_DIRECTE] Aucun client trouvé, mode nouveau client');
        setClientExistant(false);
        setClientData({
          nom: '',
          prenom: '',
          sexe: '',
          email: '',
          date_anniversaire: '',
          lieu_habitation: '',
        });
        toast('Nouveau client - veuillez remplir les informations');
      } else if (status === 400) {
        toast.error(data?.error || 'Numéro de téléphone invalide');
      } else {
        toast.error("Erreur lors de la vérification du numéro de téléphone");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthDirecte = async () => {
    if (!telephone) {
      console.error('[AUTH_DIRECTE] Téléphone vide lors de l\'authentification');
      toast.error('Le numéro de téléphone est requis');
      return;
    }

    if (!clientExistant && (!clientData.nom || !clientData.prenom || !clientData.sexe)) {
      console.error('[AUTH_DIRECTE] Informations client incomplètes:', clientData);
      toast.error('Veuillez remplir les informations obligatoires (nom, prénom, sexe)');
      return;
    }

    console.log('[AUTH_DIRECTE] Début authentification directe');
    console.log('[AUTH_DIRECTE] Téléphone:', telephone);
    console.log('[AUTH_DIRECTE] Client existant:', clientExistant);
    console.log('[AUTH_DIRECTE] Données client:', clientData);

    setLoading(true);
    try {
      const payload = {
        telephone,
        client: clientExistant ? {} : clientData,
      };

      console.log('[AUTH_DIRECTE] Payload envoyé:', payload);

      const response = await api.post('/sessions-paiement/authentification_directe/', payload);
      
      console.log('[AUTH_DIRECTE] Réponse API complète:', response.data);
      console.log('[AUTH_DIRECTE] Status réponse:', response.status);
      
      // Vérifier la structure de la réponse
      if (!response.data || !response.data.session) {
        console.error('[AUTH_DIRECTE] Structure de réponse invalide:', response.data);
        toast.error('Erreur: Structure de réponse invalide');
        return;
      }
      
      // Rediriger vers la page de session avec le session_id
      const sessionId = response.data.session.session_id;
      console.log('[AUTH_DIRECTE] Session ID extrait:', sessionId);
      console.log('[AUTH_DIRECTE] Type de sessionId:', typeof sessionId);
      console.log('[AUTH_DIRECTE] URL de redirection:', `/session/${sessionId}`);
      
      if (!sessionId) {
        console.error('[AUTH_DIRECTE] Session ID est vide ou undefined!');
        console.error('[AUTH_DIRECTE] Structure session:', response.data.session);
        toast.error('Erreur: Session ID non reçu');
        return;
      }
      
      console.log('[AUTH_DIRECTE] Authentification réussie, redirection immédiate');
      toast.success('Authentification réussie ! Redirection en cours...');
      
      const targetUrl = `/session/${sessionId}`;
      console.log('[AUTH_DIRECTE] Navigation vers:', targetUrl);
      try {
        navigate(targetUrl, { replace: true });
        console.log('[AUTH_DIRECTE] Navigation exécutée avec succès');
      } catch (navError) {
        console.error('[AUTH_DIRECTE] Erreur lors de la navigation, fallback location.assign:', navError);
        try {
          window.location.assign(targetUrl);
        } catch (locErr) {
          console.error('[AUTH_DIRECTE] Échec du fallback location.assign:', locErr);
          toast.error('Erreur lors de la redirection');
        }
      }
    } catch (err: any) {
      console.error('[AUTH_DIRECTE] Erreur authentification:', err);
      console.error('[AUTH_DIRECTE] Status erreur:', err.response?.status);
      console.error('[AUTH_DIRECTE] Data erreur:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || "Erreur lors de l'authentification";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientData, value: string) => {
    console.log('[AUTH_DIRECTE] Changement champ client:', field, 'valeur:', value);
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box 
            component="img" 
            src="/logo.png" 
            alt="Logo du salon" 
            sx={{ 
              mx: 'auto', 
              mb: 2, 
              width: 300, 
              height: 'auto',
              maxWidth: '100%',
              borderRadius: 2
            }} 
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Accès Client Direct
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Entrez votre numéro de téléphone pour commencer
          </Typography>
        </Box>

        {/* Étape 1: Numéro de téléphone */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone color="primary" />
              Numéro de téléphone
            </Typography>
            <Box component="form" onSubmit={handleTelephoneSubmit} sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Numéro de téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 07XXXXXXXX"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !telephone}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Vérifier'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Étape 2: Informations client (si nouveau client) */}
        {telephone && !clientExistant && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Nouveau client - Veuillez remplir vos informations
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Nom *"
                    value={clientData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    disabled={loading}
                    required
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Prénom *"
                    value={clientData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    disabled={loading}
                    required
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    select
                    label="Sexe *"
                    value={clientData.sexe}
                    onChange={(e) => handleInputChange('sexe', e.target.value)}
                    disabled={loading}
                    required
                  >
                    <MenuItem value="">Sélectionner</MenuItem>
                    <MenuItem value="M">Masculin</MenuItem>
                    <MenuItem value="F">Féminin</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Date d'anniversaire"
                    type="date"
                    value={clientData.date_anniversaire}
                    onChange={(e) => handleInputChange('date_anniversaire', e.target.value)}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <Cake sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Lieu d'habitation"
                    value={clientData.lieu_habitation}
                    onChange={(e) => handleInputChange('lieu_habitation', e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}


        {/* Bouton d'action final */}
        {telephone && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleAuthDirecte}
              disabled={loading || (!clientExistant && (!clientData.nom || !clientData.prenom || !clientData.sexe))}
              sx={{ minWidth: 200, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                `Continuer ${clientExistant ? 'en tant que ' + clientData.prenom : 'avec les nouvelles informations'}`
              )}
            </Button>
          </Box>
        )}
      </Paper>

      </Container>
  );
};

export default AuthDirecte;
