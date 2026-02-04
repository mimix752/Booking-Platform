import React from 'react';
import { Building2, Users, MapPin } from 'lucide-react';

const StatsCards = ({ stats = { locaux: 24, places: 1850, sites: 4 } }) => {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        .card-float {
          animation: float 5s ease-in-out infinite;
        }

        .card-float:hover {
          animation-play-state: paused;
          transform: translateY(0px) scale(1.05);
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
        
        {/* Card 1 - Locaux */}
        <div className="card-float bg-white rounded-xl p-4 shadow-md border-2 border-transparent 
                        hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/40 
                        transition-all duration-300">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.locaux}</div>
          <div className="text-sm text-gray-600 font-medium">Locaux disponibles</div>
        </div>

        {/* Card 2 - Places */}
        <div className="card-float bg-white rounded-xl p-4 shadow-md border-2 border-transparent 
                        hover:border-purple-400 hover:shadow-lg hover:shadow-purple-400/40 
                        transition-all duration-300">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-3">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.places}</div>
          <div className="text-sm text-gray-600 font-medium">Places disponibles</div>
        </div>

        {/* Card 3 - Sites */}
        <div className="card-float bg-white rounded-xl p-4 shadow-md border-2 border-transparent 
                        hover:border-green-400 hover:shadow-lg hover:shadow-green-400/40 
                        transition-all duration-300">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-3">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{stats.sites}</div>
          <div className="text-sm text-gray-600 font-medium">Sites universitaires</div>
        </div>

      </div>
    </>
  );
};

export default StatsCards;