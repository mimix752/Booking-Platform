import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, clearAuthToken } from '../utils/apiClient';
import { verifyToken as verifyTokenApi } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restauration de session: si un token existe, on le vérifie côté API.
    const restoreSession = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await verifyTokenApi();
        setUser(userData);
        setIsAdmin(userData?.role === 'admin');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAdmin', (userData?.role === 'admin').toString());
      } catch (e) {
        clearAuthToken();
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Fallback (ancien comportement) si aucun token: charger user/localStorage
    const restoreLegacy = () => {
      const savedUser = localStorage.getItem('user');
      const savedIsAdmin = localStorage.getItem('isAdmin');

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (savedIsAdmin === 'true') {
        setIsAdmin(true);
      }

      setLoading(false);
    };

    if (getAuthToken()) {
      restoreSession();
    } else {
      restoreLegacy();
    }
  }, []);

  const login = (userData, adminStatus = false) => {
    setUser(userData);
    setIsAdmin(adminStatus);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAdmin', adminStatus.toString());
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);

    clearAuthToken();

    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  const isUCAEmail = (email) => {
    return email.endsWith('@uca.ma') || email.endsWith('@uca.ac.ma');
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    logout,
    isUCAEmail,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
