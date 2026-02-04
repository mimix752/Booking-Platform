const { query, transaction } = require('../config/database');
const { 
  isSlotAvailable, 
  isBlackoutDate, 
  canCancelReservation,
  requiresAdminValidation 
} = require('../services/validation.service');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

// Créer une réservation
exports.createReservation = async (req, res) => {
  try {
    const {
      local_id,
      date_debut,
      date_fin,
      creneau,
      nature_evenement,
      participants_estimes,
      motif
    } = req.body;

    const userId = req.user.id;

    // Vérifier si c'est un jour blackout
    const isBlackout = await isBlackoutDate(date_debut);
    if (isBlackout) {
      return res.status(400).json({
        success: false,
        message: 'Cette date n\'est pas disponible pour les réservations'
      });
    }

    // Vérifier la disponibilité
    const available = await isSlotAvailable(local_id, date_debut, date_fin, creneau);
    if (!available) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau est déjà réservé'
      });
    }

    // Déterminer le statut initial
    const needsValidation = requiresAdminValidation(date_debut, date_fin, nature_evenement);
    const statut = needsValidation ? 'en_attente' : 'confirmee';

    // Créer la réservation
    const result = await query(
      `INSERT INTO reservations 
       (user_id, local_id, date_debut, date_fin, creneau, nature_evenement, participants_estimes, motif, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, local_id, date_debut, date_fin, creneau, nature_evenement, participants_estimes, motif, statut]
    );

    const reservationId = result.insertId;

    // Récupérer les détails pour l'email
    const [reservation] = await query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    const [local] = await query('SELECT * FROM locaux WHERE id = ?', [local_id]);
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);

    // Envoyer l'email de confirmation
    await emailService.sendReservationCreated(reservation, local, user);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        'reservation_created',
        'reservation',
        reservationId,
        JSON.stringify({ local_id, date_debut, statut })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: {
        id: reservationId,
        statut,
        needsValidation
      }
    });
  } catch (error) {
    logger.error('Erreur createReservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réservation'
    });
  }
};

// Récupérer mes réservations
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming } = req.query;

    let sql = `
      SELECT 
        r.*,
        l.nom as local_nom,
        l.capacite,
        s.nom as site_nom,
        s.site_id as site_identifier
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN sites s ON l.site_id = s.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ' AND r.statut = ?';
      params.push(status);
    }

    if (upcoming === 'true') {
      sql += ' AND r.date_fin >= CURDATE()';
    }

    sql += ' ORDER BY r.date_debut DESC';

    const reservations = await query(sql, params);

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    logger.error('Erreur getMyReservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réservations'
    });
  }
};

// Récupérer une réservation par ID
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let sql = `
      SELECT 
        r.*,
        l.nom as local_nom,
        l.capacite,
        s.nom as site_nom,
        s.site_id as site_identifier,
        u.name as user_name,
        u.email as user_email,
        u.fonction
      FROM reservations r
      JOIN locaux l ON r.local_id = l.id
      JOIN sites s ON l.site_id = s.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `;
    const params = [id];

    if (!isAdmin) {
      sql += ' AND r.user_id = ?';
      params.push(userId);
    }

    const reservations = await query(sql, params);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    res.json({
      success: true,
      data: reservations[0]
    });
  } catch (error) {
    logger.error('Erreur getReservationById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réservation'
    });
  }
};

// Annuler une réservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    const userId = req.user.id;

    // Récupérer la réservation
    const reservations = await query(
      'SELECT * FROM reservations WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = reservations[0];

    // Vérifier si elle est annulable
    if (!['en_attente', 'confirmee'].includes(reservation.statut)) {
      return res.status(400).json({
        success: false,
        message: 'Cette réservation ne peut pas être annulée'
      });
    }

    // Vérifier le délai de 12h
    if (!canCancelReservation(reservation.date_debut, reservation.creneau)) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler moins de 12h avant le début'
      });
    }

    // Annuler la réservation
    await query(
      `UPDATE reservations 
       SET statut = 'annulee_utilisateur', 
           cancelled_by = ?, 
           cancelled_at = NOW(),
           cancellation_reason = ?
       WHERE id = ?`,
      [userId, cancellation_reason, id]
    );

    // Récupérer les détails pour l'email
    const [local] = await query('SELECT * FROM locaux WHERE id = ?', [reservation.local_id]);
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);

    // Envoyer l'email d'annulation
    await emailService.sendReservationCancelled(reservation, local, user);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        'reservation_cancelled_user',
        'reservation',
        id,
        JSON.stringify({ reason: cancellation_reason })
      ]
    );

    res.json({
      success: true,
      message: 'Réservation annulée avec succès'
    });
  } catch (error) {
    logger.error('Erreur cancelReservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la réservation'
    });
  }
};

// Modifier une réservation (Admin)
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_debut,
      date_fin,
      creneau,
      participants_estimes,
      motif,
      priorite
    } = req.body;

    // Vérifier la disponibilité pour les nouvelles dates
    const [reservation] = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const available = await isSlotAvailable(
      reservation.local_id,
      date_debut,
      date_fin,
      creneau,
      id // Exclure cette réservation de la vérification
    );

    if (!available) {
      return res.status(400).json({
        success: false,
        message: 'Ce nouveau créneau n\'est pas disponible'
      });
    }

    await query(
      `UPDATE reservations 
       SET date_debut = ?, date_fin = ?, creneau = ?, 
           participants_estimes = ?, motif = ?, priorite = ?
       WHERE id = ?`,
      [date_debut, date_fin, creneau, participants_estimes, motif, priorite, id]
    );

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'reservation_updated',
        'reservation',
        id,
        JSON.stringify({ date_debut, date_fin, creneau })
      ]
    );

    res.json({
      success: true,
      message: 'Réservation modifiée avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateReservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la réservation'
    });
  }
};