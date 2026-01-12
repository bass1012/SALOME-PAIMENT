import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Payments as PaymentsIcon,
  People as PeopleIcon,
  Spa as SpaIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}


export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Appeler l'API de déconnexion
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/utilisateurs/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
      });
    }
    
    // Utiliser la fonction logout du contexte
    logout();
    
    // Rediriger vers la page de login
    navigate('/login');
  };

  const getMenuItems = () => {
    const baseItems = [
      { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Paiements', icon: <PaymentsIcon />, path: '/paiements' },
      { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
      { text: 'Prestations', icon: <SpaIcon />, path: '/prestations' },
      { text: 'Avis', icon: <StarIcon />, path: '/avis' },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { text: 'Utilisateurs', icon: <PersonIcon />, path: '/users' },
        { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
      ];
    } else if (user?.role === 'vendeur') {
      // Les vendeurs n'ont pas accès aux paramètres
      return baseItems;
    } else {
      // Autres rôles (gestionnaires, employés, etc.) ont accès aux paramètres
      return [
        ...baseItems,
        { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };


  const drawer = (
    <div>
      <Toolbar>
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={{
            background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          SALOME PAIEMENT
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                margin: '4px 8px',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(234, 224, 189, 0.2) 0%, rgba(234, 223, 188, 0.2) 100%)',
                  borderLeft: '4px solid #EAE0BD',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(234, 224, 189, 0.1) 0%, rgba(234, 223, 188, 0.1) 100%)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? '#EAE0BD' : '#666666',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? '#1A1A1A' : '#666666',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'flex-end',
        justifyContent: 'center',
        pb: 3,
        pt: 30
      }}>
        <Box 
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{
            width: '280px',
            height: '300px',
            maxHeight: '300px',
            objectFit: 'contain',
            opacity: 0.8,
            transition: 'opacity 0.3s ease',
            '&:hover': {
              opacity: 1,
            }
          }}
        />
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #EAE0BD 0%, #EADFBC 100%)',
          boxShadow: '0 4px 20px rgba(234, 224, 189, 0.3)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Tableau de bord'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                {user ? `${user.first_name} ${user.last_name}` : 'Utilisateur'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(26, 26, 26, 0.7)' }}>
                {user?.role === 'admin' ? 'Administrateur' : 'Vendeur'}
              </Typography>
            </Box>
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
              title="Se déconnecter"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              background: '#FFFFFF',
              borderRight: '1px solid rgba(255, 215, 0, 0.2)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
                opacity: 0.9,
                zIndex: -1,
              },
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%)',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
