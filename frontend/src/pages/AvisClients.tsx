import React, { useState, useEffect, useCallback } from 'react';
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
  Chip,
  Rating,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search,
  Refresh,
  Phone,
  Person,
  Visibility,
  Clear,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { LiquidButton } from '../components/LiquidButton';
import { GlassDataGrid } from '../components/GlassDataGrid';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ClientFeedback {
  id: string;
  client_telephone: string;
  client_nom: string;
  client_prenom: string;
  rating: number;
  comment?: string;
  date_creation: string;
}

interface FeedbackStats {
  total_feedbacks: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
}

const AvisClients: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | ''>('');
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<ClientFeedback | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/client-feedback/';
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (filterRating !== '') {
        params.append('max_rating', filterRating.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setFeedbacks(response.data.results || response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      toast.error('Erreur lors de la récupération des avis');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRating]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/client-feedback/statistiques/');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [fetchFeedbacks, fetchStats]);

  const handleSearch = () => {
    fetchFeedbacks();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRating('');
    setTimeout(fetchFeedbacks, 100);
  };

  const handleViewDetails = (feedback: ClientFeedback) => {
    setSelectedFeedback(feedback);
    setDetailDialogOpen(true);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return 'Excellent';
      case 4: return 'Très bon';
      case 3: return 'Bon';
      case 2: return 'Moyen';
      case 1: return 'Mauvais';
      default: return 'Inconnu';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'client_nom_complet',
      headerName: 'Client',
      width: 250,
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#EADFBC' }}>
            <Person sx={{ color: '#1A1A1A' }} />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {params.row.client_prenom} {params.row.client_nom}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <Phone sx={{ fontSize: 12, mr: 0.5 }} />
              {params.row.client_telephone}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'rating',
      headerName: 'Note',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Rating 
            value={params.row.rating} 
            readOnly 
            size="small"
            precision={0.5}
          />
          <Chip
            label={params.row.rating}
            size="small"
            color={getRatingColor(params.row.rating) as any}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      ),
    },
    {
      field: 'comment',
      headerName: 'Commentaire',
      width: 300,
      flex: 1.5,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          maxWidth: 280,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {params.row.comment || 'Aucun commentaire'}
        </Typography>
      ),
    },
    {
      field: 'date_creation',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.row.date_creation), 'dd/MM/yyyy', { locale: fr })}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleViewDetails(params.row)}
          sx={{ color: '#EADFBC' }}
        >
          <Visibility />
        </IconButton>
      ),
    },
  ];

  const filteredFeedbacks = feedbacks.map(feedback => ({
    ...feedback,
    client_nom_complet: `${feedback.client_prenom} ${feedback.client_nom}`,
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec statistiques */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1A1A1A' }}>
          Avis des Clients
        </Typography>
        
        {stats && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: '#EADFBC', border: '1px solid #EAE0BD' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.total_feedbacks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total avis
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: '#EAE0BD', border: '1px solid #EFE6CE' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.average_rating}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Note moyenne
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: '#EFE6CE', border: '1px solid #EFE6CF' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.rating_distribution[5] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    5 étoiles
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: '#EFE6CF', border: '1px solid #EEE5CE' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {stats.rating_distribution[4] || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    4 étoiles
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </Box>

      {/* Barre de recherche et filtres */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Rechercher par nom, prénom ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#EADFBC' }} />,
          }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Maximum d'étoiles</InputLabel>
          <Select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value as number | '')}
            label="Maximum d'étoiles"
          >
            <MenuItem value="">Toutes</MenuItem>
            <MenuItem value={1}>1 étoile</MenuItem>
            <MenuItem value={2}>2 étoiles et moins</MenuItem>
            <MenuItem value={3}>3 étoiles et moins</MenuItem>
            <MenuItem value={4}>4 étoiles et moins</MenuItem>
            <MenuItem value={5}>5 étoiles</MenuItem>
          </Select>
        </FormControl>
        <LiquidButton
          onClick={handleSearch}
          startIcon={<Search />}
          sx={{ minWidth: 120 }}
        >
          Rechercher
        </LiquidButton>
        <LiquidButton
          onClick={handleClearFilters}
          startIcon={<Clear />}
          sx={{ minWidth: 120 }}
        >
          Effacer
        </LiquidButton>
        <LiquidButton
          onClick={fetchFeedbacks}
          startIcon={<Refresh />}
          sx={{ minWidth: 120 }}
        >
          Actualiser
        </LiquidButton>
      </Box>

      {/* Tableau des avis */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: '#EADFBC' }} />
        </Box>
      ) : (
        <GlassDataGrid
          rows={filteredFeedbacks}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          disableRowSelectionOnClick
          sx={{ height: 600 }}
        />
      )}

      {/* Dialogue de détail */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#EADFBC', color: '#1A1A1A' }}>
          Détails de l'avis
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedFeedback && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#EADFBC' }}>
                  <Person sx={{ color: '#1A1A1A', fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedFeedback.client_prenom} {selectedFeedback.client_nom}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <Phone sx={{ fontSize: 14, mr: 0.5 }} />
                    {selectedFeedback.client_telephone}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Note :
                </Typography>
                <Rating 
                  value={selectedFeedback.rating} 
                  readOnly 
                  size="large"
                  precision={0.5}
                />
                <Chip
                  label={`${selectedFeedback.rating}/5 - ${getRatingLabel(selectedFeedback.rating)}`}
                  color={getRatingColor(selectedFeedback.rating) as any}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              {selectedFeedback.comment && (
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    Commentaire :
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    p: 2, 
                    bgcolor: '#F5F5F5', 
                    borderRadius: 1,
                    fontStyle: 'italic'
                  }}>
                    {selectedFeedback.comment}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date : {format(new Date(selectedFeedback.date_creation), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#F5F5F5' }}>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { AvisClients };
export default AvisClients;
