import { Building2, MapPin, TrendingUp, Users } from 'lucide-react';

export const sites = [
  { 
    id: 'all', 
    name: 'Tous les sites', 
    icon: Building2 
  },
  { 
    id: 'bibliotheque', 
    name: 'Bibliothèque', 
    icon: MapPin 
  },
  { 
    id: 'innovation', 
    name: "Cité d'Innovation", 
    icon: TrendingUp 
  },
  { 
    id: 'conferences', 
    name: 'Centre de Conférences', 
    icon: Users 
  },
  { 
    id: 'presidence', 
    name: 'Présidence', 
    icon: Building2 
  }
];

export const getSiteBadgeColor = (site) => {
  const colors = {
    presidence: 'bg-blue-100 text-blue-800',
    conferences: 'bg-purple-100 text-purple-800',
    innovation: 'bg-green-100 text-green-800',
    bibliotheque: 'bg-orange-100 text-orange-800'
  };
  return colors[site] || 'bg-gray-100 text-gray-800';
};