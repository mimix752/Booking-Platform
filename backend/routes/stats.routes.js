const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// All stats routes require admin access
router.use(verifyToken, isAdmin);

// @route   GET /api/stats/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await query('SELECT * FROM stats_dashboard');

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// @route   GET /api/stats/locaux-populaires
// @desc    Get top 5 most reserved locaux
// @access  Private/Admin
router.get('/locaux-populaires', async (req, res) => {
  try {
    const locaux = await query(`
      SELECT l.id, l.nom, s.name as site_name, COUNT(r.id) as reservations_count
      FROM locaux l
      JOIN sites s ON l.site_id = s.id
      LEFT JOIN reservations r ON l.id = r.local_id 
        AND r.statut = 'confirmee'
        AND r.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
      WHERE l.is_active = TRUE
      GROUP BY l.id
      ORDER BY reservations_count DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: locaux
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des locaux populaires'
    });
  }
});

// @route   GET /api/stats/activite-mensuelle
// @desc    Get monthly reservation activity
// @access  Private/Admin
router.get('/activite-mensuelle', async (req, res) => {
  try {
    const activity = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as mois,
        COUNT(CASE WHEN statut = 'confirmee' THEN 1 END) as confirmees,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
        COUNT(CASE WHEN statut = 'refusee' THEN 1 END) as refusees,
        COUNT(*) as total
      FROM reservations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mois DESC
    `);

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité mensuelle'
    });
  }
});

// @route   GET /api/stats/taux-occupation
// @desc    Get occupation rate by site
// @access  Private/Admin
router.get('/taux-occupation', async (req, res) => {
  try {
    const { date_debut, date_fin } = req.query;

    let sql = `
      SELECT 
        s.id, s.name, s.slug,
        COUNT(DISTINCT l.id) as total_locaux,
        COUNT(r.id) as total_reservations,
        ROUND(COUNT(r.id) / COUNT(DISTINCT l.id), 2) as taux_occupation
      FROM sites s
      JOIN locaux l ON s.id = l.site_id AND l.is_active = TRUE
      LEFT JOIN reservations r ON l.id = r.local_id 
        AND r.statut = 'confirmee'
    `;

    const params = [];

    if (date_debut && date_fin) {
      sql += ' AND r.date_debut >= ? AND r.date_fin <= ?';
      params.push(date_debut, date_fin);
    } else {
      sql += ' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }

    sql += ' WHERE s.is_active = TRUE GROUP BY s.id';

    const occupation = await query(sql, params);

    res.status(200).json({
      success: true,
      data: occupation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du taux d\'occupation'
    });
  }
});

module.exports = router;