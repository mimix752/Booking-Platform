import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import Filters from './Filters';
import LocalCard from './LocalCard';
import { getLocaux, getSites } from '../services/publicDataService';

const LocauxSection = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [locaux, setLocaux] = useState([]);
  const [sites, setSites] = useState([]);

  // Charger les locaux + sites depuis l'API au montage du composant
  useEffect(() => {
    const load = async () => {
      try {
        const [locauxData, sitesData] = await Promise.all([getLocaux(), getSites()]);
        setLocaux(locauxData);
        setSites(sitesData);
      } catch (e) {
        console.error(e);
        setLocaux([]);
        setSites([]);
      }
    };

    load();
  }, []);

  const getLocalSiteKey = (local) => {
    // Backend: local.site.site_id (string) + local.site_id (FK int)
    return local?.site?.site_id || local?.site_id || local?.site;
  };

  const getLocalName = (local) => local?.nom || local?.name || '';

  // Convertit les sites backend -> options de filtre
  const siteFilters = useMemo(() => {
    const options = (sites || []).map((s) => ({
      id: s.site_id || String(s.id),
      name: s.nom || s.name || s.site_id || String(s.id),
      icon: Building2,
    }));

    return [{ id: 'all', name: 'Tous les sites', icon: Building2 }, ...options];
  }, [sites]);

  // Filtrer les locaux
  const locauxFiltres = locaux.filter((local) => {
    const siteKey = getLocalSiteKey(local);
    const matchSite = selectedSite === 'all' || siteKey === selectedSite;
    const matchSearch = getLocalName(local).toLowerCase().includes(searchTerm.toLowerCase());
    return matchSite && matchSearch;
  });

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-gray-900 mb-5">Nos locaux</h3>
          <p className="text-lg text-gray-600">Découvrez nos espaces disponibles</p>
        </div>

        <Filters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
          sites={siteFilters}
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