import React from 'react';
import { Calendar } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">UCA Booking</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Plateforme officielle de gestion des réservations des locaux de l'Université Cadi Ayyad.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Email: booking@uca.ma</li>
              <li>Tél: +212 5XX-XXXXXX</li>
              <li>Présidence UCA, Marrakech</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Liens utiles</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Guide d'utilisation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support technique</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2026 Université Cadi Ayyad. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;