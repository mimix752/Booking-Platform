import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Plus, Wrench, FileText, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      {/* Statistiques Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-3xl font-bold text-amber-800 mb-8"> Statistiques</h2>
        
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

        {/* School Statistics & AI Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

      {/* Demandes en attente */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-amber-800">Demandes en attente</h2>
            <p className="text-gray-600 mt-1">Gérez les demandes de réservation récentes</p>
          </div>
          <button 
            onClick={() => navigate('/admin/reservations')}
            className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            Voir tout
          </button>
        </div>
        
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="mb-2">Affichage de 5 demandes sur 5</p>
          <p className="text-sm">Cliquez sur "Voir tout" pour accéder au tableau complet</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ajouter un local */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter un local</h3>
          <p className="text-gray-600 text-sm mb-4">Enregistrez un nouveau local dans la base de données</p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ajouter
          </button>
        </div>

        {/* Mode maintenance */}
        <div 
          onClick={() => navigate('/admin/maintenance')}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mode maintenance</h3>
          <p className="text-gray-600 text-sm mb-4">Mettez un local en maintenance temporaire</p>
          <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            Gérer
          </button>
        </div>

        {/* Générer un rapport */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Générer un rapport</h3>
          <p className="text-gray-600 text-sm mb-4">Exportez les statistiques au format PDF ou Excel</p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Exporter
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;