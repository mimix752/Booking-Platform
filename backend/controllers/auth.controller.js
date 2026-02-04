const { query } = require('../config/database');
const { verifyGoogleToken, generateToken } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

// Connexion avec Google OAuth
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token Google manquant'
      });
    }

    // Vérifier le token Google
    const googleUser = await verifyGoogleToken(token);

    // Vérifier si l'utilisateur existe déjà
    let users = await query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleUser.googleId, googleUser.email]
    );

    let user;

    if (users.length === 0) {
      // Créer un nouvel utilisateur
      const result = await query(
        `INSERT INTO users (google_id, email, name, picture, role, is_active)
         VALUES (?, ?, ?, ?, 'user', TRUE)`,
        [googleUser.googleId, googleUser.email, googleUser.name, googleUser.picture]
      );

      user = {
        id: result.insertId,
        google_id: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role: 'user',
        is_active: true
      };

      logger.info(`Nouvel utilisateur créé: ${googleUser.email}`);
    } else {
      user = users[0];

      // Vérifier si le compte est actif
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Votre compte a été désactivé. Contactez l\'administrateur.'
        });
      }

      // Mettre à jour la dernière connexion
      await query(
        'UPDATE users SET last_login = NOW(), picture = ? WHERE id = ?',
        [googleUser.picture, user.id]
      );
    }

    // Générer un JWT
    const jwtToken = generateToken(user.id, user.role);

    // Log de connexion
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, 'user_login', 'user', ?, ?, ?)`,
      [user.id, user.id, JSON.stringify({ email: user.email }), req.ip]
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          fonction: user.fonction
        }
      }
    });
  } catch (error) {
    logger.error('Erreur googleLogin:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Erreur lors de l\'authentification'
    });
  }
};

// Vérifier le token JWT
exports.verifyToken = async (req, res) => {
  try {
    // Le middleware verifyToken a déjà validé le token
    // req.user contient les infos utilisateur

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.picture,
        role: req.user.role,
        fonction: req.user.fonction
      }
    });
  } catch (error) {
    logger.error('Erreur verifyToken:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Déconnexion
exports.logout = async (req, res) => {
  try {
    // Log de déconnexion
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, 'user_logout', 'user', ?, ?)`,
      [req.user.id, req.user.id, JSON.stringify({ email: req.user.email })]
    );

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    logger.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

// Rafraîchir le token
exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si l'utilisateur existe toujours et est actif
    const users = await query(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    const user = users[0];

    // Générer un nouveau token
    const newToken = generateToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          fonction: user.fonction
        }
      }
    });
  } catch (error) {
    logger.error('Erreur refreshToken:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rafraîchissement du token'
    });
  }
};