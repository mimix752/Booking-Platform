const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/database');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Vérifier le token JWT
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les infos utilisateur depuis la DB
    const users = await query(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Vérifier si l'utilisateur est admin
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

// Vérifier le token Google OAuth
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    // Vérifier le domaine email
    const allowedDomains = process.env.ALLOWED_DOMAINS.split(',');
    const emailDomain = '@' + payload.email.split('@')[1];

    if (!allowedDomains.includes(emailDomain)) {
      throw new Error('Domaine email non autorisé');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  } catch (error) {
    throw new Error('Token Google invalide: ' + error.message);
  }
};

// Générer un JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Vérifier le nombre de réservations actives
const checkReservationLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const maxReservations = parseInt(process.env.MAX_RESERVATIONS_PER_USER) || 5;

    const activeReservations = await query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? AND statut IN ('en_attente', 'confirmee') 
       AND date_fin >= CURDATE()`,
      [userId]
    );

    if (activeReservations[0].count >= maxReservations) {
      return res.status(400).json({
        success: false,
        message: `Vous avez atteint la limite de ${maxReservations} réservations actives`
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du nombre de réservations'
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyGoogleToken,
  generateToken,
  checkReservationLimit
};