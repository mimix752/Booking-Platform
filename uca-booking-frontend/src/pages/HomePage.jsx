import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ProtocoleSection from '../components/ProtocoleSection';
import LocauxSection from '../components/LocauxSection';
import Footer from '../components/Footer';

const HomePage = () => {
  const stats = { 
    locaux: 24, 
    places: 1850, 
    sites: 4 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <HeroSection stats={stats} />
      <ProtocoleSection />
      <LocauxSection />
      <Footer />
    </div>
  );
};

export default HomePage;