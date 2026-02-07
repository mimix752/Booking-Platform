import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProtocoleSection from '../components/ProtocoleSection';
import LocauxSection from '../components/LocauxSection';
import Footer from '../components/Footer';
import { getLocaux, getSites } from '../services/publicDataService';

const HomePage = () => {
  const [sites, setSites] = useState([]);
  const [locaux, setLocaux] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sitesData, locauxData] = await Promise.all([getSites(), getLocaux()]);
        setSites(sitesData);
        setLocaux(locauxData);
      } catch (e) {
        console.error(e);
        setSites([]);
        setLocaux([]);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const locauxCount = Array.isArray(locaux) ? locaux.length : 0;
    const sitesCount = Array.isArray(sites) ? sites.length : 0;
    const placesCount = Array.isArray(locaux)
      ? locaux.reduce((sum, l) => sum + (Number(l?.capacite) || 0), 0)
      : 0;

    return {
      locaux: locauxCount,
      places: placesCount,
      sites: sitesCount,
    };
  }, [sites, locaux]);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <HeroSection stats={stats} />
      <ProtocoleSection />
      <LocauxSection />
      <Footer />
    </div>
  );
};

export default HomePage;