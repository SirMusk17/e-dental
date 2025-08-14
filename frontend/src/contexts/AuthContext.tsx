import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthTokens } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && apiService.isAuthenticated();

  // Charger l'utilisateur au démarrage si un token existe
  useEffect(() => {
    const initAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
          apiService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Connexion
      const authResponse = await apiService.login(credentials);
      const tokens: AuthTokens = authResponse.data;
      
      // Sauvegarder les tokens
      apiService.setTokens(tokens);
      
      // Récupérer les informations utilisateur
      await refreshUser();
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Erreur de connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    apiService.logout();
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userResponse = await apiService.getCurrentUser();
      setUser(userResponse.data);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'utilisateur:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
