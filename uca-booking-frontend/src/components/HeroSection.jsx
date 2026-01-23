import React from 'react';
import StatsCards from './StatsCards';

const HeroSection = ({ stats = { locaux: 24, places: 1850, sites: 4 } }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            Plateforme officielle de réservation
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Réservez les locaux de la Présidence UCA
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
              en toute simplicité
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
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