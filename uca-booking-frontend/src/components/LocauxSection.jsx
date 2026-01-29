import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Filters from './Filters';
import LocalCard from './LocalCard';
import { refreshLocaux } from '../data/locaux';

const LocauxSection = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [locaux, setLocaux] = useState([]);

  // Charger les locaux au montage du composant
  useEffect(() => {
    const loadLocaux = () => {
      const allLocaux = refreshLocaux();
      setLocaux(allLocaux);
    };
    
    loadLocaux();
    
    // Écouter les changements dans localStorage (pour rafraîchir quand admin ajoute un local)
    const handleStorageChange = (e) => {
      if (e.key === 'locaux') {
        loadLocaux();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filtrer les locaux
  const locauxFiltres = locaux.filter(local => {
    const matchSite = selectedSite === 'all' || local.site === selectedSite;
    const matchSearch = local.nom.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSite && matchSearch;
  });

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Nos locaux</h3>
          <p className="text-lg text-gray-600">Découvrez nos espaces disponibles</p>
        </div>

        <Filters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
        />

        {/* Grille des locaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {locauxFiltres.map(local => (
            <LocalCard key={local.id} local={local} />
          ))}
        </div>

        {locauxFiltres.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Aucun local trouvé</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LocauxSection;