const { query } = require('../config/database');
const logger = require('../utils/logger');

// Récupérer tous les utilisateurs (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = await query(sql, params);

    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (role) {
      countSql += ' AND role = ?';
      countParams.push(role);
    }

    if (search) {
      countSql += ' AND (name LIKE ? OR email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [{ total }] = await query(countSql, countParams);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Erreur getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// Récupérer le profil utilisateur
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await query(
      'SELECT id, google_id, email, name, picture, fonction, role, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    logger.error('Erreur getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// Mettre à jour le profil utilisateur
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fonction } = req.body;

    await query(
      'UPDATE users SET fonction = ? WHERE id = ?',
      [fonction, userId]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// Mettre à jour le rôle d'un utilisateur (Admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'user_role_updated',
        'user',
        id,
        JSON.stringify({ new_role: role })
      ]
    );

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rôle'
    });
  }
};

// Désactiver/Activer un utilisateur (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await query('SELECT is_active FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const newStatus = !users[0].is_active;

    await query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        newStatus ? 'user_activated' : 'user_deactivated',
        'user',
        id,
        JSON.stringify({ is_active: newStatus })
      ]
    );

    res.json({
      success: true,
      message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès`
    });
  } catch (error) {
    logger.error('Erreur toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
};

// Récupérer l'historique d'un utilisateur
exports.getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await query(`
      SELECT 
        r.*,
        l.nom as local_nom,
        s.nom as site_nom
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN sites s ON l.site_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `, [id]);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Erreur getUserHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// Supprimer un utilisateur (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur a des réservations actives
    const activeReservations = await query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE user_id = ? AND statut IN ('en_attente', 'confirmee') AND date_fin >= CURDATE()`,
      [id]
    );

    if (activeReservations[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un utilisateur avec des réservations actives'
      });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, 'user_deleted', 'user', id, JSON.stringify({ id })]
    );

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};