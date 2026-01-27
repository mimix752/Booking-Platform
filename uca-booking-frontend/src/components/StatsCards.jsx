import React from 'react';
import { Building2, Users, MapPin } from 'lucide-react';

const StatsCards = ({ stats = { locaux: 24, places: 1850, sites: 4 } }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {/* Card 1 - Locaux */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent 
                      hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-400/50 
                      transform transition-all duration-500 hover:-translate-y-2 hover:scale-105 animate-pulse-slow">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mx-auto mb-4">
          <Building2 className="w-7 h-7 text-blue-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{stats.locaux}</div>
        <div className="text-gray-600 font-medium">Locaux disponibles</div>
      </div>

      {/* Card 2 - Places */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent 
                      hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-400/50 
                      transform transition-all duration-500 hover:-translate-y-2 hover:scale-105 animate-pulse-slow">
        <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mx-auto mb-4">
          <Users className="w-7 h-7 text-purple-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{stats.places}</div>
        <div className="text-gray-600 font-medium">Places disponibles</div>
      </div>

      {/* Card 3 - Sites */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent 
                      hover:border-green-400 hover:shadow-2xl hover:shadow-green-400/50 
                      transform transition-all duration-500 hover:-translate-y-2 hover:scale-105 animate-pulse-slow">
        <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mx-auto mb-4">
          <MapPin className="w-7 h-7 text-green-600" />
        </div>
        <div className="text-4xl font-bold text-gray-900 mb-2">{stats.sites}</div>
        <div className="text-gray-600 font-medium">Sites universitaires</div>
      </div>
    </div>
  );
};

export default StatsCards;
