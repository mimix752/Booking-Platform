# Configuration Google OAuth2 pour UCA Booking

## 🔧 Configuration Google Cloud Console

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur "Sélectionner un projet" puis "Nouveau projet"
3. Nommez le projet : "UCA-Booking"
4. Cliquez sur "Créer"

### Étape 2 : Activer l'API Google OAuth2

1. Dans le menu de navigation, allez à "APIs & Services" > "Bibliothèque"
2. Recherchez "Google+ API" et activez-la
3. Recherchez "People API" et activez-la

### Étape 3 : Configurer l'écran de consentement OAuth

1. Allez à "APIs & Services" > "OAuth consent screen"
2. Choisissez "External" (ou "Internal" si vous avez un compte Google Workspace)
3. Remplissez les informations requises :
   - **Nom de l'application** : UCA Booking
   - **Email d'assistance utilisateur** : support@uca.ac.ma
   - **Logo de l'application** : (optionnel)
   - **Domaines autorisés** : uca.ac.ma, uca.ma
   - **Email du développeur** : votre-email@uca.ac.ma

### Étape 4 : Créer les identifiants OAuth2

1. Allez à "APIs & Services" > "Identifiants"
2. Cliquez sur "Créer des identifiants" > "ID client OAuth 2.0"
3. Choisissez "Application Web"
4. Configurez :
   - **Nom** : UCA Booking Web Client
   - **Origines JavaScript autorisées** :
     - `http://localhost:5173` (développement)
     - `https://booking.uca.ac.ma` (production)
   - **URI de redirection autorisées** :
     - `http://localhost:5173` (développement)
     - `https://booking.uca.ac.ma` (production)

5. Cliquez sur "Créer"
6. **Copiez le Client ID** généré

### Étape 5 : Mettre à jour l'application

1. Ouvrez le fichier `src/config/config.js`
2. Remplacez la ligne :
```javascript
export const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
```

Par :
```javascript
export const GOOGLE_CLIENT_ID = "VOTRE_VRAI_CLIENT_ID_ICI";
```

## 🚨 Solution temporaire pour les tests

Si vous ne pouvez pas configurer Google OAuth2 immédiatement, l'application inclut maintenant :

1. **Connexion manuelle** : Cliquez sur "Problème avec Google ? Connexion manuelle"
2. **Fonction Sign Up** : Bouton "S'inscrire" disponible
3. **Validation des domaines** : Seuls les emails @uca.ma et @uca.ac.ma sont acceptés

### Comptes de test disponibles :

- **Personnel** : N'importe quel email @uca.ma (ex: taha@uca.ma)
- **Admin** : admin@uca.ac.ma / 1111111111@

## ⚙️ Configuration avancée (production)

### Variables d'environnement

Créez un fichier `.env` :
```env
VITE_GOOGLE_CLIENT_ID=votre_client_id_réel
VITE_ENVIRONMENT=production
```

### Domaines de production

Pour la production, ajoutez ces domaines dans Google Cloud Console :
- `https://booking.uca.ac.ma`
- `https://www.uca.ac.ma`
- `https://uca.ma`

### Sécurité

1. **Restriction par domaine** : Configurez les domaines autorisés dans Google Cloud
2. **Portée minimale** : L'application ne demande que les informations de base (email, nom, photo)
3. **Validation côté serveur** : Validez toujours les tokens côté serveur en production

## 🆘 Résolution des erreurs courantes

### Erreur 401: invalid_client
- Vérifiez que le Client ID est correct
- Vérifiez que le domaine est autorisé
- Vérifiez que l'API est activée

### Erreur 403: access_denied
- Vérifiez l'écran de consentement OAuth
- Vérifiez que l'email est du bon domaine

### Erreur de redirection
- Vérifiez les URI de redirection dans Google Cloud Console
- Assurez-vous que les URLs correspondent exactement

## 📞 Support

Si vous rencontrez des problèmes :
1. Utilisez la connexion manuelle temporaire
2. Contactez l'équipe technique pour la configuration Google OAuth2
3. Consultez la documentation Google OAuth2

---

**Note** : Cette configuration est nécessaire pour la production. Pour les tests de développement, vous pouvez utiliser la connexion manuelle intégrée.
