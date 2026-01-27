import React from 'react';
import { Calendar, Users, Clock } from 'lucide-react';
import { sites, getSiteBadgeColor } from '../data/sites';
import { useNavigate } from 'react-router-dom'; //  Import pour la navigation

const LocalCard = ({ local }) => {
  const navigate = useNavigate(); //  Hook React Router
  const siteName = sites.find(s => s.id === local.site)?.name;

  // Fonction appelée au clic sur "Réserver"
  const handleReserve = () => {
    navigate('/login'); //  Redirection vers LoginPage
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden 
                  border-2 border-transparent 
                  hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-400/50
                  transform transition-all duration-500 hover:-translate-y-2 hover:scale-105
                  animate-pulse-slow`}
    >
      {/* Status Bar */}
      <div
        className={`h-2 ${
          local.disponible
            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-red-500 to-orange-500'
        }`}
      ></div>

      <div className="p-6">
        {/* Title & status dot */}
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-lg font-bold text-gray-900 leading-tight">{local.nom}</h4>
          {local.disponible ? (
            <span className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></span>
          ) : (
            <span className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getSiteBadgeColor(local.site)}`}
          >
            {siteName}
          </span>

          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{local.capacite} personnes</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {local.equipements.slice(0, 2).map((eq, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {eq}
              </span>
            ))}
            {local.equipements.length > 2 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                +{local.equipements.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleReserve} // 👈 Redirection au clic
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
                       hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 font-medium text-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Réserver</span>
          </button>

          <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocalCard;
