const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

// @route   GET /api/admin/reservations
// @desc    Get all reservations (Admin)
// @access  Private/Admin
exports.getAllReservations = async (req, res) => {
  try {
    const { statut, site_id, date_debut, date_fin, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT r.*, 
             l.nom as local_nom, l.capacite as local_capacite,
             s.name as site_name, s.slug as site_slug,
             u.name as user_name, u.email as user_email, u.fonction,
             validator.name as validated_by_name
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN sites s ON l.site_id = s.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users validator ON r.validated_by = validator.id
      WHERE 1=1
    `;
    
    const params = [];

    if (statut) {
      sql += ' AND r.statut = ?';
      params.push(statut);
    }

    if (site_id) {
      sql += ' AND l.site_id = ?';
      params.push(site_id);
    }

    if (date_debut) {
      sql += ' AND r.date_debut >= ?';
      params.push(date_debut);
    }

    if (date_fin) {
      sql += ' AND r.date_fin <= ?';
      params.push(date_fin);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const reservations = await query(sql, params);

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total 
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      WHERE 1=1
    `;
    const countParams = [];

    if (statut) {
      countSql += ' AND r.statut = ?';
      countParams.push(statut);
    }

    if (site_id) {
      countSql += ' AND l.site_id = ?';
      countParams.push(site_id);
    }

    if (date_debut) {
      countSql += ' AND r.date_debut >= ?';
      countParams.push(date_debut);
    }

    if (date_fin) {
      countSql += ' AND r.date_fin <= ?';
      countParams.push(date_fin);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get all reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
};

// @route   PATCH /api/admin/reservations/:id/validate
// @desc    Validate reservation (Admin)
// @access  Private/Admin
exports.validateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const adminId = req.user.id;

    // Get reservation with user details
    const reservations = await query(`
      SELECT r.*, 
             l.nom as local_nom,
             u.name as user_name, u.email as user_email
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = reservations[0];

    if (reservation.statut === 'confirmee') {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation est déjà confirmée'
      });
    }

    // Update reservation
    await transaction(async (connection) => {
      await connection.execute(`
        UPDATE reservations 
        SET statut = 'confirmee', 
            validated_by = ?, 
            validated_at = NOW(),
            commentaire_admin = ?
        WHERE id = ?
      `, [adminId, commentaire || null, id]);

      // Log action
      await connection.execute(`
        INSERT INTO logs (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES (?, 'VALIDATE', 'reservation', ?, ?, ?)
      `, [adminId, id, JSON.stringify({ statut: reservation.statut }), JSON.stringify({ statut: 'confirmee', commentaire })]);
    });

    // Send email
    try {
      const local = { nom: reservation.local_nom };
      const user = { name: reservation.user_name, email: reservation.user_email };
      await emailService.sendReservationConfirmed(reservation, local, user, commentaire);
    } catch (emailError) {
      logger.error('Failed to send validation email:', emailError);
    }

    logger.info(`Reservation validated: ${id} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Réservation validée avec succès'
    });
  } catch (error) {
    logger.error('Validate reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation de la réservation'
    });
  }
};

// @route   PATCH /api/admin/reservations/:id/refuse
// @desc    Refuse reservation (Admin)
// @access  Private/Admin
exports.refuseReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentaire } = req.body;
    const adminId = req.user.id;

    if (!commentaire) {
      return res.status(400).json({
        success: false,
        message: 'Un commentaire est requis pour refuser une réservation'
      });
    }

    // Get reservation
    const reservations = await query(`
      SELECT r.*, 
             l.nom as local_nom,
             u.name as user_name, u.email as user_email
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = reservations[0];

    // Update reservation
    await transaction(async (connection) => {
      await connection.execute(`
        UPDATE reservations 
        SET statut = 'refusee',
            validated_by = ?,
            validated_at = NOW(),
            commentaire_admin = ?
        WHERE id = ?
      `, [adminId, commentaire, id]);

      // Log action
      await connection.execute(`
        INSERT INTO logs (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES (?, 'REFUSE', 'reservation', ?, ?, ?)
      `, [adminId, id, JSON.stringify({ statut: reservation.statut }), JSON.stringify({ statut: 'refusee', commentaire })]);
    });

    // Send email
    try {
      const local = { nom: reservation.local_nom };
      const user = { name: reservation.user_name, email: reservation.user_email };
      await emailService.sendReservationRefused(reservation, local, user, commentaire);
    } catch (emailError) {
      logger.error('Failed to send refusal email:', emailError);
    }

    logger.info(`Reservation refused: ${id} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Réservation refusée'
    });
  } catch (error) {
    logger.error('Refuse reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du refus de la réservation'
    });
  }
};

// @route   DELETE /api/admin/reservations/:id
// @desc    Cancel reservation (Admin)
// @access  Private/Admin
exports.cancelReservationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const reservations = await query(`
      SELECT r.*, 
             l.nom as local_nom,
             u.name as user_name, u.email as user_email
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = reservations[0];

    await transaction(async (connection) => {
      await connection.execute(
        'UPDATE reservations SET statut = ?, validated_by = ?, validated_at = NOW() WHERE id = ?',
        ['annulee_admin', adminId, id]
      );

      await connection.execute(`
        INSERT INTO logs (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES (?, 'CANCEL_ADMIN', 'reservation', ?, ?, ?)
      `, [adminId, id, JSON.stringify({ statut: reservation.statut }), JSON.stringify({ statut: 'annulee_admin' })]);
    });

    // Send email
    try {
      const local = { nom: reservation.local_nom };
      const user = { name: reservation.user_name, email: reservation.user_email };
      await emailService.sendReservationCancelled(reservation, local, user);
    } catch (emailError) {
      logger.error('Failed to send cancellation email:', emailError);
    }

    logger.info(`Reservation cancelled by admin: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Réservation annulée'
    });
  } catch (error) {
    logger.error('Cancel reservation admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation'
    });
  }
};

// @route   PATCH /api/admin/reservations/:id
// @desc    Update reservation (Admin)
// @access  Private/Admin
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const adminId = req.user.id;

    // Get current reservation
    const current = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    // Build update query
    const fields = [];
    const values = [];

    const allowedFields = ['date_debut', 'date_fin', 'creneau', 'participants', 'motif', 'priorite', 'commentaire_admin'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune mise à jour fournie'
      });
    }

    values.push(id);
    await query(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`, values);

    // Log action
    await query(`
      INSERT INTO logs (user_id, action, entity_type, entity_id, old_value, new_value)
      VALUES (?, 'UPDATE_ADMIN', 'reservation', ?, ?, ?)
    `, [adminId, id, JSON.stringify(current[0]), JSON.stringify(updates)]);

    logger.info(`Reservation updated by admin: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Réservation mise à jour'
    });
  } catch (error) {
    logger.error('Update reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users (Admin)
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, name, email, fonction, role, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = await query(sql, params);

    // Get total
    let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (role) {
      countSql += ' AND role = ?';
      countParams.push(role);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// Additional admin methods for blackout dates, settings, logs, export...
// (Similar pattern to above)

module.exports = exports;