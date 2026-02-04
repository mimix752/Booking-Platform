import React from 'react';
import StatsCards from './StatsCards';

const HeroSection = ({ stats = { locaux: 24, places: 1850, sites: 4 } }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-4xl mx-auto">
          
          <h2 className="text-4xl font-bold text-gray-900 mb-5 leading-tight">
            Réservez les locaux de la Présidence UCA
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-">
              en toute simplicité
            </span>
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Une plateforme centralisée, sécurisée et intelligente pour la gestion 
            des salles et espaces institutionnels.
          </p>
          
          <StatsCards stats={stats} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;