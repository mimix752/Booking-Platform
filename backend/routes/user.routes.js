const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth.middleware');

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const users = await query(`
      SELECT id, name, email, picture, fonction, role, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// @route   PATCH /api/users/me
// @desc    Update current user profile
// @access  Private
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { fonction } = req.body;
    
    if (!fonction) {
      return res.status(400).json({
        success: false,
        message: 'Fonction requise'
      });
    }

    await query('UPDATE users SET fonction = ? WHERE id = ?', [fonction, req.user.id]);

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

module.exports = router;