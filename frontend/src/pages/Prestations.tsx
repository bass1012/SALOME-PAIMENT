import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Refresh,
  AttachMoney,
  Category,
  Description,
  Schedule,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { toast } from 'react-hot-toast';
import { LiquidButton } from '../components/LiquidButton';

interface Prestation {
  id: string;
  nom: string;
  type_prestation: string;
  prix_min: number;
  prix_max?: number;
  prix_affichage: string;
  description?: string;
  duree_estimee?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

const Prestations: React.FC = () => {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPrestation, setEditingPrestation] = useState<Prestation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actifFilter, setActifFilter] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [prestationToDelete, setPrestationToDelete] = useState<Prestation | null>(null);

  const [formData, setFormData] = useState<{
    nom: string;
    type_prestation: string;
    prix_min: string;
    prix_max: string;
    description: string;
    duree_estimee: string;
    actif: boolean;
  }>({
    nom: '',
    type_prestation: '',
    prix_min: '',
    prix_max: '',
    description: '',
    duree_estimee: '',
    actif: true,
  });

  const typePrestationOptions = [
    { value: 'massage', label: 'Massage' },
    { value: 'soin', label: 'Soin du visage' },
    { value: 'manucure', label: 'Manucure' },
    { value: 'pedicure', label: 'Pédicure' },
    { value: 'epilation', label: 'Épilation' },
    { value: 'autre', label: 'Autre' },
  ];

  const actifOptions = [
    { value: '', label: 'Tous' },
    { value: 'true', label: 'Actifs' },
    { value: 'false', label: 'Inactifs' },
  ];

  const loadPrestations = useCallback(async () => {
    try {
      setLoading(true);
      // Récupérer les prestations depuis l'API
      const response = await api.get('/prestations/');
      const prestationsData = response.data.results || [];
      
      console.log('Données brutes reçues de l\'API:', prestationsData);
      
      // Transformer les données pour correspondre à l'interface Prestation
      const formattedPrestations: Prestation[] = prestationsData.map((prestation: any) => {
        console.log('Prestation brute:', prestation);
        const formatted = {
          id: prestation.id,
          nom: prestation.nom || '',
          type_prestation: prestation.type_prestation || '',
          prix_min: prestation.prix_min || 0,
          prix_max: prestation.prix_max || null,
          prix_affichage: prestation.prix_affichage || '',
          description: prestation.description || '',
          duree_estimee: prestation.duree_estimee || '',
          actif: prestation.actif !== false, // Par défaut à true si non défini
          created_at: prestation.created_at || new Date().toISOString(),
          updated_at: prestation.updated_at || new Date().toISOString(),
        };
        console.log('Prestation formatée:', formatted);
        return formatted;
      });
      
      setPrestations(formattedPrestations);
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
      toast.error('Erreur lors du chargement des prestations');
      setPrestations([]); // S'assurer que prestations est toujours un tableau en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrestations();
  }, [loadPrestations]);

  const handleOpenDialog = (prestation?: Prestation) => {
    if (prestation) {
      setEditingPrestation(prestation);
      setFormData({
        nom: prestation.nom,
        type_prestation: prestation.type_prestation,
        prix_min: prestation.prix_min.toString(),
        prix_max: prestation.prix_max ? prestation.prix_max.toString() : '',
        description: prestation.description || '',
        duree_estimee: prestation.duree_estimee || '',
        actif: prestation.actif,
      });
    } else {
      setEditingPrestation(null);
      setFormData({
        nom: '',
        type_prestation: '',
        prix_min: '',
        prix_max: '',
        description: '',
        duree_estimee: '',
        actif: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPrestation(null);
  };

  const handleSubmit = async () => {
    try {
      // Convertir les données pour le backend
      const payload = {
        ...formData,
        prix_min: formData.prix_min ? parseFloat(formData.prix_min) : 0,
        prix_max: formData.prix_max ? parseFloat(formData.prix_max) : null,
      };
      
      console.log('Données à sauvegarder:', payload);
      console.log('Mode édition:', !!editingPrestation);
      
      if (editingPrestation) {
        console.log('URL de modification:', `/prestations/${editingPrestation.id}/`);
        const response = await api.put(`/prestations/${editingPrestation.id}/`, payload);
        console.log('Réponse de modification:', response.data);
        toast.success('Prestation mise à jour avec succès');
      } else {
        console.log('URL de création:', '/prestations/');
        const response = await api.post('/prestations/', payload);
        console.log('Réponse de création:', response.data);
        toast.success('Prestation créée avec succès');
      }
      loadPrestations();
      handleCloseDialog();
    } catch (error: any) {
      console.error('=== ERREUR DÉTAILLÉE ===');
      console.error('Message:', error.message);
      console.error('Statut:', error.response?.status);
      console.error('Données d\'erreur:', error.response?.data);
      console.error('Headers:', error.response?.headers);
      console.error('Config de la requête:', error.config);
      console.error('URL complète:', error.config?.baseURL + error.config?.url);
      console.error('Méthode:', error.config?.method);
      console.error('Données envoyées:', error.config?.data);
      
      // Afficher un message d'erreur plus spécifique si possible
      if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        toast.error(`Erreur: ${errorMessage}`);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    }
  };

  const handleDelete = (prestation: Prestation) => {
    setPrestationToDelete(prestation);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!prestationToDelete) return;
    
    try {
      console.log('Tentative de suppression de la prestation ID:', prestationToDelete.id);
      console.log('URL de suppression:', `/prestations/${prestationToDelete.id}/`);
      await api.delete(`/prestations/${prestationToDelete.id}/`);
      toast.success('Prestation supprimée avec succès');
      loadPrestations();
      setOpenDeleteDialog(false);
      setPrestationToDelete(null);
    } catch (error: any) {
      console.error('=== ERREUR DE SUPPRESSION DÉTAILLÉE ===');
      console.error('ID de la prestation:', prestationToDelete.id);
      console.error('Message:', error.message);
      console.error('Statut:', error.response?.status);
      console.error('Données d\'erreur:', error.response?.data);
      console.error('Headers:', error.response?.headers);
      console.error('Config de la requête:', error.config);
      console.error('URL complète:', error.config?.baseURL + error.config?.url);
      console.error('Méthode:', error.config?.method);
      
      // Afficher un message d'erreur plus spécifique si possible
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Cas spécial : prestation liée à d'autres données
        if (errorData.error && errorData.error.includes('liée à d\'autres données')) {
          const relatedObjects = errorData.related_objects || [];
          const relatedText = relatedObjects.join(', ');
          
          // Afficher un toast avec le bouton pour désactiver
          toast.error(
            <div>
              <div style={{ marginBottom: '8px' }}>
                {errorData.error}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Données liées : {relatedText}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                💡 Conseil : Utilisez le bouton interrupteur pour désactiver cette prestation à la place.
              </div>
            </div>,
            { duration: 8000 }
          );
        } else {
          const errorMessage = typeof errorData === 'string' 
            ? errorData 
            : JSON.stringify(errorData);
          toast.error(`Erreur de suppression: ${errorMessage}`);
        }
      } else if (error.response?.status === 404) {
        toast.error('Prestation non trouvée');
      } else if (error.response?.status === 403) {
        toast.error('Permission refusée pour supprimer cette prestation');
      } else {
        toast.error('Erreur lors de la suppression');
      }
      setOpenDeleteDialog(false);
      setPrestationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setPrestationToDelete(null);
  };

  const handleToggleActif = async (prestation: Prestation) => {
    try {
      await api.put(`/prestations/${prestation.id}/`, {
        ...prestation,
        actif: !prestation.actif,
      });
      toast.success(`Prestation ${!prestation.actif ? 'activée' : 'désactivée'} avec succès`);
      loadPrestations();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const filteredPrestations = Array.isArray(prestations) ? prestations.filter((prestation) => {
    const matchesSearch = prestation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prestation.type_prestation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || prestation.type_prestation === typeFilter;
    const matchesActif = !actifFilter || prestation.actif.toString() === actifFilter;
    return matchesSearch && matchesType && matchesActif;
  }) : [];

  const prestationsActives = Array.isArray(prestations) ? prestations.filter(p => p.actif).length : 0;

  const columns: GridColDef[] = [
    {
      field: 'nom',
      headerName: 'Prestation',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          py: 0.5,
          height: '100%'
        }}>
          <Avatar sx={{ 
            width: 28, 
            height: 28, 
            background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
            color: '#0D0D0D',
            flexShrink: 0
          }}>
            <Category fontSize="small" />
          </Avatar>
          <Typography variant="body2" sx={{ 
            fontWeight: 500,
            lineHeight: 1.4,
            color: '#1a1a1a'
          }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type_prestation',
      headerName: 'Type',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          py: 0.5
        }}>
          <Chip
            label={params.value}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              color: '#0D0D0D',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'prix_affichage',
      headerName: 'Prix',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          py: 0.5
        }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 600, 
            color: '#EAE0BD',
            fontSize: '0.875rem',
            lineHeight: 1.4
          }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'duree_estimee',
      headerName: 'Durée',
      width: 80,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          py: 0.5
        }}>
          <Typography variant="body2" color="text.secondary" sx={{
            fontSize: '0.875rem',
            lineHeight: 1.4
          }}>
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actif',
      headerName: 'Statut',
      width: 90,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          height: '100%',
          py: 0.5
        }}>
          <Chip
            label={params.value ? 'Actif' : 'Inactif'}
            size="small"
            sx={{
              background: params.value 
                ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
            }}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          alignItems: 'center',
          height: '100%',
          py: 0.5
        }}>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            sx={{
              width: 28,
              height: 28,
              background: 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 100%)',
              color: '#0D0D0D',
              '&:hover': {
                background: 'linear-gradient(135deg, #EAE0BD 0%, #E5D6B5 100%)',
                transform: 'translateY(-1px)'
              },
            }}
          >
            <Edit fontSize="small" sx={{ fontSize: '0.875rem' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleToggleActif(params.row)}
            sx={{
              width: 28,
              height: 28,
              background: params.row.actif
                ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: '#FFFFFF',
              '&:hover': {
                background: params.row.actif
                  ? 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)'
                  : 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
              },
            }}
          >
            {params.row.actif ? 
              <ToggleOff fontSize="small" sx={{ fontSize: '0.875rem' }} /> : 
              <ToggleOn fontSize="small" sx={{ fontSize: '0.875rem' }} />
            }
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            sx={{
              width: 28,
              height: 28,
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: '#FFFFFF',
              '&:hover': {
                background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)',
              },
            }}
          >
            <Delete fontSize="small" sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* En-tête */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
          border: '1px solid rgba(234, 224, 189, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1
              }}
            >
              Prestations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez vos prestations et services
            </Typography>
          </Box>
          <LiquidButton
            variant="gold"
            onClick={() => handleOpenDialog()}
            startIcon={<Add />}
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 100%)',
              },
            }}
          >
            Nouvelle Prestation
          </LiquidButton>
        </Box>

        {/* Cartes de statistiques */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Card 
            sx={{ 
              flex: '1 1 300px', 
              minWidth: '250px',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              },
              backgroundColor: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {prestationsActives}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prestations actives
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  width: 48, 
                  height: 48, 
                  background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
                  color: '#0D0D0D'
                }}>
                  <ToggleOn />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Paper>

      {/* Filtres */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
          border: '1px solid rgba(234, 224, 189, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher une prestation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: '1 1 300px', minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#EAE0BD' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
            >
              <MenuItem value="">Tous</MenuItem>
              {typePrestationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={actifFilter}
              onChange={(e) => setActifFilter(e.target.value)}
              label="Statut"
            >
              {actifOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            onClick={loadPrestations}
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              color: '#0D0D0D',
              '&:hover': {
                background: 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 100%)',
              },
            }}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Tableau */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
          border: '1px solid rgba(234, 224, 189, 0.2)',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={filteredPrestations}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          loading={loading}
          rowHeight={56}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 50%, #EFE6CF 100%)',
              color: '#0D0D0D',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderBottom: '1px solid rgba(234, 224, 189, 0.3)',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(234, 224, 189, 0.1)',
              padding: '0 8px',
              alignItems: 'center',
            },
            '& .MuiDataGrid-row:hover': {
              background: 'rgba(234, 224, 189, 0.08)',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-cellContent': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>

      {/* Dialogue d'ajout/modification */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(234, 224, 189, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
          color: '#0D0D0D',
          fontWeight: 600,
        }}>
          {editingPrestation ? 'Modifier la prestation' : 'Nouvelle prestation'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nom de la prestation"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Type de prestation</InputLabel>
              <Select
                value={formData.type_prestation}
                onChange={(e) => setFormData({ ...formData, type_prestation: e.target.value })}
                label="Type de prestation"
              >
                {typePrestationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Prix minimum"
              value={formData.prix_min}
              onChange={(e) => setFormData({ ...formData, prix_min: e.target.value })}
              fullWidth
              required
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: '#EAE0BD' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Prix maximum (optionnel)"
              value={formData.prix_max}
              onChange={(e) => setFormData({ ...formData, prix_max: e.target.value })}
              fullWidth
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: '#EAE0BD' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Durée estimée"
              value={formData.duree_estimee}
              onChange={(e) => setFormData({ ...formData, duree_estimee: e.target.value })}
              fullWidth
              placeholder="ex: 30 min, 1h, 2h"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Schedule sx={{ color: '#EAE0BD' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description sx={{ color: '#EAE0BD' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={formData.actif.toString()}
                onChange={(e) => setFormData({ ...formData, actif: e.target.value === 'true' })}
                label="Statut"
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
              color: '#666666',
              '&:hover': {
                background: 'rgba(234, 224, 189, 0.1)',
              },
            }}
          >
            Annuler
          </Button>
          <LiquidButton
            variant="gold"
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #EEE5CE 0%, #EAE0BD 100%)',
              },
            }}
          >
            {editingPrestation ? 'Modifier' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer la prestation :
            </Typography>
            
            {prestationToDelete && (
              <Box sx={{
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                border: '1px solid rgba(255, 68, 68, 0.2)',
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#cc0000', mb: 1 }}>
                  {prestationToDelete.nom}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {prestationToDelete.type_prestation}
                  {prestationToDelete.prix_min && prestationToDelete.prix_max && (
                    <span> • {prestationToDelete.prix_min}€ - {prestationToDelete.prix_max}€</span>
                  )}
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
              ⚠️ Cette action supprimera définitivement la prestation et toutes ses données associées.
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

export default Prestations;
