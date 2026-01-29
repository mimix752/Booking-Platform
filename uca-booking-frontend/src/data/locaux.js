// Fonction pour charger les locaux depuis localStorage
const getLocauxFromStorage = () => {
  try {
    const savedLocaux = localStorage.getItem('locaux');
    if (savedLocaux) {
      return JSON.parse(savedLocaux);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des locaux:', error);
  }
  return [];
};

// Locaux statiques par défaut (au cas où localStorage est vide)
const locauxParDefaut = [
  { 
    id: 1, 
    nom: 'Amphithéâtre Principal', 
    site: 'presidence', 
    capacite: 200, 
    disponible: true, 
    equipements: ['Vidéoprojecteur', 'Sonorisation', 'Visio'] 
  },
  { 
    id: 2, 
    nom: 'Salle de Conférence A', 
    site: 'conferences', 
    capacite: 100, 
    disponible: true, 
    equipements: ['Vidéoprojecteur', 'Écran', 'Visio'] 
  },
  { 
    id: 3, 
    nom: 'Salle Innovation Hub', 
    site: 'innovation', 
    capacite: 50, 
    disponible: true, 
    equipements: ['Écran', 'Visio', 'Tableau blanc'] 
  },
  { 
    id: 4, 
    nom: 'Bibliothèque Hall', 
    site: 'bibliotheque', 
    capacite: 80, 
    disponible: false, 
    equipements: ['Vidéoprojecteur', 'Sonorisation'] 
  },
  { 
    id: 5, 
    nom: 'Salle Réunion B1', 
    site: 'presidence', 
    capacite: 30, 
    disponible: true, 
    equipements: ['Vidéoprojecteur', 'Écran'] 
  },
  { 
    id: 6, 
    nom: 'Auditorium', 
    site: 'conferences', 
    capacite: 150, 
    disponible: true, 
    equipements: ['Vidéoprojecteur', 'Sonorisation', 'Visio', 'Scène'] 
  },
  { 
    id: 7, 
    nom: 'Salle Polyvalente', 
    site: 'innovation', 
    capacite: 60, 
    disponible: true, 
    equipements: ['Écran', 'Tableau blanc'] 
  },
  { 
    id: 8, 
    nom: 'Salle VIP', 
    site: 'presidence', 
    capacite: 20, 
    disponible: true, 
    equipements: ['Écran', 'Visio'] 
  }
];


// Fonction pour normaliser le format des locaux (pour compatibilité)
const normalizeLocal = (local) => {
  return {
    id: local.id,
    nom: local.nom,
    type: local.type || 'Salle',
    capacite: local.capacite,
    site: local.site || 'Campus principal',
    equipements: Array.isArray(local.equipements) ? local.equipements : 
                 (local.equipements ? local.equipements.split(',').map(e => e.trim()) : []),
    disponible: local.disponible !== false,
    description: local.description || '',
    image: local.image || '/images/default-room.jpg'
  };
};

// Combiner les locaux du localStorage avec les locaux par défaut
const getCombinedLocaux = () => {
  const storageLocaux = getLocauxFromStorage();
  
  // Si localStorage a des locaux, utiliser ceux-là ET les locaux par défaut
  if (storageLocaux.length > 0) {
    const normalizedStorage = storageLocaux
      .filter(local => local.disponible !== false) // Ne montrer que les locaux disponibles
      .map(normalizeLocal);
    
    const normalizedDefaults = locauxParDefaut.map(normalizeLocal);
    
    // Combiner les deux listes (localStorage en premier)
    return [...normalizedStorage, ...normalizedDefaults];
  }
  
  // Si localStorage est vide, utiliser seulement les locaux par défaut
  return locauxParDefaut.map(normalizeLocal);
};

// Export des locaux (sera mis à jour dynamiquement)
export const locaux = getCombinedLocaux();

// Export de la fonction pour rafraîchir les locaux (utile pour les composants qui ont besoin de recharger)
export const refreshLocaux = () => {
  return getCombinedLocaux();
};

// Export des locaux par défaut (au cas où on en a besoin)
export const defaultLocaux = locauxParDefaut;
