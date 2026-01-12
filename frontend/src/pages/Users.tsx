import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Paper,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Person,
  AdminPanelSettings,
  Refresh,
  People,
  Email,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { GlassDataGrid } from '../components/GlassDataGrid';
import { LiquidButton } from '../components/LiquidButton';
import { useAuth } from '../context/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'vendeur',
    password: '',
    password_confirm: '',
  });
  const { user: currentUser, token } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/utilisateurs/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.results || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        password: '',
        password_confirm: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'vendeur',
        password: '',
        password_confirm: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      const url = editingUser
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/utilisateurs/${editingUser.id}/`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/utilisateurs/`;

      const method = editingUser ? 'PUT' : 'POST';
      const payload = editingUser
        ? {
            username: formData.username,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
          }
        : {
            username: formData.username,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            password: formData.password,
            password_confirm: formData.password_confirm,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde de l\'utilisateur');
      }

      await fetchUsers();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !token) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/utilisateurs/${userToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'utilisateur');
      }

      await fetchUsers();
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const columns = [
    {
      field: 'username',
      headerName: 'Utilisateur',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: any) => {
        if (!params || !params.row) return '-';
        const initials = params.row.username?.substring(0, 2).toUpperCase() || 'U';
        const isAdmin = params.row.role === 'admin';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36,
                background: isAdmin 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {initials}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {params.row.username}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {params.row.first_name} {params.row.last_name}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: any) => {
        if (!params || !params.row || !params.row.email) return '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <Email sx={{ color: '#666', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
              {params.row.email}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'role',
      headerName: 'Rôle',
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => {
        if (!params || !params.row || !params.row.role) return '-';
        const isAdmin = params.row.role === 'admin';
        
        return (
          <Chip
            icon={isAdmin ? <AdminPanelSettings /> : <Person />}
            label={params.row.role.charAt(0).toUpperCase() + params.row.role.slice(1)}
            size="small"
            sx={{
              background: isAdmin
                ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              color: isAdmin ? '#92400e' : '#1e40af',
              fontWeight: 600,
              border: isAdmin ? '1px solid #fbbf24' : '1px solid #3b82f6',
            }}
          />
        );
      },
    },
    {
      field: 'is_active',
      headerName: 'Statut',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: any) => {
        if (!params || !params.row || params.row.is_active === undefined) return '-';
        const isActive = params.row.is_active;
        
        return (
          <Chip
            icon={isActive ? <CheckCircle /> : <Cancel />}
            label={isActive ? 'Actif' : 'Inactif'}
            size="small"
            color={isActive ? 'success' : 'default'}
            sx={{
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      renderCell: (params: any) => {
        if (!params || !params.row || !params.row.id) return null;
        
        // Empêcher la modification/suppression de son propre compte
        if (currentUser && params.row.id === currentUser.id) {
          return (
            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
              Compte actuel
            </Typography>
          );
        }
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(params.row)}
                sx={{
                  color: '#3b82f6',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row)}
                sx={{
                  color: '#ef4444',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        gap: 3
      }}>
        <LinearProgress sx={{ width: '300px' }} />
        <Typography variant="h6" color="text.secondary">
          Chargement des utilisateurs...
        </Typography>
      </Box>
    );
  }

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
              Gestion des Utilisateurs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gérer les comptes utilisateurs et leurs permissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchUsers}
              sx={{
                borderColor: '#2563eb',
                color: '#2563eb',
                '&:hover': {
                  borderColor: '#1d4ed8',
                  backgroundColor: 'rgba(37, 99, 235, 0.04)',
                }
              }}
            >
              Actualiser
            </Button>
            <LiquidButton
              onClick={() => handleOpenDialog()}
              startIcon={<AddIcon />}
              variant="gradient"
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
              Ajouter un utilisateur
            </LiquidButton>
          </Box>
        </Box>
      </Paper>

      {/* Cartes de statistiques */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
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
                    Total Utilisateurs
                  </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a'
                    }}
                  >
                    {users.length}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <People sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
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
                    Administrateurs
                  </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a'
                    }}
                  >
                    {users.filter(u => u.role === 'admin').length}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <AdminPanelSettings sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
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
                    Vendeurs
                  </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a1a'
                    }}
                  >
                    {users.filter(u => u.role === 'vendeur').length}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <Person sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2,
          backgroundColor: 'white',
          border: '1px solid #e0e0e0'
        }}
      >
        <GlassDataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nom d'utilisateur"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Prénom"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Nom"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Rôle"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="vendeur">Vendeur</MenuItem>
              </Select>
            </FormControl>
            {!editingUser && (
              <>
                <TextField
                  label="Mot de passe"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Confirmer le mot de passe"
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  fullWidth
                  required
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <LiquidButton onClick={handleSubmit} variant="gradient">
            {editingUser ? 'Modifier' : 'Ajouter'}
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
              Êtes-vous sûr de vouloir supprimer l'utilisateur :
            </Typography>
            
            {userToDelete && (
              <Box sx={{
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                border: '1px solid rgba(255, 68, 68, 0.2)',
              }}>
                <Typography variant="h6" fontWeight={600} sx={{ color: '#cc0000', mb: 1 }}>
                  {userToDelete.first_name} {userToDelete.last_name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  @{userToDelete.username}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  {userToDelete.email}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  Rôle: {userToDelete.role}
                </Typography>
              </Box>
            )}
            
            <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
              ⚠️ Cette action supprimera définitivement l'utilisateur et toutes ses données associées.
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

export default Users;
