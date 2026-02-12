/**
 * API Service pour gérer l'historique des réservations
 * Ce service communique avec l'API backend pour récupérer l'historique
 */

/**
 * Récupérer l'historique complet des réservations (Admin)
 * @param {Object} params - Paramètres optionnels de filtrage
 * @param {number} params.limit - Nombre de résultats par page (défaut: 50)
 * @param {number} params.reservation_id - Filtrer par ID de réservation
 * @param {number} params.user_id - Filtrer par ID d'utilisateur
 * @param {string} params.action - Filtrer par type d'action (created, validated, refused, cancelled, updated)
 * @param {number} params.site_id - Filtrer par ID de site
 * @param {string} params.date_from - Filtrer à partir d'une date (YYYY-MM-DD)
 * @param {string} params.date_to - Filtrer jusqu'à une date (YYYY-MM-DD)
 * @returns {Promise<Object>} Les données d'historique avec pagination
 * @example
 * const history = await getReservationHistory({
 *   limit: 20,
 *   action: 'validated',
 *   date_from: '2026-02-01'
 * });
 */
export async function getReservationHistory(params = {}) {
  const { data } = await api.get('/admin/reservations/history', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement de l\'historique');
  }
  return data;
}

/**
 * Récupérer l'historique d'une réservation spécifique
 * @param {number} reservationId - ID de la réservation
 * @param {Object} params - Paramètres optionnels
 * @param {number} params.limit - Nombre de résultats par page (défaut: 50)
 * @returns {Promise<Object>} L'historique détaillé de la réservation
 * @example
 * const history = await getReservationDetailHistory(123);
 */
export async function getReservationDetailHistory(reservationId, params = {}) {
  const { data } = await api.get(`/admin/reservations/${reservationId}/history`, { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement de l\'historique');
  }
  return data;
}

/**
 * Utilitaire pour formater une action d'historique en texte lisible
 * @param {string} action - Le type d'action (created, validated, refused, cancelled, updated)
 * @returns {string} Le texte formaté de l'action
 */
export function formatHistoryAction(action) {
  const actionMap = {
    'created': 'Créée',
    'validated': 'Validée',
    'refused': 'Refusée',
    'cancelled': 'Annulée',
    'updated': 'Modifiée'
  };
  return actionMap[action] || action;
}

/**
 * Utilitaire pour formater les changements d'historique
 * @param {Object} oldValues - Les anciennes valeurs
 * @param {Object} newValues - Les nouvelles valeurs
 * @returns {string} Résumé des changements
 */
export function formatHistoryChanges(oldValues, newValues) {
  if (!oldValues || !newValues) return '';

  const changes = [];
  for (const [key, newValue] of Object.entries(newValues)) {
    const oldValue = oldValues[key];
    if (oldValue !== newValue) {
      changes.push(`${key}: ${oldValue} → ${newValue}`);
    }
  }
  return changes.join(', ');
}

/**
 * Utilitaire pour filtrer l'historique par type d'action
 * @param {Array} historyItems - Les éléments d'historique
 * @param {string} action - Le type d'action à filtrer
 * @returns {Array} Les éléments filtrés
 */
export function filterByAction(historyItems, action) {
  return historyItems.filter(item => item.action === action);
}

/**
 * Utilitaire pour obtenir le statut d'une réservation à partir de son historique
 * @param {Array} historyItems - Les éléments d'historique (triés par date décroissante)
 * @returns {string} Le dernier statut connu de la réservation
 */
export function getLatestStatus(historyItems) {
  for (const item of historyItems) {
    if (item.statut_nouveau) {
      return item.statut_nouveau;
    }
  }
  return 'unknown';
}

