import React, { useState } from 'react';
import { Calendar, ArrowRight, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMesReservations = () => {
    navigate('/mes-reservations');
  };

  return (
    <header className="bg-stone-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img src="/uca-logo.png" alt="UCA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-amber-800">
                UCA Booking
              </h1>
              <p className="text-sm text-amber-700">Université Cadi Ayyad</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <button
                onClick={handleLogin}
                className="px-6 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-all duration-300 flex items-center space-x-2 font-medium"
              >
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Affichage des infos utilisateur */}
                <div className="flex items-center space-x-3">
                  {user?.picture && (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                </div>

                {/* Boutons d'action */}
                {isAdmin ? (
                  <button
                    onClick={handleDashboard}
                    className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-all duration-300 font-medium text-sm"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={handleMesReservations}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium text-sm flex items-center space-x-1"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Mes réservations</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-stone-200 text-amber-800 rounded-lg hover:bg-stone-300 transition-all duration-300 font-medium text-sm flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;