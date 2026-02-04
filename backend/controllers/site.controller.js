const { query } = require('../config/database');
const logger = require('../utils/logger');

// Récupérer tous les sites actifs
exports.getAllSites = async (req, res) => {
  try {
    const sites = await query(
      'SELECT * FROM sites WHERE is_active = TRUE ORDER BY nom ASC'
    );

    res.json({
      success: true,
      data: sites
    });
  } catch (error) {
    logger.error('Erreur getAllSites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sites'
    });
  }
};

// Récupérer un site par ID
exports.getSiteById = async (req, res) => {
  try {
    const { id } = req.params;

    const sites = await query(
      'SELECT * FROM sites WHERE id = ? OR site_id = ?',
      [id, id]
    );

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé'
      });
    }

    res.json({
      success: true,
      data: sites[0]
    });
  } catch (error) {
    logger.error('Erreur getSiteById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du site'
    });
  }
};

// Créer un nouveau site (Admin)
exports.createSite = async (req, res) => {
  try {
    const { site_id, nom, adresse, description } = req.body;

    // Vérifier si le site_id existe déjà
    const existing = await query(
      'SELECT id FROM sites WHERE site_id = ?',
      [site_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Un site avec cet identifiant existe déjà'
      });
    }

    const result = await query(
      'INSERT INTO sites (site_id, nom, adresse, description) VALUES (?, ?, ?, ?)',
      [site_id, nom, adresse, description]
    );

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'site_created',
        'site',
        result.insertId,
        JSON.stringify({ site_id, nom })
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Site créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    logger.error('Erreur createSite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du site'
    });
  }
};

// Mettre à jour un site (Admin)
exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, adresse, description, is_active } = req.body;

    const result = await query(
      `UPDATE sites 
       SET nom = ?, adresse = ?, description = ?, is_active = ?
       WHERE id = ?`,
      [nom, adresse, description, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé'
      });
    }

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'site_updated',
        'site',
        id,
        JSON.stringify({ nom, is_active })
      ]
    );

    res.json({
      success: true,
      message: 'Site mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Erreur updateSite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du site'
    });
  }
};

// Supprimer un site (Admin)
exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des locaux associés
    const locaux = await query(
      'SELECT COUNT(*) as count FROM locaux WHERE site_id = ?',
      [id]
    );

    if (locaux[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un site contenant des locaux'
      });
    }

    const result = await query('DELETE FROM sites WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé'
      });
    }

    // Log de l'action
    await query(
      `INSERT INTO logs (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, 'site_deleted', 'site', id, JSON.stringify({ id })]
    );

    res.json({
      success: true,
      message: 'Site supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteSite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du site'
    });
  }
};

// Récupérer les locaux d'un site
exports.getSiteLocaux = async (req, res) => {
  try {
    const { id } = req.params;

    const locaux = await query(
      `SELECT l.*, s.nom as site_nom 
       FROM locaux l
       JOIN sites s ON l.site_id = s.id
       WHERE (s.id = ? OR s.site_id = ?) AND l.is_active = TRUE
       ORDER BY l.nom ASC`,
      [id, id]
    );

    res.json({
      success: true,
      data: locaux
    });
  } catch (error) {
    logger.error('Erreur getSiteLocaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des locaux'
    });
  }
};