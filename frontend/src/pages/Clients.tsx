import React, { useState, useEffect } from 'react';
import api from '../api/api';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  Phone,
  Email,
  Person,
  LocationOn,
  Cake,
  ToggleOn,
  ToggleOff,
  Visibility,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { LiquidButton } from '../components/LiquidButton';
import { GlassDataGrid } from '../components/GlassDataGrid';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Client {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  email?: string;
  date_anniversaire?: string;
  lieu_habitation?: string;
  date_creation: string;
  date_modification: string;
  actif: boolean;
}

interface ClientFormData {
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  email?: string;
  date_anniversaire?: string;
  lieu_habitation?: string;
  actif: boolean;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    nom: '',
    prenom: '',
    sexe: 'M',
    telephone: '',
    email: '',
    date_anniversaire: '',
    lieu_habitation: '',
    actif: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sexeFilter, setSexeFilter] = useState('');
  const [actifFilter, setActifFilter] = useState('');
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const sexeOptions = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' },
  ];

  const actifOptions = [
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' },
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      // Récupérer les clients depuis l'API
      const response = await api.get('/clients/');
      const clientsData = response.data.results || [];
      
      console.log('Données brutes reçues de l\'API:', clientsData);
      
      // Transformer les données pour correspondre à l'interface Client
      const formattedClients: Client[] = clientsData.map((client: any) => {
        console.log('Client brut:', client);
        const formatted = {
          id: client.id,
          nom: client.nom || '',
          prenom: client.prenom || '',
          sexe: client.sexe || 'M',
          telephone: client.telephone || '',
          email: client.email || '',
          date_anniversaire: client.date_anniversaire || '',
          lieu_habitation: client.lieu_habitation || '',
          date_creation: client.date_creation,
          date_modification: client.date_modification,
          actif: client.actif,
        };
        console.log('Client formaté:', formatted);
        return formatted;
      });
      
      setClients(formattedClients);
      toast.success('Clients chargés avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nom: client.nom,
        prenom: client.prenom,
        sexe: client.sexe,
        telephone: client.telephone,
        email: client.email || '',
        date_anniversaire: client.date_anniversaire || '',
        lieu_habitation: client.lieu_habitation || '',
        actif: client.actif,
      });
    } else {
      setEditingClient(null);
      setFormData({
        nom: '',
        prenom: '',
        sexe: 'M',
        telephone: '',
        email: '',
        date_anniversaire: '',
        lieu_habitation: '',
        actif: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.nom || !formData.prenom || !formData.telephone) {
        toast.error('Veuillez remplir les champs obligatoires');
        return;
      }

      // Validation du format du téléphone
      const phoneRegex = /^\+?1?\d{9,15}$/;
      if (!phoneRegex.test(formData.telephone)) {
        toast.error('Format de téléphone invalide');
        return;
      }

      if (editingClient) {
        // Mise à jour
        await api.put(`/clients/${editingClient.id}/`, {
          nom: formData.nom,
          prenom: formData.prenom,
          sexe: formData.sexe,
          telephone: formData.telephone,
          email: formData.email,
          date_anniversaire: formData.date_anniversaire,
          lieu_habitation: formData.lieu_habitation,
          actif: formData.actif,
        });
        
        // Recharger la liste des clients
        await loadClients();
        toast.success('Client mis à jour avec succès');
      } else {
        // Création
        await api.post('/clients/', {
          nom: formData.nom,
          prenom: formData.prenom,
          sexe: formData.sexe,
          telephone: formData.telephone,
          email: formData.email,
          date_anniversaire: formData.date_anniversaire,
          lieu_habitation: formData.lieu_habitation,
          actif: formData.actif,
        });
        
        // Recharger la liste des clients
        await loadClients();
        toast.success('Client créé avec succès');
      }

      handleCloseDialog();
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du client:', error);
      
      if (error.response?.status === 401) {
        toast.error('Erreur d\'authentification - veuillez vous reconnecter');
      } else if (error.response?.status === 403) {
        toast.error('Accès refusé - permissions insuffisantes');
      } else if (error.response?.status === 400) {
        toast.error('Données invalides - veuillez vérifier les champs');
      } else {
        toast.error('Erreur lors de l\'enregistrement du client');
      }
    }
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await api.delete(`/clients/${clientToDelete.id}/`);
      
      // Recharger la liste des clients
      await loadClients();
      toast.success('Client supprimé avec succès');
      setOpenDeleteDialog(false);
      setClientToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du client:', error);
      
      if (error.response?.status === 401) {
        toast.error('Erreur d\'authentification - veuillez vous reconnecter');
      } else if (error.response?.status === 403) {
        toast.error('Accès refusé - permissions insuffisantes');
      } else if (error.response?.status === 400) {
        // Erreur de contrainte (client lié à d'autres données)
        const errorData = error.response?.data;
        if (errorData?.error) {
          toast.error(errorData.error);
        } else if (errorData?.related_objects) {
          toast.error(`Impossible de supprimer ce client car il est lié à d'autres données: ${errorData.related_objects.join(', ')}. Veuillez désactiver le client à la place.`);
        } else {
          toast.error('Impossible de supprimer ce client car il est lié à d\'autres données. Veuillez désactiver le client à la place.');
        }
      } else {
        toast.error('Erreur lors de la suppression du client');
      }
      setOpenDeleteDialog(false);
      setClientToDelete(null);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setClientToDelete(null);
  };

  const handleToggleActif = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/clients/${id}/`, {
        actif: !currentStatus
      });
      
      // Recharger la liste des clients
      await loadClients();
      toast.success(`Client ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      
      if (error.response?.status === 401) {
        toast.error('Erreur d\'authentification - veuillez vous reconnecter');
      } else if (error.response?.status === 403) {
        toast.error('Accès refusé - permissions insuffisantes');
      } else {
        toast.error('Erreur lors de la mise à jour du statut');
      }
    }
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingClient(null);
  };

  const getAvatarColor = (sexe: string) => {
    return sexe === 'F' 
      ? 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)'
      : 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)';
  };

  const getInitials = (nom: string, prenom: string) => {
    const firstInitial = prenom && prenom.length > 0 ? prenom.charAt(0) : '';
    const lastInitial = nom && nom.length > 0 ? nom.charAt(0) : '';
    const initials = `${firstInitial}${lastInitial}`.trim();
    return initials || '?';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) {
      console.log('Date d\'anniversaire vide ou undefined');
      return '-';
    }
    
    try {
      console.log('Formatage de la date:', dateString);
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Date invalide:', dateString);
        return '-';
      }
      const formatted = format(date, 'dd MMM yyyy', { locale: fr });
      console.log('Date formatée:', formatted);
      return formatted;
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '-';
    }
  };

  // Filtrer les clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.nom && client.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.prenom && client.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.telephone.includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.lieu_habitation && client.lieu_habitation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSexe = !sexeFilter || client.sexe === sexeFilter;
    const matchesActif = !actifFilter || client.actif.toString() === actifFilter;
    
    return matchesSearch && matchesSexe && matchesActif;
  });

  // Transformer les données pour le DataGrid
  const gridData = filteredClients.map(client => {
    const transformed = {
      ...client,
      nom_complet: `${client.prenom || ''} ${client.nom || ''}`.trim(),
      nom: client.nom || '',
      prenom: client.prenom || '',
      sexe: client.sexe || 'M',
      telephone: client.telephone || '',
      email: client.email || '',
      date_anniversaire: client.date_anniversaire || '',
      lieu_habitation: client.lieu_habitation || '',
      actif: client.actif,
      date_creation: client.date_creation || '',
      date_modification: client.date_modification || '',
    };
    console.log('Données transformées pour DataGrid:', transformed);
    return transformed;
  });

  const columns: GridColDef[] = [
    {
      field: 'nom_complet',
      headerName: 'Client',
      width: 350,
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, px: 1, width: '100%', height: '100%' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: getAvatarColor(params.row.sexe),
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {getInitials(params.row.nom, params.row.prenom)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.4
              }}
            >
              {params.row.prenom} {params.row.nom}
            </Typography>
            <Typography 
              variant="caption" 
              color="textSecondary"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                lineHeight: 1.3
              }}
            >
              {params.row.sexe === 'F' ? 'Féminin' : params.row.sexe === 'M' ? 'Masculin' : 'Non spécifié'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1, width: '100%', height: '100%' }}>
          <Phone sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {params.row.telephone}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 320,
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1, width: '100%', height: '100%' }}>
          <Email sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {params.row.email || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'date_anniversaire',
      headerName: 'Anniversaire',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1, width: '100%', height: '100%' }}>
          <Cake sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {formatBirthDate(params.row.date_anniversaire)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'lieu_habitation',
      headerName: 'Localisation',
      width: 280,
      flex: 1.3,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 1, width: '100%', height: '100%' }}>
          <LocationOn sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {params.row.lieu_habitation || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'date_creation',
      headerName: 'Créé le',
      width: 180,
      valueGetter: (params: any) => params?.row?.date_creation ? formatDate(params.row.date_creation) : '',
      renderCell: (params) => (
        <Box sx={{ py: 1, px: 1, display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              lineHeight: 1.4
            }}
          >
            {params?.row?.date_creation ? formatDate(params.row.date_creation) : '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 280,
      sortable: false,
      renderCell: (params) => {
        if (!params || !params.row) return null;
        return (
          <Box sx={{ py: 1, px: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <IconButton
              size="small"
              onClick={() => handleViewClient(params.row)}
              color="info"
              title="Voir"
              sx={{ mr: 1 }}
            >
              <Visibility fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              color="primary"
              title="Modifier"
              sx={{ mr: 1 }}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleToggleActif(params.row.id, params.row.actif)}
              color={params.row.actif ? 'warning' : 'success'}
              title={params.row.actif ? 'Désactiver' : 'Activer'}
              sx={{ mr: 1 }}
            >
              {params.row.actif ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row)}
              color="error"
              title="Supprimer"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    },
  ];

  // Statistiques
  const totalClients = clients.length;
  const clientsActifs = clients.filter(c => c.actif).length;
  const clientsHommes = clients.filter(c => c.sexe === 'M').length;
  const clientsFemmes = clients.filter(c => c.sexe === 'F').length;

  return (
    <Box sx={{ 
      background: '#F8F9FA',
      minHeight: '100vh',
      p: 3,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
        opacity: 0.9,
        pointerEvents: 'none',
        zIndex: -1,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(227, 242, 253, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: -1,
      }
    }}>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box 
          sx={{ 
            p: 4, 
            mb: 4,
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)'
            },
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3" component="h1" sx={{ 
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
              fontWeight: 700
            }}>
              Gestion des Clients
            </Typography>
            <LiquidButton 
              liquidEffect={true}
              variant="gradient"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Nouveau Client
            </LiquidButton>
          </Box>
        </Box>

      {/* Statistiques */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 280px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              backgroundColor: 'white',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ 
                  background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600
                }} gutterBottom>
                  Total Clients
                </Typography>
                <Typography variant="h4" component="div" sx={{ 
                  background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}>
                  {totalClients}
                </Typography>
              </Box>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                boxShadow: '0 4px 16px rgba(234, 224, 189, 0.3)',
                width: 48,
                height: 48
              }}>
                <Person />
              </Avatar>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 280px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              backgroundColor: 'white',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ 
                  background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600
                }} gutterBottom>
                  Clients Actifs
                </Typography>
                <Typography variant="h4" component="div" sx={{ 
                  background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 50%, #E3F2FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}>
                  {clientsActifs}
                </Typography>
              </Box>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                width: 48,
                height: 48
              }}>
                <ToggleOn />
              </Avatar>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 280px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              backgroundColor: 'white',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ 
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600
                }} gutterBottom>
                  Hommes
                </Typography>
                <Typography variant="h4" component="div" sx={{ 
                  background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #E3F2FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}>
                  {clientsHommes}
                </Typography>
              </Box>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                boxShadow: '0 4px 16px rgba(135, 206, 235, 0.3)',
                width: 48,
                height: 48
              }}>
                <Person />
              </Avatar>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 280px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              backgroundColor: 'white',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ 
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600
                }} gutterBottom>
                  Femmes
                </Typography>
                <Typography variant="h4" component="div" sx={{ 
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 50%, #E3F2FD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}>
                  {clientsFemmes}
                </Typography>
              </Box>
              <Avatar sx={{ 
                background: 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)',
                boxShadow: '0 4px 16px rgba(255, 182, 193, 0.3)',
                width: 48,
                height: 48
              }}>
                <Person />
              </Avatar>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Filtres */}
      <Box 
        sx={{ 
          p: 3, 
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          },
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300, flex: 1 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#666666' }} />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sexe</InputLabel>
            <Select
              value={sexeFilter}
              label="Sexe"
              onChange={(e) => setSexeFilter(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              {sexeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={actifFilter}
              label="Statut"
              onChange={(e) => setActifFilter(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              {actifOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton 
            onClick={loadClients} 
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
              color: '#1A1A1A',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
              }
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Tableau des clients */}
      <Box 
        sx={{ 
          p: 0, 
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)'
          },
          backgroundColor: 'white'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress 
              sx={{
                color: '#EAE0BD',
                filter: 'drop-shadow(0 0 8px rgba(234, 224, 189, 0.4))',
              }} 
            />
          </Box>
        ) : (
          <GlassDataGrid
            rows={gridData}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            autoHeight
            glassEffect={true}
            containerProps={{
              sx: { 
                height: 'calc(100vh - 350px)', // Plus d'espace vertical
                minHeight: 600, // Hauteur minimale augmentée
                width: '100%',
                overflow: 'hidden'
              }
            }}
            sx={{
              // Configuration supplémentaire pour le DataGrid
              '& .MuiDataGrid-root': {
                minWidth: '100%',
              },
            }}
          />
        )}
      </Box>

      {/* Dialogue de création/modification */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: '1.5rem',
          pb: 2
        }}>
          {editingClient ? 'Modifier le client' : 'Nouveau client'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Nom *"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Prénom *"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                    }
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <FormControl fullWidth>
                  <InputLabel>Sexe *</InputLabel>
                  <Select
                    value={formData.sexe}
                    label="Sexe *"
                    onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                    sx={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {sexeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                <TextField
                  label="Téléphone *"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  fullWidth
                  placeholder="+221XXXXXXXXX"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(8px)',
                    }
                  }}
                />
              </Box>
            </Box>

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <TextField
              label="Date d'anniversaire"
              type="date"
              value={formData.date_anniversaire}
              onChange={(e) => setFormData({ ...formData, date_anniversaire: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <TextField
              label="Lieu d'habitation"
              value={formData.lieu_habitation}
              onChange={(e) => setFormData({ ...formData, lieu_habitation: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.actif.toString()}
                label="Statut"
                onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })}
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <MenuItem value="true">Actif</MenuItem>
                <MenuItem value="false">Inactif</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            Annuler
          </Button>
          <LiquidButton
            onClick={handleSubmit}
            variant="gradient"
            liquidEffect={true}
          >
            {editingClient ? 'Mettre à jour' : 'Créer'}
          </LiquidButton>
        </DialogActions>
      </Dialog>

      {/* Dialogue de visualisation des détails du client */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            border: '1px solid #e0e0e0',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          py: 2,
          px: 3,
          borderRadius: '8px 8px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: viewingClient ? getAvatarColor(viewingClient.sexe) : 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '18px',
              }}
            >
              {viewingClient ? getInitials(viewingClient.nom, viewingClient.prenom) : '?'}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {viewingClient ? `${viewingClient.prenom} ${viewingClient.nom}` : 'Détails du client'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Informations détaillées
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewingClient && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" fontWeight={600} sx={{ letterSpacing: '0.02em' }}>
                  Informations personnelles
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person sx={{ color: '#666666', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Nom complet</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.prenom} {viewingClient.nom}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Cake sx={{ color: '#666666', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Date d'anniversaire</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {formatBirthDate(viewingClient.date_anniversaire)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: viewingClient.sexe === 'F' 
                      ? 'linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)' 
                      : 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {viewingClient.sexe === 'F' ? 'F' : 'M'}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Sexe</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.sexe === 'F' ? 'Féminin' : viewingClient.sexe === 'M' ? 'Masculin' : 'Non spécifié'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" color="textSecondary" fontWeight={600} sx={{ letterSpacing: '0.02em' }}>
                  Coordonnées
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone sx={{ color: '#666666', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Téléphone</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.telephone}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email sx={{ color: '#666666', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Email</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.email || '-'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOn sx={{ color: '#666666', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Localisation</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.lieu_habitation || '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography variant="subtitle2" color="textSecondary" fontWeight={600} sx={{ letterSpacing: '0.02em' }}>
                  Informations système
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: viewingClient.actif ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {viewingClient.actif ? '✓' : '✗'}
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Statut</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {viewingClient.actif ? 'Actif' : 'Inactif'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    📅
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Date de création</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {formatDate(viewingClient.date_creation)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    📝
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ letterSpacing: '0.01em' }}>Dernière modification</Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ color: '#0D0D0D', letterSpacing: '0.01em' }}>
                      {formatDate(viewingClient.date_modification)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <LiquidButton
            onClick={handleCloseViewDialog}
            variant="gradient"
            liquidEffect={true}
          >
            Fermer
          </LiquidButton>
        </DialogActions>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={openDeleteDialog}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
          color: 'white',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            ⚠️
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
              Confirmation de suppression
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Cette action est irréversible
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, fontSize: '16px', lineHeight: 1.6 }}>
              Êtes-vous sûr de vouloir supprimer le client :
            </Typography>
            
            {clientToDelete && (
              <Box sx={{
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                border: '1px solid rgba(255, 68, 68, 0.2)',
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#cc0000', mb: 1 }}>
                  {clientToDelete.nom} {clientToDelete.prenom}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {clientToDelete.telephone}
                  {clientToDelete.email && ` • ${clientToDelete.email}`}
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
              ⚠️ Cette action supprimera définitivement le client et toutes ses données associées.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, pt: 0, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            onClick={cancelDelete}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              borderColor: '#ddd',
              color: '#666',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#bbb',
                background: 'rgba(0, 0, 0, 0.02)',
              }
            }}
          >
            Annuler
          </Button>
          
          <LiquidButton
            onClick={confirmDelete}
            variant="gradient"
            liquidEffect={true}
            sx={{
              background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              borderRadius: '12px',
            }}
          >
            Supprimer définitivement
          </LiquidButton>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export { Clients };
export default Clients;
