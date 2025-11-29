import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateToken = async () => {
      // Étape 1: Essayer de charger l'utilisateur depuis le cache local pour un chargement rapide
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        try {
          const userData: User = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (e) {
          // Le JSON est corrompu, on nettoie
          localStorage.removeItem('user');
        }
      }

      // Étape 2: Valider le token avec le serveur en arrière-plan
      if (!token) { // S'il n'y a pas de token, on arrête tout de suite.
        setIsLoading(false);
        return;
      }

      try {
        // On valide le token pour s'assurer qu'il est toujours bon
        const response = await fetch('http://localhost:5000/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userData: User = await response.json();
          login(userData, token); // On utilise login pour tout mettre à jour proprement
        } else {
          // Si le token est invalide, on déconnecte silencieusement sans effacer l'utilisateur du cache
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erreur de validation du token", error);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, isAuthenticated, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l'intérieur d\'un AuthProvider');
  }
  return context;
};