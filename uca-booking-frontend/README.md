# UCA Booking - Frontend

Plateforme de réservation des locaux de l'Université Cadi Ayyad

## 🚀 Technologies utilisées

- **React 18** - Framework JavaScript
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Icônes modernes
- **Vite** - Build tool rapide

## 📁 Structure du projet

```
uca-booking-frontend/
├── src/
│   ├── components/       # Composants réutilisables
│   ├── pages/           # Pages de l'application
│   ├── data/            # Données statiques
│   ├── utils/           # Fonctions utilitaires
│   └── App.jsx          # Composant principal
├── public/              # Fichiers statiques
└── package.json         # Dépendances
```

## 🛠️ Installation

### Prérequis
- Node.js 16+ et npm installés

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone [votre-repo]
cd uca-booking-frontend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:5173
```

## 📦 Commandes disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile pour la production
- `npm run preview` - Prévisualise le build de production

## 🎨 Composants principaux

### Header.jsx
En-tête avec logo et bouton de connexion

### HeroSection.jsx
Section héro avec titre et statistiques

### ProtocoleSection.jsx
Étapes du processus de réservation

### LocauxSection.jsx
Liste des locaux avec filtres

### LocalCard.jsx
Carte individuelle pour chaque local

### Footer.jsx
Pied de page avec informations de contact

## 📊 Données

Les données sont stockées dans `src/data/` :
- `sites.js` - Liste des sites universitaires
- `locaux.js` - Liste des locaux disponibles
- `protocole.js` - Étapes du processus de réservation

## 🔌 Intégration Backend

Pour connecter au backend, modifier les appels API dans les composants :

```javascript
// Exemple dans LocauxSection.jsx
import axios from 'axios';

const fetchLocaux = async () => {
  const response = await axios.get('http://localhost:8000/api/locaux');
  setLocaux(response.data);
};
```

## 🎯 Fonctionnalités

✅ Page d'accueil responsive
✅ Affichage des locaux par site
✅ Filtrage dynamique
✅ Recherche en temps réel
✅ Design moderne avec Tailwind CSS
✅ Animations fluides
✅ Mobile-first

## 📝 Prochaines étapes

- [ ] Page de réservation
- [ ] Authentification Google OAuth2
- [ ] Intégration calendrier
- [ ] Dashboard utilisateur
- [ ] Notifications email

## 👥 Auteur

Projet développé pour l'Université Cadi Ayyad

## 📄 Licence

Propriété de l'Université Cadi Ayyad - Tous droits réservés