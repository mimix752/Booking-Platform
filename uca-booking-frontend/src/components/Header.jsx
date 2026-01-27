import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    window.location.reload();
  };
  return (
    <header className="bg-stone-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
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
            {!isAdmin ? (
              <button 
                onClick={handleLogin}
                className="px-6 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-all duration-300 flex items-center space-x-2 font-medium"
              >
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button 
                  onClick={handleDashboard}
                  className="px-6 py-2.5 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-all duration-300 font-medium"
                >
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-stone-200 text-amber-800 rounded-lg hover:bg-stone-300 transition-all duration-300 font-medium"
                >
                  Se déconnecter
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