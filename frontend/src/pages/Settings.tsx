import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Palette,
  Backup,
  CloudUpload,
  CloudDownload,
  Block as BlockIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { settingsApi } from '../api/settings';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SettingsData {
  general: {
    nom_salon: string;
    adresse: string;
    telephone: string;
    email: string;
    devise: string;
    langue: string;
    fuseau_horaire: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    paiement_notifications: boolean;
    rappel_notifications: boolean;
  };
  securite: {
    double_authentification: boolean;
    session_timeout: number;
    password_min_length: number;
    password_history: number;
    login_attempts: number;
  };
  site: {
    site_title: string;
    site_subtitle: string;
    welcome_message: string;
    primary_color: string;
    secondary_color: string;
    theme: 'clair' | 'sombre' | 'auto';
    font_size: 'petite' | 'moyenne' | 'grande';
    contact_email: string;
    contact_phone: string;
    meta_description: string;
    logo_url?: string;
    favicon_url?: string;
  };
  sauvegarde: {
    auto_backup: boolean;
    backup_frequency: 'quotidien' | 'hebdomadaire' | 'mensuel';
    last_backup: string;
    backup_retention: number;
  };
}

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  date_creation: string;
  dernier_connexion: string;
  actif: boolean;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      nom_salon: 'Salomé paiement',
      adresse: 'Abidjan, Cocody Riviera Les Jardins',
      telephone: '+225 07 08 08 55 65',
      email: 'contact@dunamis-strategy.com',
      devise: 'XOF',
      langue: 'fr',
      fuseau_horaire: 'Africa/Abidjan',
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      paiement_notifications: true,
      rappel_notifications: true,
    },
    securite: {
      double_authentification: false,
      session_timeout: 30,
      password_min_length: 8,
      password_history: 3,
      login_attempts: 5,
    },
    site: {
      site_title: 'Salon de Paiement',
      site_subtitle: 'Système de gestion de paiements',
      welcome_message: 'Bienvenue sur votre espace de gestion',
      primary_color: '#FFD700',
      secondary_color: '#E3F2FD',
      theme: 'auto',
      font_size: 'moyenne',
      contact_email: '',
      contact_phone: '',
      meta_description: 'Système de gestion de paiements pour salon',
    },
    sauvegarde: {
      auto_backup: true,
      backup_frequency: 'quotidien',
      last_backup: '2024-01-15T10:30:00Z',
      backup_retention: 30,
    },
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Vérifier les permissions d'accès aux paramètres
  useEffect(() => {
    if (user?.role === 'vendeur') {
      toast.error('Accès refusé : Les vendeurs n\'ont pas accès aux paramètres');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Appliquer les thèmes et les styles à l'application
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      
      // Appliquer le thème (clair/sombre/auto)
      if (settings.site.theme === 'sombre') {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
      } else if (settings.site.theme === 'clair') {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
      } else {
        // Mode auto: détecter la préférence système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          body.classList.add('dark-mode');
          body.classList.remove('light-mode');
        } else {
          body.classList.add('light-mode');
          body.classList.remove('dark-mode');
        }
      }
      
      // Appliquer les couleurs personnalisées
      root.style.setProperty('--primary-color', settings.site.primary_color);
      root.style.setProperty('--secondary-color', settings.site.secondary_color);
      
      // Appliquer la taille de police
      const fontSizeMap = {
        'petite': '14px',
        'moyenne': '16px',
        'grande': '18px'
      };
      root.style.setProperty('--font-size', fontSizeMap[settings.site.font_size as keyof typeof fontSizeMap]);
      
      // Appliquer le titre du site
      document.title = settings.site.site_title;
      
      // Mettre à jour le favicon si disponible
      const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (favicon && settings.site.favicon_url) {
        favicon.href = settings.site.favicon_url;
      }
    };
    
    applyTheme();
    
    // Écouter les changements de préférence de thème système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (settings.site.theme === 'auto') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [settings.site]);

  // Charger les paramètres depuis le backend au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const siteSettings = await settingsApi.getSiteSettings();
        
        // Mettre à jour l'état avec les paramètres chargés depuis le backend
        setSettings(prev => ({
          ...prev,
          general: {
            ...prev.general,
            email: siteSettings.contact_email || prev.general.email, // Utiliser l'email de contact comme email général
            telephone: siteSettings.contact_phone || prev.general.telephone, // Utiliser le téléphone de contact comme téléphone général
          },
          site: {
            site_title: siteSettings.site_title || prev.site.site_title,
            site_subtitle: siteSettings.site_subtitle || prev.site.site_subtitle,
            welcome_message: siteSettings.welcome_message || prev.site.welcome_message,
            primary_color: siteSettings.primary_color || prev.site.primary_color,
            secondary_color: siteSettings.secondary_color || prev.site.secondary_color,
            theme: siteSettings.theme || prev.site.theme,
            font_size: siteSettings.font_size || prev.site.font_size,
            contact_email: siteSettings.contact_email || prev.site.contact_email,
            contact_phone: siteSettings.contact_phone || prev.site.contact_phone,
            meta_description: siteSettings.meta_description || prev.site.meta_description,
            logo_url: siteSettings.logo_url,
            favicon_url: siteSettings.favicon_url,
          }
        }));
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        toast.error('Erreur lors du chargement des paramètres du site');
      }
    };

    loadSettings();
  }, []);

  const deviseOptions = [
    { value: 'XOF', label: 'Franc CFA (XOF)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar US (USD)' },
  ];

  const langueOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
  ];

  const fuseauOptions = [
    { value: 'Africa/Dakar', label: 'Dakar (GMT+0)' },
    { value: 'Africa/Abidjan', label: 'Abidjan (GMT+0)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUsers: User[] = [
        {
          id: '1',
          nom: 'Admin',
          prenom: 'Super',
          email: 'admin@salonprestige.com',
          role: 'Administrateur',
          date_creation: '2024-01-01T00:00:00Z',
          dernier_connexion: '2024-01-15T10:30:00Z',
          actif: true,
        },
        {
          id: '2',
          nom: 'Diop',
          prenom: 'Marie',
          email: 'marie.diop@salonprestige.com',
          role: 'Gestionnaire',
          date_creation: '2024-01-05T09:15:00Z',
          dernier_connexion: '2024-01-14T16:45:00Z',
          actif: true,
        },
        {
          id: '3',
          nom: 'Ba',
          prenom: 'Ahmadou',
          email: 'ahmadou.ba@salonprestige.com',
          role: 'Employé',
          date_creation: '2024-01-10T14:20:00Z',
          dernier_connexion: '2024-01-13T11:20:00Z',
          actif: true,
        },
      ];
      
      setUsers(demoUsers);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Sauvegarder uniquement les paramètres du site qui existent dans le backend
      const siteSettingsToSave = {
        site_title: settings.site.site_title,
        site_subtitle: settings.site.site_subtitle,
        welcome_message: settings.site.welcome_message,
        theme: settings.site.theme,
        font_size: settings.site.font_size,
        primary_color: settings.site.primary_color,
        secondary_color: settings.site.secondary_color,
        contact_email: settings.general.email, // Utiliser l'email général comme email de contact
        contact_phone: settings.general.telephone, // Utiliser le téléphone général comme téléphone de contact
        meta_description: settings.site.meta_description,
      };
      
      await settingsApi.updateSiteSettings(siteSettingsToSave);
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      setSettings({
        general: {
          nom_salon: 'Salon de Prestige',
          adresse: 'Abidjan, Cocody',
          telephone: '+225 01 23 45 67 89',
          email: 'contact@salonprestige.com',
          devise: 'XOF',
          langue: 'fr',
          fuseau_horaire: 'Africa/Dakar',
        },
        notifications: {
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          paiement_notifications: true,
          rappel_notifications: true,
        },
        securite: {
          double_authentification: false,
          session_timeout: 30,
          password_min_length: 8,
          password_history: 3,
          login_attempts: 5,
        },
        site: {
          site_title: 'Salon de Paiement',
          site_subtitle: 'Système de gestion de paiements',
          welcome_message: 'Bienvenue sur votre espace de gestion',
          primary_color: '#FFD700',
          secondary_color: '#E3F2FD',
          theme: 'auto',
          font_size: 'moyenne',
          contact_email: '',
          contact_phone: '',
          meta_description: 'Système de gestion de paiements pour salon',
        },
        sauvegarde: {
          auto_backup: true,
          backup_frequency: 'quotidien',
          last_backup: '2024-01-15T10:30:00Z',
          backup_retention: 30,
        },
      });
      toast.success('Paramètres réinitialisés avec succès');
    }
  };

  const handleBackupNow = async () => {
    setLoading(true);
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSettings(prev => ({
        ...prev,
        sauvegarde: {
          ...prev.sauvegarde,
          last_backup: new Date().toISOString(),
        },
      }));
      toast.success('Sauvegarde effectuée avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = () => {
    if (window.confirm('Êtes-vous sûr de vouloir restaurer une sauvegarde ? Cette action remplacera toutes les données actuelles.')) {
      toast.success('Restauration initiée avec succès');
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, actif: !currentStatus }
        : user
    );
    setUsers(updatedUsers);
    toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Administrateur': 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
      'Gestionnaire': 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
      'Employé': 'linear-gradient(135deg, #98FB98 0%, #3CB371 100%)',
    };
    return colors[role] || 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)';
  };

  // Si l'utilisateur est un vendeur, afficher un message d'accès refusé
  if (user?.role === 'vendeur') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        textAlign: 'center',
        p: 3
      }}>
        <BlockIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
        <Typography variant="h4" component="h1" gutterBottom color="error.main">
          Accès Refusé
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
          Désolé, les vendeurs n'ont pas accès à la page des paramètres. 
          Veuillez contacter un administrateur si vous avez besoin de modifier des paramètres.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/dashboard')}
          sx={{
            background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
            color: '#1A1A1A',
          }}
        >
          Retour au Tableau de Bord
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Paramètres
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleResetSettings}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              color: '#1A1A1A',
            }}
          >
            {loading ? <CircularProgress size={20} /> : 'Sauvegarder'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Général" icon={<Palette />} iconPosition="start" />
          <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
          <Tab label="Sécurité" icon={<Security />} iconPosition="start" />
          <Tab label="Sauvegarde" icon={<Backup />} iconPosition="start" />
          <Tab label="Utilisateurs" icon={<Security />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    label="Nom du salon"
                    value={settings.general.nom_salon}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, nom_salon: e.target.value }
                    }))}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    label="Téléphone"
                    value={settings.general.telephone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, telephone: e.target.value }
                    }))}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    label="Adresse"
                    value={settings.general.adresse}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, adresse: e.target.value }
                    }))}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      general: { ...prev.general, email: e.target.value }
                    }))}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Devise</InputLabel>
                    <Select
                      value={settings.general.devise}
                      label="Devise"
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, devise: e.target.value }
                      }))}
                    >
                      {deviseOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Langue</InputLabel>
                    <Select
                      value={settings.general.langue}
                      label="Langue"
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, langue: e.target.value }
                      }))}
                    >
                      {langueOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <FormControl fullWidth>
                    <InputLabel>Fuseau horaire</InputLabel>
                    <Select
                      value={settings.general.fuseau_horaire}
                      label="Fuseau horaire"
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, fuseau_horaire: e.target.value }
                      }))}
                    >
                      {fuseauOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Apparence et site
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    label="Titre du site"
                    value={settings.site.site_title}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, site_title: e.target.value }
                    }))}
                    fullWidth
                    helperText="Le titre principal qui apparaît sur le site"
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    label="Sous-titre du site"
                    value={settings.site.site_subtitle}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, site_subtitle: e.target.value }
                    }))}
                    fullWidth
                    helperText="Le sous-titre qui apparaît sous le titre principal"
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    label="Message de bienvenue"
                    value={settings.site.welcome_message}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, welcome_message: e.target.value }
                    }))}
                    fullWidth
                    multiline
                    rows={3}
                    helperText="Message personnalisé pour la page d'accueil"
                  />
                </Box>
                <Box sx={{ flex: '1 1 100%' }}>
                  <TextField
                    label="Meta description"
                    value={settings.site.meta_description}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      site: { ...prev.site, meta_description: e.target.value }
                    }))}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Description pour les moteurs de recherche"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Préférences de notification
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email_notifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email_notifications: e.target.checked }
                      }))}
                    />
                  }
                  label="Notifications par email"
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sms_notifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms_notifications: e.target.checked }
                      }))}
                    />
                  }
                  label="Notifications par SMS"
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push_notifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push_notifications: e.target.checked }
                      }))}
                    />
                  }
                  label="Notifications push"
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.paiement_notifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, paiement_notifications: e.target.checked }
                      }))}
                    />
                  }
                  label="Notifications de paiement"
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.rappel_notifications}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, rappel_notifications: e.target.checked }
                      }))}
                    />
                  }
                  label="Notifications de rappel"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Paramètres de sécurité
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.securite.double_authentification}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        securite: { ...prev.securite, double_authentification: e.target.checked }
                      }))}
                    />
                  }
                  label="Double authentification"
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Durée de session (minutes)"
                  type="number"
                  value={settings.securite.session_timeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    securite: { ...prev.securite, session_timeout: Number(e.target.value) }
                  }))}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Longueur minimale du mot de passe"
                  type="number"
                  value={settings.securite.password_min_length}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    securite: { ...prev.securite, password_min_length: Number(e.target.value) }
                  }))}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Historique des mots de passe"
                  type="number"
                  value={settings.securite.password_history}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    securite: { ...prev.securite, password_history: Number(e.target.value) }
                  }))}
                  fullWidth
                  helperText="Nombre de mots de passe à retenir"
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Tentatives de connexion maximales"
                  type="number"
                  value={settings.securite.login_attempts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    securite: { ...prev.securite, login_attempts: Number(e.target.value) }
                  }))}
                  fullWidth
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sauvegarde et restauration
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sauvegarde.auto_backup}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        sauvegarde: { ...prev.sauvegarde, auto_backup: e.target.checked }
                      }))}
                    />
                  }
                  label="Sauvegarde automatique"
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <FormControl fullWidth>
                  <InputLabel>Fréquence de sauvegarde</InputLabel>
                  <Select
                    value={settings.sauvegarde.backup_frequency}
                    label="Fréquence de sauvegarde"
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sauvegarde: { ...prev.sauvegarde, backup_frequency: e.target.value as any }
                    }))}
                  >
                    <MenuItem value="quotidien">Quotidien</MenuItem>
                    <MenuItem value="hebdomadaire">Hebdomadaire</MenuItem>
                    <MenuItem value="mensuel">Mensuel</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Rétention des sauvegardes (jours)"
                  type="number"
                  value={settings.sauvegarde.backup_retention}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    sauvegarde: { ...prev.sauvegarde, backup_retention: Number(e.target.value) }
                  }))}
                  fullWidth
                />
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <Alert severity="info">
                  <AlertTitle>Dernière sauvegarde</AlertTitle>
                  {formatDate(settings.sauvegarde.last_backup)}
                </Alert>
              </Box>
              <Box sx={{ flex: '1 1 100%' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={handleBackupNow}
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                      color: '#FFFFFF',
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Sauvegarder maintenant'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={handleRestoreBackup}
                  >
                    Restaurer une sauvegarde
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestion des utilisateurs
            </Typography>
            <List>
              {users.map((user) => (
                <ListItem key={user.id} divider>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ background: getRoleColor(user.role) }}>
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {user.prenom} {user.nom}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {user.email} • {user.role}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Dernière connexion: {formatDate(user.dernier_connexion)}
                      </Typography>
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <Chip
                      label={user.actif ? 'Actif' : 'Inactif'}
                      color={user.actif ? 'success' : 'error'}
                      size="small"
                      onClick={() => handleToggleUserStatus(user.id, user.actif)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export { Settings };
export default Settings;
