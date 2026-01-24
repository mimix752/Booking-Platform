import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { 
  Users, 
  Building, 
  Calendar, 
  History, 
  Settings, 
  BarChart3, 
  CalendarDays,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('comptes');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const menuItems = [
    { id: 'comptes', label: 'Gestion des comptes', icon: Users },
    { id: 'salles', label: 'Gestion des salles', icon: Building },
    { id: 'reservations', label: 'Gestion des réservations', icon: Calendar },
    { id: 'historique', label: 'Historique', icon: History },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/uca-logo.png" alt="UCA Logo" className="w-12 h-12" />
              <div>
                <h1 className="text-xl font-bold text-amber-800">Dashboard Admin</h1>
                <p className="text-sm text-amber-700">Université Cadi Ayyad</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-stone-200 text-amber-800 rounded-lg hover:bg-stone-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Full Height Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === item.id
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

        {/* Main Content Area */}
        <div className="flex-1 bg-stone-50">
          <div className="p-8">
            {/* Large Statistics Section */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <StatistiquesSection />
            </div>
            
            {/* Calendar Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <CalendrierSection />
            </div>
            
            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === 'comptes' && <ComptesSection />}
              {activeTab === 'salles' && <SallesSection />}
              {activeTab === 'reservations' && <ReservationsSection />}
              {activeTab === 'historique' && <HistoriqueSection />}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex justify-center space-x-4">
              <button className="flex items-center space-x-2 px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors">
                <Plus className="w-5 h-5" />
                <span>Ajouter une salle</span>
              </button>
              <button className="flex items-center space-x-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
                <Settings className="w-5 h-5" />
                <span>Maintenance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Sections Components
const ComptesSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-amber-800 mb-6">🔐 Gestion des comptes</h2>
    <div className="space-y-4">
      <div className="p-4 border border-stone-200 rounded-lg">
        <h3 className="font-semibold text-amber-800">Admin principal</h3>
        <p className="text-sm text-gray-600">admin@uca.ac.ma</p>
        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Actif</span>
      </div>
      <div className="p-4 border border-stone-200 rounded-lg">
        <h3 className="font-semibold text-amber-800">Admin secondaire</h3>
        <p className="text-sm text-gray-600">Optionnel</p>
        <button className="mt-2 px-4 py-2 bg-amber-800 text-white rounded text-sm hover:bg-amber-900">
          Ajouter
        </button>
      </div>
    </div>
  </div>
);

const SallesSection = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-amber-800">🏛️ Gestion des salles</h2>
      <button className="flex items-center space-x-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900">
        <Plus className="w-4 h-4" />
        <span>Ajouter une salle</span>
      </button>
    </div>
    
    <div className="space-y-4">
      {[
        { nom: 'Salle A1', capacite: 50, type: 'Réunion', statut: 'disponible' },
        { nom: 'Salle B2', capacite: 100, type: 'Fête', statut: 'maintenance' },
        { nom: 'Salle C3', capacite: 30, type: 'Polyvalente', statut: 'indisponible' }
      ].map((salle, index) => (
        <div key={index} className="p-4 border border-stone-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-amber-800">{salle.nom}</h3>
              <p className="text-sm text-gray-600">Capacité: {salle.capacite} | Type: {salle.type}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                salle.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                salle.statut === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {salle.statut === 'disponible' ? '🟢 Disponible' :
                 salle.statut === 'maintenance' ? '🟡 Maintenance' : '🔴 Indisponible'}
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-amber-800 hover:bg-amber-100 rounded">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-100 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReservationsSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-amber-800 mb-6">📅 Gestion des réservations</h2>
    <div className="space-y-4">
      {[
        { salle: 'Salle A1', date: '2024-01-25', heure: '14:00-16:00', motif: 'Réunion club étudiant', statut: 'en_attente' },
        { salle: 'Salle B2', date: '2024-01-26', heure: '10:00-12:00', motif: 'Événement culturel', statut: 'en_attente' }
      ].map((reservation, index) => (
        <div key={index} className="p-4 border border-stone-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-amber-800">{reservation.salle}</h3>
              <p className="text-sm text-gray-600">{reservation.date} | {reservation.heure}</p>
              <p className="text-sm text-gray-600">Motif: {reservation.motif}</p>
            </div>
            <div className="flex space-x-2">
              <button className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200">
                <Check className="w-4 h-4" />
                <span>Accepter</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200">
                <X className="w-4 h-4" />
                <span>Refuser</span>
              </button>
              <button className="p-1 text-amber-800 hover:bg-amber-100 rounded">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HistoriqueSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-amber-800 mb-6">🧾 Historique</h2>
    <div className="mb-4 flex space-x-4">
      <select className="px-3 py-2 border border-stone-300 rounded-lg">
        <option>Toutes les salles</option>
        <option>Salle A1</option>
        <option>Salle B2</option>
      </select>
      <select className="px-3 py-2 border border-stone-300 rounded-lg">
        <option>Tous les statuts</option>
        <option>Acceptées</option>
        <option>Refusées</option>
        <option>Annulées</option>
      </select>
    </div>
    <div className="text-center py-8 text-gray-500">
      Historique des réservations...
    </div>
  </div>
);

const MaintenanceSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-amber-800 mb-6">🛠️ Maintenance</h2>
    <button className="mb-4 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900">
      Planifier une maintenance
    </button>
    <div className="text-center py-8 text-gray-500">
      Aucune maintenance planifiée
    </div>
  </div>
);

const StatistiquesSection = () => (
  <div>
    <h2 className="text-3xl font-bold text-amber-800 mb-8">📊 Statistiques</h2>
    
    {/* Global Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="p-6 bg-amber-50 rounded-lg">
        <h3 className="text-3xl font-bold text-amber-800">156</h3>
        <p className="text-sm text-amber-700">Total réservations</p>
      </div>
      <div className="p-6 bg-green-50 rounded-lg">
        <h3 className="text-3xl font-bold text-green-800">142</h3>
        <p className="text-sm text-green-700">Acceptées</p>
      </div>
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-3xl font-bold text-red-800">14</h3>
        <p className="text-sm text-red-700">Refusées</p>
      </div>
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-3xl font-bold text-blue-800">91%</h3>
        <p className="text-sm text-blue-700">Taux d'occupation</p>
      </div>
    </div>

    {/* School Statistics */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-xl font-semibold text-amber-800 mb-4">Réservations par École</h3>
        <div className="space-y-3">
          {[
            { ecole: 'ENSA', reservations: 45, color: 'bg-blue-500' },
            { ecole: 'ENS', reservations: 38, color: 'bg-green-500' },
            { ecole: 'FMPM', reservations: 32, color: 'bg-purple-500' },
            { ecole: 'FSJES', reservations: 28, color: 'bg-orange-500' },
            { ecole: 'FP', reservations: 13, color: 'bg-red-500' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="font-medium">{item.ecole}</span>
              </div>
              <span className="text-lg font-bold text-amber-800">{item.reservations}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-amber-800 mb-4">🤖 Prédictions IA</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Pic d'activité prévu</h4>
            <p className="text-sm text-blue-700">Jeudi 15h-17h (+34% de demandes)</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">École la plus active</h4>
            <p className="text-sm text-green-700">ENSA (tendance +12% ce mois)</p>
          </div>
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Optimisation suggérée</h4>
            <p className="text-sm text-orange-700">Ajouter 2 créneaux Salle A1 le mardi</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CalendrierSection = () => (
  <div>
    <h2 className="text-2xl font-bold text-amber-800 mb-6">🗓️ Calendrier</h2>
    <div className="text-center py-8 text-gray-500">
      Vue calendrier - À implémenter
    </div>
  </div>
);

export default AdminDashboard;