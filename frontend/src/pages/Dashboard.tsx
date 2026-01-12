import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Payments,
  People,
  Person as PersonIcon,
  Spa,
  Refresh,
  CheckCircle,
  Pending,
  Error,
  CheckCircleOutline,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalPaiements: number;
  totalClients: number;
  totalPrestations: number;
  chiffreAffaire: number;
  paiementsAujourdhui: number;
  tauxReussite: number;
  hommes: number;
  femmes: number;
  clientsActifs: number;
}

interface RecentPaiement {
  id: string;
  client: string;
  montant: number;
  statut: string;
  date: string;
  prestation: string;
}

interface Paiement {
  id: string;
  statut: string;
  montant: number;
  date_paiement: string;
  client_nom_complet: string;
  prestation_nom: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPaiements: 0,
    totalClients: 0,
    totalPrestations: 0,
    chiffreAffaire: 0,
    paiementsAujourdhui: 0,
    tauxReussite: 0,
    hommes: 0,
    femmes: 0,
    clientsActifs: 0,
  });
  const [recentPaiements, setRecentPaiements] = useState<RecentPaiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPaiementId, setLastPaiementId] = useState<string | null>(null);

  // Données de démonstration pour les graphiques
  const paiementData = [
    { name: 'Lun', montant: 4000, transactions: 12 },
    { name: 'Mar', montant: 3000, transactions: 8 },
    { name: 'Mer', montant: 2000, transactions: 6 },
    { name: 'Jeu', montant: 2780, transactions: 9 },
    { name: 'Ven', montant: 1890, transactions: 7 },
    { name: 'Sam', montant: 2390, transactions: 11 },
    { name: 'Dim', montant: 3490, transactions: 15 },
  ];

  const statutData = [
    { name: 'Réussi', value: 75, color: '#4CAF50' },
    { name: 'En attente', value: 15, color: '#FF9800' },
    { name: 'Échoué', value: 10, color: '#F44336' },
  ];

  useEffect(() => {
    loadDashboardData();
    
    // Polling pour vérifier les nouveaux paiements toutes les 10 secondes
    const interval = setInterval(() => {
      console.log('[Dashboard] Vérification des nouveaux paiements...');
      checkForNewPaiements();
    }, 10000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPaiementId]);

  const checkForNewPaiements = async () => {
    try {
      const paiementsResponse = await api.get('/paiements/');
      const paiements = paiementsResponse.data.results || [];
      
      console.log('[Dashboard] Paiements reçus:', paiements.length);
      
      if (paiements.length > 0) {
        const latestPaiement = paiements.sort((a: Paiement, b: Paiement) => 
          new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
        )[0];
        
        console.log('[Dashboard] Dernier paiement ID:', latestPaiement.id, 'Statut:', latestPaiement.statut);
        console.log('[Dashboard] Last paiement ID stocké:', lastPaiementId);
        
        // Si c'est un nouveau paiement et qu'il est réussi
        if (lastPaiementId && latestPaiement.id !== lastPaiementId && latestPaiement.statut === 'reussi') {
          console.log('[Dashboard] ✅ Nouveau paiement détecté!');
          toast.success(
            `🎉 Nouveau paiement reçu!\n${latestPaiement.client_nom_complet || 'Client'} - ${latestPaiement.montant} FCFA`,
            { duration: 5000 }
          );
          // Recharger les données du dashboard
          loadDashboardData();
        }
        
        // Mettre à jour l'ID du dernier paiement
        if (latestPaiement.id !== lastPaiementId) {
          console.log('[Dashboard] Mise à jour du dernier ID:', latestPaiement.id);
          setLastPaiementId(latestPaiement.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des nouveaux paiements:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Récupérer les statistiques réelles depuis l'API
      const [clientsResponse, prestationsResponse, paiementsResponse] = await Promise.all([
        api.get('/clients/'),
        api.get('/prestations/'),
        api.get('/paiements/')
      ]);
      
      const clients = clientsResponse.data.results || [];
      const prestations = prestationsResponse.data.results || [];
      const paiements = paiementsResponse.data.results || [];
      
      // Calculer les statistiques
      const totalClients = clients.length;
      const totalPrestations = prestations.length;
      const totalPaiements = paiements.length;
      
      // Calculer les statistiques par genre
      const hommes = clients.filter((client: any) => client.sexe === 'M').length;
      const femmes = clients.filter((client: any) => client.sexe === 'F').length;
      const clientsActifs = clients.filter((client: any) => client.actif === true).length;
      
      // Calculer le chiffre d'affaires (somme des montants des paiements réussis)
      const chiffreAffaire = paiements
        .filter((p: Paiement) => p.statut === 'reussi')
        .reduce((sum: number, p: Paiement) => sum + (p.montant || 0), 0);
      
      // Calculer les paiements d'aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const paiementsAujourdhui = paiements.filter((p: Paiement) => 
        p.date_paiement && p.date_paiement.startsWith(today)
      ).length;
      
      // Calculer le taux de réussite
      const paiementReussi = paiements.filter((p: Paiement) => p.statut === 'reussi').length;
      const tauxReussite = totalPaiements > 0 ? Math.round((paiementReussi / totalPaiements) * 100) : 0;
      
      setStats({
        totalPaiements,
        totalClients,
        totalPrestations,
        chiffreAffaire,
        paiementsAujourdhui,
        tauxReussite,
        hommes,
        femmes,
        clientsActifs,
      });
      
      // Récupérer les paiements récents
      const recentPaiementsData = paiements
        .sort((a: Paiement, b: Paiement) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime())
        .slice(0, 5)
        .map((p: Paiement) => ({
          id: p.id,
          client: p.client_nom_complet || 'Client inconnu',
          montant: p.montant || 0,
          statut: p.statut,
          date: p.date_paiement,
          prestation: p.prestation_nom || 'Prestation inconnue'
        }));
      
      setRecentPaiements(recentPaiementsData);
      
      // Initialiser l'ID du dernier paiement si ce n'est pas déjà fait
      if (!lastPaiementId && paiements.length > 0) {
        const latest = paiements.sort((a: Paiement, b: Paiement) => 
          new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime()
        )[0];
        setLastPaiementId(latest.id);
      }
      
      toast.success('Données du tableau de bord actualisées');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
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
          Chargement du tableau de bord...
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
              Tableau de bord
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vue d'ensemble de votre activité
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
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
            Actualiser
          </Button>
        </Box>
      </Paper>

      {/* Cartes de statistiques principales */}
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
                    {stats.totalPaiements}
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
                      +12% ce mois
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
                    Total Clients
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
                    {stats.totalClients}
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
                    Chiffre d'affaires
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
                    {formatMontant(stats.chiffreAffaire)}
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
                  <TrendingUp sx={{ fontSize: 24 }} />
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
                    Taux de réussite
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
                    {stats.tauxReussite}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArrowDownward sx={{ color: '#ef4444', fontSize: 16 }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#ef4444',
                        fontWeight: 500
                      }}
                    >
                      -2% ce mois
                    </Typography>
                  </Box>
                </Box>
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    width: 48,
                    height: 48
                  }}
                >
                  <Spa sx={{ fontSize: 24 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Statistiques des clients */}
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
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            color: '#1a1a1a'
          }}
        >
          Statistiques des clients
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Total Clients
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}
                    >
                      {stats.totalClients}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <People sx={{ fontSize: 20 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Clients Actifs
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}
                    >
                      {stats.clientsActifs}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <CheckCircleOutline sx={{ fontSize: 20 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Hommes
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}
                    >
                      {stats.hommes}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 250px', minWidth: '200px' }}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                border: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Femmes
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}
                    >
                      {stats.femmes}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Paper>

      {/* Graphiques */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 600px', minWidth: '300px' }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: '#1a1a1a'
                }}
              >
                Évolution des paiements
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={paiementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    wrapperStyle={{
                      paddingTop: '10px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="montant" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    name="Montant (FCFA)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                    name="Transactions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: '#1a1a1a'
                }}
              >
                Répartition des statuts
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statutData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {statutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Paiements récents */}
      <Card 
        sx={{ 
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                color: '#1a1a1a'
              }}
            >
              Paiements récents
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate('/paiements')}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#3b82f6',
                  color: '#3b82f6'
                }
              }}
            >
              Voir tout
            </Button>
          </Box>
          <List sx={{ p: 0 }}>
            {recentPaiements.map((paiement, index) => (
              <React.Fragment key={paiement.id}>
                <ListItem 
                  sx={{ 
                    px: 0,
                    py: 2,
                    borderRadius: 1,
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        background: getStatutColor(paiement.statut) === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                 getStatutColor(paiement.statut) === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        width: 40,
                        height: 40
                      }}
                    >
                      {getStatutIcon(paiement.statut)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: '#1a1a1a',
                          mb: 0.5
                        }}
                      >
                        {paiement.client}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {paiement.prestation} • {new Date(paiement.date).toLocaleDateString('fr-FR')}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#3b82f6',
                        fontSize: '1.1rem'
                      }}
                    >
                      {formatMontant(paiement.montant)}
                    </Typography>
                    <Chip
                      label={paiement.statut === 'reussi' ? 'Réussi' : paiement.statut === 'en_attente' ? 'En attente' : 'Échoué'}
                      color={getStatutColor(paiement.statut) as any}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        borderRadius: 1
                      }}
                    />
                  </Box>
                </ListItem>
                {index < recentPaiements.length - 1 && 
                  <Divider sx={{ my: 1, borderColor: '#f0f0f0' }} />
                }
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export { Dashboard };
export default Dashboard;
