const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const validate = require('../middleware/validate.middleware');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// All admin routes require authentication and admin role
router.use(verifyToken, isAdmin);

// Reservations management
router.get('/reservations', adminController.getAllReservations);
router.patch('/reservations/:id/validate', adminController.validateReservation);
router.patch('/reservations/:id/refuse', adminController.refuseReservation);
router.delete('/reservations/:id', adminController.cancelReservationAdmin);
router.patch('/reservations/:id', adminController.updateReservation);

// Users management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/toggle-active', adminController.toggleUserActive);

// Blackout dates
router.get('/blackout-dates', adminController.getBlackoutDates);
router.post('/blackout-dates', adminController.createBlackoutDate);
router.delete('/blackout-dates/:id', adminController.deleteBlackoutDate);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);

// Logs
router.get('/logs', adminController.getLogs);

// Export
router.get('/export/reservations', adminController.exportReservations);

module.exports = router;