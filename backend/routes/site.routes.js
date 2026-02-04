const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// @route   GET /api/sites
// @desc    Get all active sites
// @access  Public
router.get('/', async (req, res) => {
  try {
    const sites = await query(`
      SELECT id, slug, name, description, address
      FROM sites 
      WHERE is_active = TRUE
      ORDER BY name
    `);

    res.status(200).json({
      success: true,
      data: sites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sites'
    });
  }
});

// @route   GET /api/sites/:id
// @desc    Get site by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sites = await query('SELECT * FROM sites WHERE id = ? AND is_active = TRUE', [id]);

    if (sites.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: sites[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du site'
    });
  }
});

module.exports = router;