const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const reservationController = require('../controllers/reservation.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { reservationLimiter } = require('../middleware/rateLimiter.middleware');

// Validation rules
const createReservationValidation = [
  body('local_id').isInt().withMessage('ID du local invalide'),
  body('date_debut').isDate().withMessage('Date de début invalide'),
  body('date_fin').isDate().withMessage('Date de fin invalide'),
  body('creneau').isIn(['matin', 'apres-midi', 'journee_complete', 'multi_jours'])
    .withMessage('Créneau invalide'),
  body('nature_evenement').isIn(['reunion', 'audience', 'convention', 'conference', 'congres', 'autre'])
    .withMessage('Nature d\'événement invalide'),
  body('participants').isInt({ min: 1 }).withMessage('Nombre de participants invalide'),
  body('motif').trim().notEmpty().withMessage('Motif requis'),
  body('priorite').optional().isIn(['normal', 'urgent', 'presidence']).withMessage('Priorité invalide')
];

// Routes - Toutes protégées par authentification
router.post(
  '/',
  verifyToken,
  reservationLimiter,
  createReservationValidation,
  validate,
  reservationController.createReservation
);

router.get(
  '/my-reservations',
  verifyToken,
  reservationController.getMyReservations
);

router.get(
  '/:id',
  verifyToken,
  param('id').isInt(),
  validate,
  reservationController.getReservationById
);

router.patch(
  '/:id/cancel',
  verifyToken,
  param('id').isInt(),
  validate,
  reservationController.cancelReservation
);

router.get(
  '/check-availability',
  verifyToken,
  reservationController.checkAvailability
);

module.exports = router;