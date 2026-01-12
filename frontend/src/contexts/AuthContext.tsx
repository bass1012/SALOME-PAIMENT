import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  actif: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isVendeur: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          console.error('Erreur lors de la lecture des données utilisateur:', error);
          // Nettoyer le stockage en cas d'erreur
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_BASE_URL}/utilisateurs/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.user) {
        // Stocker le token et les informations utilisateur
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return true;
      } else {
        console.error('Échec de la connexion:', data.error || 'Erreur inconnue');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return false;
    }
  };

  const logout = () => {
    // Appeler l'API de déconnexion si un token est disponible
    if (token) {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      fetch(`${API_BASE_URL}/utilisateurs/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
      });
    }
    
    // Nettoyer l'état et le stockage
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de login
    navigate('/login');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Définir les permissions par rôle
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'view_dashboard',
        'manage_users',
        'manage_clients',
        'manage_prestations',
        'manage_paiements',
        'manage_sessions',
        'view_reports',
        'manage_system',
      ],
      vendeur: [
        'view_dashboard',
        'manage_clients',
        'manage_prestations',
        'manage_paiements',
        'manage_sessions',
        'view_reports',
      ],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isVendeur = (): boolean => {
    return user?.role === 'vendeur';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasPermission,
    isAdmin,
    isVendeur,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
