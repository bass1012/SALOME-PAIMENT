import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Layout } from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Paiements from '../pages/Paiements';
import Clients from '../pages/Clients';
import Prestations from '../pages/Prestations';
import AvisClients from '../pages/AvisClients';
import Settings from '../pages/Settings';
import Users from '../pages/Users';
import Session from '../pages/Session';
import AuthDirecte from '../pages/AuthDirecte';
import Login from '../pages/Login';
import { useAuth } from '../context/AuthContext';

// Composant pour protéger les routes nécessitant une authentification
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Composant pour la page de login (redirige si déjà connecté)
const LoginRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />;
};

export const AppRouter: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route publique pour la page de login */}
            <Route path="/login" element={<LoginRoute />} />
            
            {/* Route publique pour l'authentification directe des clients */}
            <Route path="/auth-directe" element={<AuthDirecte />} />
            
            {/* Route publique pour les sessions de paiement */}
            <Route path="/session/:session_id" element={<Session />} />
            
            {/* Routes protégées nécessitant une authentification */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/paiements" element={<Paiements />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/prestations" element={<Prestations />} />
                      <Route path="/avis" element={<AvisClients />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFFFF',
                color: '#1A1A1A',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, #E8F5E8 0%, #F0F9F0 100%)',
                  border: '1px solid rgba(56, 142, 60, 0.3)',
                },
                iconTheme: {
                  primary: '#388E3C',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, #FFEBEE 0%, #FFF5F5 100%)',
                  border: '1px solid rgba(211, 47, 47, 0.3)',
                },
                iconTheme: {
                  primary: '#D32F2F',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
};
