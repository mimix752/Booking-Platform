// Configuration Google OAuth2 pour UCA Booking
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1007163615453-5unj4d5v8il3rkepi8td194ssqq2b68t.apps.googleusercontent.com";

// Domains autorisés pour UCA
export const ALLOWED_DOMAINS = ['@uca.ma', '@uca.ac.ma'];

// Configuration de l'environnement
export const CONFIG = {
  APP_NAME: 'UCA Booking',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: 'development', // 'development' ou 'production'

  // URLs de l'API (à configurer selon l'environnement)
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    process.env.NODE_ENV === 'production'
      ? 'https://api.uca-booking.ma'
      : 'http://localhost:8000/api'
  ),

  // Configuration des emails
  NOTIFICATION_SETTINGS: {
    SEND_CONFIRMATION_EMAIL: true,
    SEND_REMINDER_EMAIL: true,
    REMINDER_HOURS_BEFORE: 24
  },

  // Configuration des réservations
  RESERVATION_RULES: {
    MAX_RESERVATIONS_PER_USER: 5,
    MAX_DURATION_DAYS: 7,
    CANCELLATION_DEADLINE_HOURS: 12,
    AUTO_APPROVE_SINGLE_DAY: true,
    REQUIRE_ADMIN_APPROVAL_MULTI_DAY: true
  }
};

// Messages d'erreur et de succès
export const MESSAGES = {
  SUCCESS: {
    RESERVATION_CREATED: 'Votre réservation a été créée avec succès',
    RESERVATION_CONFIRMED: 'Réservation confirmée',
    RESERVATION_CANCELLED: 'Réservation annulée',
    LOGIN_SUCCESS: 'Connexion réussie',
    LOGOUT_SUCCESS: 'Déconnexion réussie'
  },

  ERROR: {
    INVALID_EMAIL_DOMAIN: 'Seuls les emails académiques UCA sont autorisés (@uca.ma ou @uca.ac.ma)',
    LOGIN_FAILED: 'Erreur lors de la connexion',
    RESERVATION_CONFLICT: 'Ce créneau est déjà réservé',
    CANCELLATION_TOO_LATE: 'Impossible d\'annuler moins de 12h avant la réservation',
    NETWORK_ERROR: 'Erreur de connexion. Veuillez réessayer.',
    UNAUTHORIZED: 'Accès non autorisé'
  },

  WARNING: {
    CAPACITY_EXCEEDED: 'Le nombre de participants dépasse la capacité du local',
    MULTI_DAY_APPROVAL_REQUIRED: 'Cette réservation nécessite une validation administrative',
    CANCELLATION_WARNING: 'Êtes-vous sûr de vouloir annuler cette réservation ?'
  }
};

// Configuration des sites et leurs couleurs
export const SITE_COLORS = {
  'bibliotheque': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'cite-innovation': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'centre-conferences': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  'presidence': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' }
};

// Types d'événements avec leurs icônes
export const EVENT_TYPES = {
  'reunion': { label: 'Réunion', icon: '👥' },
  'audience': { label: 'Audience officielle', icon: '🏛️' },
  'convention': { label: 'Signature de convention', icon: '📝' },
  'conference': { label: 'Conférence', icon: '🎤' },
  'congres': { label: 'Congrès', icon: '🎯' }
};
