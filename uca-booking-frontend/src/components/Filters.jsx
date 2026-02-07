import React from 'react';
import { Search } from 'lucide-react';

const Filters = ({ searchTerm, setSearchTerm, selectedSite, setSelectedSite, sites = [] }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filtres par site */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sites.map(site => {
            const SiteIcon = site.icon;
            return (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedSite === site.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {SiteIcon ? <SiteIcon className="w-4 h-4" /> : null}
                <span className="text-sm">{site.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Filters;