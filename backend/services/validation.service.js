const { query } = require('../config/database');

// Vérifier si un créneau est disponible
const isSlotAvailable = async (localId, dateDebut, dateFin, creneau, reservationId = null) => {
  try {
    const sql = `
      SELECT COUNT(*) as conflict_count
      FROM reservations
      WHERE local_id = ?
        AND statut IN ('confirmee', 'en_attente')
        AND (id != ? OR ? IS NULL)
        AND date_debut <= ?
        AND date_fin >= ?
        AND (creneau = ? OR creneau = 'journee-complete' OR ? = 'journee-complete')
    `;

    const results = await query(sql, [
      localId,
      reservationId,
      reservationId,
      dateFin,
      dateDebut,
      creneau,
      creneau
    ]);

    return results[0].conflict_count === 0;
  } catch (error) {
    throw new Error('Erreur lors de la vérification de disponibilité: ' + error.message);
  }
};

// Vérifier si une date est un jour blackout
const isBlackoutDate = async (date) => {
  try {
    const results = await query(
      'SELECT COUNT(*) as count FROM blackout_dates WHERE date = ?',
      [date]
    );
    return results[0].count > 0;
  } catch (error) {
    throw new Error('Erreur lors de la vérification des jours bloqués: ' + error.message);
  }
};

// Vérifier si l'annulation est autorisée (12h avant)
const canCancelReservation = (dateDebut, creneau) => {
  const now = new Date();
  const reservationDate = new Date(dateDebut);
  
  // Ajuster l'heure selon le créneau
  if (creneau === 'matin') {
    reservationDate.setHours(8, 0, 0, 0);
  } else if (creneau === 'apres-midi') {
    reservationDate.setHours(14, 0, 0, 0);
  } else {
    reservationDate.setHours(8, 0, 0, 0);
  }

  // Calculer la différence en heures
  const diffInHours = (reservationDate - now) / (1000 * 60 * 60);
  
  return diffInHours >= 12;
};

// Valider le domaine email UCA
const isValidUCAEmail = (email) => {
  const allowedDomains = ['@uca.ma', '@uca.ac.ma'];
  return allowedDomains.some(domain => email.endsWith(domain));
};

// Vérifier si une réservation nécessite validation admin
const requiresAdminValidation = (dateDebut, dateFin, natureEvenement) => {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  
  // Calcul de la durée en jours
  const diffTime = Math.abs(fin - debut);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Validation requise si > 1 jour
  if (diffDays > 1) return true;
  
  // Validation requise pour événements officiels
  const officialEvents = ['audience', 'convention', 'congres'];
  if (officialEvents.includes(natureEvenement)) return true;
  
  return false;
};

// Calculer les statistiques d'un local
const calculateLocalStats = async (localId) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as confirmees,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        AVG(participants_estimes) as participants_moyens
      FROM reservations
      WHERE local_id = ?
    `, [localId]);

    return stats[0];
  } catch (error) {
    throw new Error('Erreur lors du calcul des statistiques: ' + error.message);
  }
};

module.exports = {
  isSlotAvailable,
  isBlackoutDate,
  canCancelReservation,
  isValidUCAEmail,
  requiresAdminValidation,
  calculateLocalStats
};