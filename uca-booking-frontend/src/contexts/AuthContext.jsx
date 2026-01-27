import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem('user');
    const savedIsAdmin = localStorage.getItem('isAdmin');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    if (savedIsAdmin === 'true') {
      setIsAdmin(true);
    }

    setLoading(false);
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
