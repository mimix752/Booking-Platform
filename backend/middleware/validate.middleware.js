const { body, param, query, validationResult } = require('express-validator');

// Middleware pour vérifier les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// Validations pour les réservations
const validateReservation = [
  body('local_id')
    .isInt({ min: 1 })
    .withMessage('ID du local invalide'),
  
  body('date_debut')
    .isDate()
    .withMessage('Date de début invalide')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('La date de début ne peut pas être dans le passé');
      }
      return true;
    }),
  
  body('date_fin')
    .isDate()
    .withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      const dateDebut = new Date(req.body.date_debut);
      const dateFin = new Date(value);
      if (dateFin < dateDebut) {
        throw new Error('La date de fin doit être après la date de début');
      }
      
      // Vérifier la durée maximale
      const maxDays = parseInt(process.env.MAX_DURATION_DAYS) || 7;
      const diffTime = Math.abs(dateFin - dateDebut);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > maxDays) {
        throw new Error(`La durée maximale est de ${maxDays} jours`);
      }
      
      return true;
    }),
  
  body('creneau')
    .isIn(['matin', 'apres-midi', 'journee-complete'])
    .withMessage('Créneau invalide'),
  
  body('nature_evenement')
    .isIn(['reunion', 'audience', 'convention', 'conference', 'congres'])
    .withMessage('Nature d\'événement invalide'),
  
  body('participants_estimes')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Nombre de participants invalide'),
  
  body('motif')
    .notEmpty()
    .withMessage('Le motif est obligatoire')
    .isLength({ min: 10, max: 500 })
    .withMessage('Le motif doit contenir entre 10 et 500 caractères'),
  
  handleValidationErrors
];

// Validations pour l'annulation
const validateCancellation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de réservation invalide'),
  
  body('cancellation_reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La raison ne doit pas dépasser 500 caractères'),
  
  handleValidationErrors
];

// Validations pour la création d'un local
const validateLocal = [
  body('site_id')
    .isInt({ min: 1 })
    .withMessage('ID du site invalide'),
  
  body('nom')
    .notEmpty()
    .withMessage('Le nom est obligatoire')
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères'),
  
  body('capacite')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacité invalide'),
  
  body('equipements')
    .isArray()
    .withMessage('Les équipements doivent être un tableau'),
  
  body('statut')
    .optional()
    .isIn(['disponible', 'occupé', 'maintenance'])
    .withMessage('Statut invalide'),
  
  handleValidationErrors
];

// Validations pour la création d'un site
const validateSite = [
  body('site_id')
    .notEmpty()
    .withMessage('L\'identifiant du site est obligatoire')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('L\'identifiant ne doit contenir que des lettres minuscules, chiffres et tirets'),
  
  body('nom')
    .notEmpty()
    .withMessage('Le nom est obligatoire')
    .isLength({ min: 3, max: 255 })
    .withMessage('Le nom doit contenir entre 3 et 255 caractères'),
  
  handleValidationErrors
];

// Validations pour la mise à jour du statut de réservation
const validateReservationStatus = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID de réservation invalide'),
  
  body('statut')
    .isIn(['confirmee', 'refusee', 'annulee_admin'])
    .withMessage('Statut invalide'),
  
  body('commentaire_admin')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Le commentaire ne doit pas dépasser 1000 caractères'),
  
  handleValidationErrors
];

// Validations pour les blackout dates
const validateBlackoutDate = [
  body('date')
    .isDate()
    .withMessage('Date invalide'),
  
  body('raison')
    .notEmpty()
    .withMessage('La raison est obligatoire')
    .isLength({ max: 255 })
    .withMessage('La raison ne doit pas dépasser 255 caractères'),
  
  handleValidationErrors
];

// Validations pour les paramètres de pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (max 100)'),
  
  handleValidationErrors
];

// Validations pour les filtres de recherche
const validateSearchFilters = [
  query('site_id')
    .optional()
    .isString()
    .withMessage('ID de site invalide'),
  
  query('statut')
    .optional()
    .isIn(['disponible', 'occupé', 'maintenance'])
    .withMessage('Statut invalide'),
  
  query('date_debut')
    .optional()
    .isDate()
    .withMessage('Date de début invalide'),
  
  query('date_fin')
    .optional()
    .isDate()
    .withMessage('Date de fin invalide'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateReservation,
  validateCancellation,
  validateLocal,
  validateSite,
  validateReservationStatus,
  validateBlackoutDate,
  validatePagination,
  validateSearchFilters
};