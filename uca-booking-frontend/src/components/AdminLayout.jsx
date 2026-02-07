import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, Building, History, Settings, LogOut, LayoutDashboard, Wrench, ListChecks } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { id: 'reservations', label: 'Réservations', icon: ListChecks, path: '/admin/reservations' },
    { id: 'historique', label: 'Historique', icon: History, path: '/admin/historique' },
    { id: 'calendrier', label: 'Calendrier', icon: Calendar, path: '/admin/calendrier' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/admin/maintenance' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/admin-dashboard')}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl flex items-center justify-center shadow-lg">
  <img src="/uca-logo.png" alt="UCA Logo" className="w-full h-full object-contain" />
</div>
              <div>
                <h1 className="text-xl font-bold text-amber-800">Dashboard Admin</h1>
                <p className="text-sm text-amber-700">Université Cadi Ayyad</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
  {/* Bouton Accueil */}
  <button
    onClick={() => navigate('/')}
    className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
  >
    <LayoutDashboard className="w-4 h-4" />
    <span>Accueil</span>
  </button>

  {/* Bouton Déconnexion */}
  <button 
    onClick={handleLogout}
    className="flex items-center space-x-2 px-4 py-2 bg-stone-200 text-amber-800 rounded-lg hover:bg-stone-300 transition-colors"
  >
    <LogOut className="w-4 h-4" />
    <span>Se déconnecter</span>
  </button>
</div>

          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      active
                        ? 'bg-amber-100 text-amber-800 font-medium'
                        : 'text-gray-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-stone-50">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;