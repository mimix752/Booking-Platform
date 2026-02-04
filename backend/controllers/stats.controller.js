const { query } = require('../config/database');
const logger = require('../utils/logger');

// Dashboard KPIs
exports.getDashboardKPIs = async (req, res) => {
  try {
    // Total des réservations
    const totalReservations = await query(
      'SELECT COUNT(*) as count FROM reservations'
    );

    // Réservations confirmées
    const confirmedReservations = await query(
      "SELECT COUNT(*) as count FROM reservations WHERE statut = 'confirmee'"
    );

    // Réservations en attente
    const pendingReservations = await query(
      "SELECT COUNT(*) as count FROM reservations WHERE statut = 'en_attente'"
    );

    // Réservations annulées
    const cancelledReservations = await query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE statut IN ('annulee_utilisateur', 'annulee_admin')`
    );

    // Total des locaux
    const totalLocaux = await query(
      'SELECT COUNT(*) as count FROM locaux WHERE is_active = TRUE'
    );

    // Total des utilisateurs
    const totalUsers = await query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = TRUE'
    );

    // Taux d'occupation global
    const occupancyRate = await query(`
      SELECT 
        ROUND(
          (COUNT(CASE WHEN statut = 'confirmee' THEN 1 END) * 100.0) / 
          NULLIF(COUNT(*), 0), 
          2
        ) as rate
      FROM reservations
      WHERE date_debut >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    res.json({
      success: true,
      data: {
        totalReservations: totalReservations[0].count,
        confirmedReservations: confirmedReservations[0].count,
        pendingReservations: pendingReservations[0].count,
        cancelledReservations: cancelledReservations[0].count,
        totalLocaux: totalLocaux[0].count,
        totalUsers: totalUsers[0].count,
        occupancyRate: occupancyRate[0].rate || 0
      }
    });
  } catch (error) {
    logger.error('Erreur getDashboardKPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des KPIs'
    });
  }
};

// Top 5 des locaux les plus réservés
exports.getTopLocaux = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topLocaux = await query(`
      SELECT 
        l.id,
        l.nom,
        s.nom as site_nom,
        COUNT(r.id) as total_reservations,
        SUM(CASE WHEN r.statut = 'confirmee' THEN 1 ELSE 0 END) as confirmed_count
      FROM locaux l
      LEFT JOIN sites s ON l.site_id = s.id
      LEFT JOIN reservations r ON l.id = r.local_id
      WHERE l.is_active = TRUE
      GROUP BY l.id, l.nom, s.nom
      ORDER BY total_reservations DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: topLocaux
    });
  } catch (error) {
    logger.error('Erreur getTopLocaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des locaux populaires'
    });
  }
};

// Répartition des réservations par statut
exports.getReservationsByStatus = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM reservations
      GROUP BY statut
    `);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Erreur getReservationsByStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Activité mensuelle des réservations
exports.getMonthlyActivity = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const activity = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as pending
      FROM reservations
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `, [parseInt(months)]);

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    logger.error('Erreur getMonthlyActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'activité mensuelle'
    });
  }
};

// Statistiques par site
exports.getStatsBySite = async (req, res) => {
  try {
    const statsBySite = await query(`
      SELECT 
        s.id,
        s.nom as site_nom,
        COUNT(DISTINCT l.id) as total_locaux,
        COUNT(r.id) as total_reservations,
        SUM(CASE WHEN r.statut = 'confirmee' THEN 1 ELSE 0 END) as confirmed_reservations,
        ROUND(AVG(r.participants_estimes), 0) as avg_participants
      FROM sites s
      LEFT JOIN locaux l ON s.id = l.site_id
      LEFT JOIN reservations r ON l.id = r.local_id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.nom
      ORDER BY total_reservations DESC
    `);

    res.json({
      success: true,
      data: statsBySite
    });
  } catch (error) {
    logger.error('Erreur getStatsBySite:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques par site'
    });
  }
};

// Taux d'occupation par local
exports.getOccupancyRates = async (req, res) => {
  try {
    const occupancy = await query(`
      SELECT * FROM v_stats_locaux
      ORDER BY taux_confirmation DESC
    `);

    res.json({
      success: true,
      data: occupancy
    });
  } catch (error) {
    logger.error('Erreur getOccupancyRates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des taux d\'occupation'
    });
  }
};

// Statistiques utilisateur
exports.getUserStats = async (req, res) => {
  try {
    const userStats = await query(`
      SELECT * FROM v_user_history
      ORDER BY total_reservations DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: userStats
    });
  } catch (error) {
    logger.error('Erreur getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques utilisateurs'
    });
  }
};

// Export des données (CSV)
exports.exportReservations = async (req, res) => {
  try {
    const { startDate, endDate, status, siteId } = req.query;

    let sql = `
      SELECT 
        r.id,
        u.name as utilisateur,
        u.email,
        l.nom as local,
        s.nom as site,
        r.date_debut,
        r.date_fin,
        r.creneau,
        r.nature_evenement,
        r.participants_estimes,
        r.statut,
        r.created_at
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN locaux l ON r.local_id = l.id
      JOIN sites s ON l.site_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (startDate) {
      sql += ' AND r.date_debut >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND r.date_fin <= ?';
      params.push(endDate);
    }

    if (status) {
      sql += ' AND r.statut = ?';
      params.push(status);
    }

    if (siteId) {
      sql += ' AND s.id = ?';
      params.push(siteId);
    }

    sql += ' ORDER BY r.created_at DESC';

    const data = await query(sql, params);

    // Convertir en CSV
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnée à exporter'
      });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=reservations.csv');
    res.send(csv);
  } catch (error) {
    logger.error('Erreur exportReservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données'
    });
  }
};