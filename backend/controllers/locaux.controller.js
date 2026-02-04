const { query } = require('../config/database');
const logger = require('../utils/logger');

// Récupérer tous les locaux actifs
exports.getAllLocaux = async (req, res) => {
  try {
    const { site_id, capacite_min, statut } = req.query;

    let sql = `
      SELECT l.*, s.nom as site_nom, s.site_id as site_identifier
      FROM locaux l
      JOIN sites s ON l.site_id = s.id
      WHERE l.is_active = TRUE
    `;
    const params = [];

    if (site_id) {
      sql += ' AND (s.id = ? OR s.site_id = ?)';
      params.push(site_id, site_id);
    }

    if (capacite_min) {
      sql += ' AND l.capacite >= ?';
      params.push(parseInt(capacite_min));
    }

    if (statut) {
      sql += ' AND l.statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY s.nom, l.nom ASC';

    const locaux = await query(sql, params);

    res.json({
      success: true,
      data: locaux
    });
  } catch (error) {
    logger.error('Erreur getAllLocaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des locaux'
    });
  }
};

// Récupérer un local par ID
exports.getLocalById = async (req, res) => {
  try {
    const { id } = req.params;

    const locaux = await query(
      `SELECT l.*, s.nom as site_nom, s.site_id as site_identifier
       FROM locaux l
       JOIN sites s ON l.site_id = s.id
       WHERE l.id = ?`,
      [id]
    );

    if (locaux.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Local non trouvé'
      });
    }

    res.json({
      success: true,
      data: locaux[0]
    });
  } catch (error) {
    logger.error('Erreur getLocalById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du local'
    });
  }
};

// Vérifier la disponibilité d'un local
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_debut, date_fin, creneau } = req.query;

    if (!date_debut || !date_fin || !creneau) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants'
      });
    }

    // Vérifier les conflits
    const conflicts = await query(
      `SELECT COUNT(*) as conflict_count
       FROM reservations
       WHERE local_id = ?
         AND statut IN ('confirmee', 'en_attente')
         AND date_debut <= ?
         AND date_fin >= ?
         AND (creneau = ? OR creneau = 'journee-complete' OR ? = 'journee-complete')`,
      [id, date_fin, date_debut, creneau, creneau]
    );

    const isAvailable = conflicts[0].conflict_count === 0;

    res.json({
      success: true,
      data: {
        available: isAvailable,
        conflicts: conflicts[0].conflict_count
      }
    });
  } catch (error) {
    logger.error('Erreur checkAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de disponibilité'
    });
  }
};

// Récupérer le calendrier d'un local
exports.getLocalCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let sql = `
      SELECT 
        r.id,
        r.date_debut,
        r.date_fin,
        r.creneau,
        r.statut,
        r.nature_evenement,
        u.name as user_name,
        u.fonction
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      WHERE r.local_id = ?
        AND r.statut IN ('confirmee', 'en_attente')
    `;
    const params = [id];

    if (start_date) {
      sql += ' AND r.date_fin >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND r.date_debut <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY r.date_debut ASC';

    const reservations = await query(sql, params);

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    logger.error('Erreur getLocalCalendar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du calendrier'
    });
  }
};

// Créer un local (Admin)
exports.createLocal = async (req, res) => {
  try {
    const {
      site_id,
      nom,
      capacite,
      equipements,
      statut,
      contraintes,
      description,
      image_url
    } = req.body;

    const result = await query(
      `INSERT INTO locaux (site_id, nom, capacite, equipements, statut, contraintes, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        site_id,
        nom,
        capacite,
        JSON.stringify(equipements),
        statut || 'disponible',
        contraintes,
        description,
        image_url
      ]
    );

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'local_created',
        'local',
        result.insertId,
        JSON.stringify({ nom, site_id, capacite })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Local créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    logger.error('Erreur createLocal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du local'
    });
  }
};

// Mettre à jour un local (Admin)
exports.updateLocal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      capacite,
      equipements,
      statut,
      contraintes,
      description,
      image_url,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE locaux 
       SET nom = ?, capacite = ?, equipements = ?, statut = ?, 
           contraintes = ?, description = ?, image_url = ?, is_active = ?
       WHERE id = ?`,
      [
        nom,
        capacite,
        JSON.stringify(equipements),
        statut,
        contraintes,
        description,
        image_url,
        is_active,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Local non trouvé'
      });
    }

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'local_updated',
        'local',
        id,
        JSON.stringify({ nom, statut })
      ]
    );

    res.json({
      success: true,
      message: 'Local mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateLocal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du local'
    });
  }
};

// Mettre un local en maintenance (Admin)
exports.setMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { maintenance } = req.body;

    const newStatus = maintenance ? 'maintenance' : 'disponible';

    await query('UPDATE locaux SET statut = ? WHERE id = ?', [newStatus, id]);

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        maintenance ? 'local_maintenance_on' : 'local_maintenance_off',
        'local',
        id,
        JSON.stringify({ statut: newStatus })
      ]
    );

    res.json({
      success: true,
      message: `Local ${maintenance ? 'mis en maintenance' : 'remis en service'}`
    });
  } catch (error) {
    logger.error('Erreur setMaintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
};

// Supprimer un local (Admin)
exports.deleteLocal = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des réservations futures
    const futureReservations = await query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE local_id = ? AND statut IN ('confirmee', 'en_attente') AND date_fin >= CURDATE()`,
      [id]
    );

    if (futureReservations[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un local avec des réservations futures'
      });
    }

    const result = await query('DELETE FROM locaux WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Local non trouvé'
      });
    }

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, 'local_deleted', 'local', id, JSON.stringify({ id })]
    );

    res.json({
      success: true,
      message: 'Local supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteLocal:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du local'
    });
  }
};