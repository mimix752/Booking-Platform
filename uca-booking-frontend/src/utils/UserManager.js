// Système de gestion des utilisateurs sécurisé
export class UserManager {
  constructor() {
    this.initializeDefaultUsers();
  }

  // Initialiser les utilisateurs par défaut
  initializeDefaultUsers() {
    const defaultUsers = {
      'admin@uca.ac.ma': {
        email: 'admin@uca.ac.ma',
        password: this.hashPassword('1111111111@'),
        name: 'Administrateur UCA',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    };

    // Ajouter quelques utilisateurs de test avec des emails valides
    const testUsers = [
      'taha.ghadi@uca.ma',
      'mohamed.alami@uca.ac.ma',
      'fatima.benali@uca.ma',
      'ahmed.idrissi@uca.ac.ma'
    ];

    testUsers.forEach(email => {
      defaultUsers[email] = {
        email: email,
        password: this.hashPassword('123456'), // Mot de passe par défaut pour les tests
        name: email.split('@')[0],
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString()
      };
    });

    // Sauvegarder les utilisateurs par défaut s'ils n'existent pas déjà
    if (!localStorage.getItem('ucaUsers')) {
      localStorage.setItem('ucaUsers', JSON.stringify(defaultUsers));
    }
  }

  // Hash simple du mot de passe (pour la démo - en production, utilisez bcrypt côté serveur)
  hashPassword(password) {
    // Simulation d'un hash - en production, utilisez une vraie fonction de hash
    let hash = 0;
    const salt = 'UCA_BOOKING_SALT_2026';
    const combined = password + salt;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en entier 32-bit
    }

    return Math.abs(hash).toString(16);
  }

  // Vérifier le mot de passe
  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  // Récupérer tous les utilisateurs
  getAllUsers() {
    return JSON.parse(localStorage.getItem('ucaUsers') || '{}');
  }

  // Sauvegarder les utilisateurs
  saveUsers(users) {
    localStorage.setItem('ucaUsers', JSON.stringify(users));
  }

  // Valider le domaine email et les règles UCA
  isValidUCAEmail(email) {
    // Vérifier d'abord les domaines autorisés
    if (!email.endsWith('@uca.ma') && !email.endsWith('@uca.ac.ma')) {
      return {
        isValid: false,
        error: 'Seuls les emails académiques UCA sont autorisés (@uca.ma ou @uca.ac.ma)'
      };
    }

    // Extraire la partie avant le @
    const localPart = email.split('@')[0];

    // Vérifier s'il y a des chiffres dans l'email
    if (/\d/.test(localPart)) {
      return {
        isValid: false,
        error: 'Les emails académiques UCA ne doivent pas contenir de chiffres. Exemple valide: nom.prenom@uca.ma'
      };
    }

    // Vérifier les caractères autorisés (lettres, points, tirets)
    if (!/^[a-zA-Z\.\-]+$/.test(localPart)) {
      return {
        isValid: false,
        error: 'L\'email ne doit contenir que des lettres, des points et des tirets. Exemple: nom.prenom@uca.ma'
      };
    }

    // Vérifier qu'il n'y a pas de points consécutifs
    if (/\.\./.test(localPart)) {
      return {
        isValid: false,
        error: 'L\'email ne peut pas avoir de points consécutifs'
      };
    }

    // Vérifier qu'il ne commence pas ou ne finit pas par un point
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return {
        isValid: false,
        error: 'L\'email ne peut pas commencer ou finir par un point'
      };
    }

    // Vérifier la longueur minimale
    if (localPart.length < 2) {
      return {
        isValid: false,
        error: 'L\'email doit contenir au moins 2 caractères avant le @'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  // Vérifier si l'utilisateur existe
  userExists(email) {
    const users = this.getAllUsers();
    return !!users[email];
  }

  // Connexion utilisateur
  login(email, password) {
    const emailValidation = this.isValidUCAEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    const users = this.getAllUsers();
    const user = users[email];

    if (!user) {
      throw new Error('Utilisateur non trouvé. Veuillez vous inscrire d\'abord ou vérifier votre email.');
    }

    if (!user.isActive) {
      throw new Error('Compte désactivé. Contactez l\'administrateur.');
    }

    if (!this.verifyPassword(password, user.password)) {
      throw new Error('Mot de passe incorrect.');
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date().toISOString();
    users[email] = user;
    this.saveUsers(users);

    return {
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture || null
    };
  }

  // Inscription utilisateur
  register(email, password, name = null) {
    const emailValidation = this.isValidUCAEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const users = this.getAllUsers();

    if (users[email]) {
      throw new Error('Un compte avec cet email existe déjà. Utilisez "Se connecter".');
    }

    // Créer le nouvel utilisateur
    const newUser = {
      email: email,
      password: this.hashPassword(password),
      name: name || email.split('@')[0],
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    users[email] = newUser;
    this.saveUsers(users);

    return {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      picture: null
    };
  }

  // Changer le mot de passe
  changePassword(email, currentPassword, newPassword) {
    const users = this.getAllUsers();
    const user = users[email];

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!this.verifyPassword(currentPassword, user.password)) {
      throw new Error('Mot de passe actuel incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    user.password = this.hashPassword(newPassword);
    user.passwordChangedAt = new Date().toISOString();
    users[email] = user;
    this.saveUsers(users);

    return true;
  }

  // Réinitialiser le mot de passe (admin seulement)
  resetPassword(email, newPassword, adminEmail) {
    const users = this.getAllUsers();
    const admin = users[adminEmail];
    const user = users[email];

    if (!admin || admin.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent réinitialiser les mots de passe');
    }

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    if (newPassword.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    user.password = this.hashPassword(newPassword);
    user.passwordResetAt = new Date().toISOString();
    user.passwordResetBy = adminEmail;
    users[email] = user;
    this.saveUsers(users);

    return true;
  }

  // Désactiver/Activer un utilisateur (admin seulement)
  toggleUserStatus(email, adminEmail) {
    const users = this.getAllUsers();
    const admin = users[adminEmail];
    const user = users[email];

    if (!admin || admin.role !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent modifier le statut des utilisateurs');
    }

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    user.isActive = !user.isActive;
    user.statusChangedAt = new Date().toISOString();
    user.statusChangedBy = adminEmail;
    users[email] = user;
    this.saveUsers(users);

    return user.isActive;
  }

  // Obtenir les statistiques des utilisateurs
  getUserStats() {
    const users = this.getAllUsers();
    const userArray = Object.values(users);

    return {
      total: userArray.length,
      active: userArray.filter(u => u.isActive).length,
      inactive: userArray.filter(u => !u.isActive).length,
      admins: userArray.filter(u => u.role === 'admin').length,
      users: userArray.filter(u => u.role === 'user').length,
      recentRegistrations: userArray.filter(u => {
        const createdAt = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length
    };
  }
}

export const userManager = new UserManager();
