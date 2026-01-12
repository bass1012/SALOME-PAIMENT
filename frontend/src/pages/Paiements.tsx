import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  CheckCircle,
  Pending,
  Error,
  Payments,
  AttachMoney,
  ArrowUpward,
} from '@mui/icons-material';
import { GridColDef, DataGrid } from '@mui/x-data-grid';
import { LiquidButton } from '../components/LiquidButton';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


interface Paiement {
  id: string;
  client_nom_complet: string;
  prestation_nom: string;
  montant: number;
  moyen_paiement_affichage: string;
  statut: string;
  date_paiement: string;
}

interface PaiementFormData {
  client: string;
  prestation: string;
  montant: number;
  moyen_paiement: string;
  operateur_mobile?: string;
  numero_transaction?: string;
  reference_paiement?: string;
  notes?: string;
}

const Paiements: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [prestations, setPrestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPaiement, setEditingPaiement] = useState<Paiement | null>(null);
  const [formData, setFormData] = useState<PaiementFormData>({
    client: '',
    prestation: '',
    montant: 0,
    moyen_paiement: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMoyen, setFilterMoyen] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [paiementToDelete, setPaiementToDelete] = useState<Paiement | null>(null);

  // Options pour les formulaires
  const moyenPaiementOptions = [
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'carte_bancaire', label: 'Carte Bancaire' },
    { value: 'carte_prepayee', label: 'Carte Prépayée' },
    { value: 'espece', label: 'Espèce' },
  ];

  const operateurOptions = [
    { value: 'wave', label: 'Wave' },
    { value: 'orange', label: 'Orange Money' },
    { value: 'mtn', label: 'MTN Mobile Money' },
    { value: 'moov', label: 'Moov Money' },
  ];


  const loadClients = async () => {
    try {
      const response = await api.get('/clients/');
      setClients(response.data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast.error('Erreur lors du chargement des clients');
    }
  };

  const loadPrestations = async () => {
    try {
      const response = await api.get('/prestations/?actif=true');
      setPrestations(response.data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
      toast.error('Erreur lors du chargement des prestations');
    }
  };

  const loadPaiements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatut) params.append('statut', filterStatut);
      
      const response = await api.get(`/paiements/?${params.toString()}`);
      setPaiements(response.data.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      toast.error('Erreur lors du chargement des paiements');
      setPaiements([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatut]);

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadClients(),
        loadPrestations(),
        loadPaiements()
      ]);
    };
    loadAllData();
  }, [loadPaiements]);

  const handleOpenDialog = (paiement?: Paiement) => {
    // Pour l'instant, désactiver l'édition car l'API ne retourne pas les détails complets
    // TODO: Implémenter un endpoint détaillé pour récupérer les informations complètes du paiement
    if (paiement) {
      toast('La modification des paiements n\'est pas encore disponible', { icon: '⚠️' });
      return;
    }
    
    setEditingPaiement(null);
    setFormData({
      client: '',
      prestation: '',
      montant: 0,
      moyen_paiement: '',
      operateur_mobile: '',
      numero_transaction: '',
      reference_paiement: '',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPaiement(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.client || !formData.prestation || !formData.moyen_paiement || formData.montant <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.moyen_paiement === 'mobile_money' && !formData.operateur_mobile) {
      toast.error('Veuillez sélectionner un opérateur mobile');
      return;
    }

    try {
      if (editingPaiement) {
        // Mise à jour
        await api.patch(`/paiements/${editingPaiement.id}/`, formData);
        toast.success('Paiement mis à jour avec succès');
      } else {
        // Création
        await api.post('/paiements/', formData);
        toast.success('Paiement créé avec succès');
      }

      handleCloseDialog();
      loadPaiements(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleDelete = (paiement: Paiement) => {
    setPaiementToDelete(paiement);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!paiementToDelete) return;
    
    try {
      await api.delete(`/paiements/${paiementToDelete.id}/`);
      toast.success('Paiement supprimé avec succès');
      loadPaiements(); // Recharger la liste
      setOpenDeleteDialog(false);
      setPaiementToDelete(null);
    } catch (error: any) {
      console.error('Erreur lors de la suppression du paiement:', error);
      
      // Gérer les erreurs spécifiques du backend
      if (error.response?.status === 400) {
        // Erreur due aux contraintes de clé étrangère
        const errorMessage = error.response?.data?.error || 'Impossible de supprimer ce paiement';
        const relatedObjects = error.response?.data?.related_objects || [];
        
        let detailedMessage = errorMessage;
        if (relatedObjects.length > 0) {
          detailedMessage += `\nDonnées liées : ${relatedObjects.join(', ')}`;
        }
        detailedMessage += '\n\nVeuillez utiliser l\'annulation à la place de la suppression.';
        
        toast.error(detailedMessage, { duration: 6000 });
      } else if (error.response?.status === 404) {
        toast.error('Paiement non trouvé');
      } else if (error.response?.status === 403) {
        toast.error('Vous n\'avez pas les permissions pour supprimer ce paiement');
      } else {
        // Erreur générique
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erreur lors de la suppression du paiement';
        toast.error(errorMessage);
      }
      
      setOpenDeleteDialog(false);
      setPaiementToDelete(null);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setPaiementToDelete(null);
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'reussi':
        return <CheckCircle sx={{ color: '#4CAF50' }} />;
      case 'en_attente':
        return <Pending sx={{ color: '#FF9800' }} />;
      case 'echoue':
        return <Error sx={{ color: '#F44336' }} />;
      default:
        return <Pending sx={{ color: '#666666' }} />;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'reussi':
        return 'success';
      case 'en_attente':
        return 'warning';
      case 'echoue':
        return 'error';
      default:
        return 'default';
    }
  };


  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  // Filtrer les paiements
  const filteredPaiements = paiements.filter(paiement => {
    const matchesSearch = 
      (paiement.client_nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (paiement.prestation_nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (paiement.moyen_paiement_affichage?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (paiement.statut?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatut = !filterStatut || paiement.statut === filterStatut;
    
    // Filtrer par moyen de paiement
    const matchesMoyenPaiement = !filterMoyen || {
      'mobile_money': paiement.moyen_paiement_affichage?.toLowerCase().includes('mobile'),
      'espece': paiement.moyen_paiement_affichage?.toLowerCase().includes('espèce'),
      'carte_bancaire': paiement.moyen_paiement_affichage?.toLowerCase().includes('bancaire'),
      'carte_prepayee': paiement.moyen_paiement_affichage?.toLowerCase().includes('prépayée')
    }[filterMoyen];
    
    return matchesSearch && matchesStatut && matchesMoyenPaiement;
  });

  const columns: GridColDef[] = [
    {
      field: 'client',
      headerName: 'Client',
      width: 280,
      valueGetter: (params: any) => params?.row?.client_nom_complet || '',
      renderCell: (params) => {
        const clientNom = params?.row?.client_nom_complet;
        if (!clientNom) {
          return <Typography variant="body2">Client non disponible</Typography>;
        }
        
        // Extraire les initiales du nom complet
        const names = clientNom.split(' ');
        const initials = names.length >= 2 ? 
          names[0].charAt(0) + names[names.length - 1].charAt(0) : 
          clientNom.substring(0, 2);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', py: 1, width: '100%' }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: '#1976D2',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '14px',
                flexShrink: 0
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2
                }}
              >
                {clientNom}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'prestation',
      headerName: 'Prestation',
      width: 220,
      valueGetter: (params: any) => params?.row?.prestation_nom || '',
      renderCell: (params) => {
        const prestationNom = params?.row?.prestation_nom;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, width: '100%' }}>
            <Payments sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {prestationNom || 'Prestation non disponible'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'montant',
      headerName: 'Montant',
      width: 140,
      valueGetter: (params: any) => params?.row?.montant !== undefined ? formatMontant(params.row.montant) : '',
      renderCell: (params) => {
        if (!params || !params.row || params.row.montant === undefined) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <AttachMoney sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
              <Typography variant="body2">-</Typography>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <AttachMoney sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {formatMontant(params.row.montant)}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'moyen_paiement',
      headerName: 'Moyen',
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row || !params.row.moyen_paiement_affichage) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
              <Payments sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
              <Typography variant="body2">-</Typography>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <Payments sx={{ color: '#666666', fontSize: 16, flexShrink: 0 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {params.row.moyen_paiement_affichage}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 140,
      renderCell: (params) => {
        if (!params || !params.row || !params.row.statut) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 1 }}>
              <Chip
                label="Inconnu"
                color="default"
                size="small"
                sx={{ 
                  fontWeight: 500,
                  fontSize: '12px'
                }}
              />
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 1 }}>
            <Chip
              icon={getStatutIcon(params.row.statut)}
              label={params.row.statut === 'reussi' ? 'Réussi' :
                     params.row.statut === 'en_attente' ? 'En attente' :
                     params.row.statut === 'echoue' ? 'Échoué' :
                     params.row.statut === 'en_cours' ? 'En cours' : 'Annulé'}
              color={getStatutColor(params.row.statut) as any}
              size="small"
              sx={{ 
                fontWeight: 500,
                fontSize: '12px'
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'date_paiement',
      headerName: 'Date',
      width: 160,
      valueGetter: (params: any) => params?.row?.date_paiement ? formatDate(params.row.date_paiement) : '',
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            py: 1
          }}
        >
          {params?.row?.date_paiement ? formatDate(params.row.date_paiement) : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        if (!params || !params.row || !params.row.id) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 1 }}>
              <Typography variant="body2" color="textSecondary">-</Typography>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', py: 1 }}>
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
              onClick={() => handleDelete(params.row)}
              color="error"
              title="Supprimer"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1
              }}
            >
              Gestion des Paiements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Suivi et gestion de tous les paiements
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              }
            }}
          >
            Nouveau Paiement
          </Button>
        </Box>
      </Paper>

      {/* Cartes de statistiques */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Total Paiements
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1a1a1a',
                    mb: 2
                  }}
                >
                  {paiements.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpward sx={{ color: '#10b981', fontSize: 16 }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#10b981',
                      fontWeight: 500
                    }}
                  >
                    +8% ce mois
                  </Typography>
                </Box>
              </Box>
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  width: 48,
                  height: 48
                }}
              >
                <Payments sx={{ fontSize: 24 }} />
              </Avatar>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Chiffre d'Affaires
                </Typography>
                <Typography 
                  variant="h3" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1a1a1a',
                    mb: 2
                  }}
                >
                  {formatMontant(paiements.reduce((sum, p) => sum + (p.montant || 0), 0))}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpward sx={{ color: '#10b981', fontSize: 16 }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#10b981',
                      fontWeight: 500
                    }}
                  >
                    +15% ce mois
                  </Typography>
                </Box>
              </Box>
              <Avatar 
                sx={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  width: 48,
                  height: 48
                }}
              >
                <AttachMoney sx={{ fontSize: 24 }} />
              </Avatar>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Paiements Réussis
                </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 2
                    }}
                  >
                    {paiements.filter(p => p.statut === 'reussi').length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowUpward sx={{ color: '#10b981', fontSize: 16 }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#10b981',
                        fontWeight: 500
                      }}
                    >
                      {paiements.length > 0 ? Math.round((paiements.filter(p => p.statut === 'reussi').length / paiements.length) * 100) : 0}% de réussite
                    </Typography>
                  </Box>
                </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <CheckCircle sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontWeight: 500,
                    mb: 1,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  En Attente
                </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a',
                      mb: 2
                    }}
                  >
                    {paiements.filter(p => p.statut === 'en_attente').length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pending sx={{ color: '#f59e0b', fontSize: 16 }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#f59e0b',
                        fontWeight: 500
                      }}
                    >
                      À traiter
                    </Typography>
                  </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <Pending sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </Box>
          </Box>
        </Box>

      {/* Filtres */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 350, flex: 1 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#666666' }} />,
            }}
          />
          <FormControl size="medium" sx={{ minWidth: 180 }}>
            <InputLabel>Moyen de paiement</InputLabel>
            <Select
              value={filterMoyen}
              label="Moyen de paiement"
              onChange={(e) => setFilterMoyen(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="mobile_money">Mobile Money</MenuItem>
              <MenuItem value="espece">Espèces</MenuItem>
              <MenuItem value="carte_bancaire">Carte Bancaire</MenuItem>
              <MenuItem value="carte_prepayee">Carte Prépayée</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="medium" sx={{ minWidth: 180 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filterStatut}
              label="Statut"
              onChange={(e) => setFilterStatut(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="reussi">Réussi</MenuItem>
              <MenuItem value="en_attente">En attente</MenuItem>
              <MenuItem value="echoue">Échoué</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Tableau des paiements */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress 
              sx={{
                color: '#2563eb',
                filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))',
              }} 
            />
          </Box>
        ) : (
          <Box sx={{ height: 'calc(100vh - 400px)', minHeight: 500 }}>
            <DataGrid
              rows={filteredPaiements}
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
              sx={{
                border: '1px solid #e0e0e0',
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0',
                },
              }}
            />
          </Box>
        )}
      </Paper>

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
          background: 'linear-gradient(135deg, #FFD700 0%, #C9A227 50%, #E3F2FD 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: '1.5rem',
          pb: 2
        }}>
          {editingPaiement ? 'Modifier le paiement' : 'Nouveau paiement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Client *</InputLabel>
              <Select
                value={formData.client}
                label="Client *"
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.prenom} {client.nom} - {client.telephone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Prestation *</InputLabel>
              <Select
                value={formData.prestation}
                label="Prestation *"
                onChange={(e) => setFormData({ ...formData, prestation: e.target.value })}
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {prestations.map((prestation) => (
                  <MenuItem key={prestation.id} value={prestation.id}>
                    {prestation.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Montant (FCFA) *"
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: Number(e.target.value) })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Moyen de paiement *</InputLabel>
              <Select
                value={formData.moyen_paiement}
                label="Moyen de paiement *"
                onChange={(e) => setFormData({ ...formData, moyen_paiement: e.target.value })}
                sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {moyenPaiementOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {formData.moyen_paiement === 'mobile_money' && (
              <FormControl fullWidth>
                <InputLabel>Opérateur mobile *</InputLabel>
                <Select
                  value={formData.operateur_mobile}
                  label="Opérateur mobile *"
                  onChange={(e) => setFormData({ ...formData, operateur_mobile: e.target.value })}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {operateurOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Numéro de transaction"
              value={formData.numero_transaction}
              onChange={(e) => setFormData({ ...formData, numero_transaction: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <TextField
              label="Référence de paiement"
              value={formData.reference_paiement}
              onChange={(e) => setFormData({ ...formData, reference_paiement: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                }
              }}
            />
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
            {editingPaiement ? 'Mettre à jour' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer le paiement :
            </Typography>
            
            {paiementToDelete && (
              <Box sx={{
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                border: '1px solid rgba(255, 68, 68, 0.2)',
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#cc0000', mb: 1 }}>
                  {paiementToDelete.montant}€ - {paiementToDelete.moyen_paiement_affichage}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {paiementToDelete.client_nom_complet}
                  {paiementToDelete.prestation_nom && ` • ${paiementToDelete.prestation_nom}`}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Statut: {paiementToDelete.statut}
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
              ⚠️ Cette action supprimera définitivement le paiement et toutes ses données associées.
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
  );
};

export default Paiements;
