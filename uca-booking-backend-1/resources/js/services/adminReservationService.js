/**
 * Service administrateur pour les réservations
 * Fournit les méthodes pour gérer et consulter l'historique des réservations
 */

import api from '@/api/axios';

/**
 * Récupérer l'historique complet des réservations (réservations traitées)
 *
 * @param {Object} params - Paramètres optionnels de filtrage
 * @param {number} params.limit - Nombre de résultats par page (défaut: 50)
 * @param {number} params.page - Numéro de page (défaut: 1)
 * @param {string} params.statut - Filtrer par statut (confirmee, refusee, annulee_utilisateur, annulee_admin)
 * @param {number} params.site_id - Filtrer par ID de site
 * @param {string} params.date_from - Filtrer à partir d'une date (YYYY-MM-DD)
 * @param {string} params.date_to - Filtrer jusqu'à une date (YYYY-MM-DD)
 * @param {string} params.search - Recherche textuelle (demandeur, email, salle, motif)
 *
 * @returns {Promise<Object>} Les données d'historique avec pagination
 *
 * @example
 * const history = await getReservationHistory({
 *   limit: 20,
 *   statut: 'confirmee',
 *   date_from: '2026-02-01',
 *   site_id: 1
 * });
 */
export async function getReservationHistory(params = {}) {
  try {
    const { data } = await api.get('/admin/reservations/history', { params });

    if (!data?.success) {
      throw new Error(data?.message || 'Erreur lors du chargement de l\'historique');
    }

    return data;
  } catch (error) {
    console.error('Erreur getReservationHistory:', error);
    throw error;
  }
}

/**
 * Récupérer les réservations en attente de validation
 *
 * @param {Object} params - Paramètres optionnels
 * @param {number} params.limit - Nombre de résultats par page
 * @param {number} params.site_id - Filtrer par ID de site
 *
 * @returns {Promise<Object>} Les réservations en attente
 */
export async function getPendingReservations(params = {}) {
  try {
    const { data } = await api.get('/admin/reservations/pending', { params });

    if (!data?.success) {
      throw new Error(data?.message || 'Erreur lors du chargement des réservations en attente');
    }

    return data;
  } catch (error) {
    console.error('Erreur getPendingReservations:', error);
    throw error;
  }
}

/**
 * Récupérer toutes les réservations (filtrées)
 *
 * @param {Object} params - Paramètres optionnels
 * @param {number} params.limit - Nombre de résultats par page
 * @param {string} params.status - Filtrer par statut
 * @param {number} params.site_id - Filtrer par ID de site
 * @param {number} params.user_id - Filtrer par ID d'utilisateur
 *
 * @returns {Promise<Object>} Toutes les réservations
 */
export async function getAllReservations(params = {}) {
  try {
    const { data } = await api.get('/admin/reservations', { params });

    if (!data?.success) {
      throw new Error(data?.message || 'Erreur lors du chargement des réservations');
    }

    return data;
  } catch (error) {
    console.error('Erreur getAllReservations:', error);
    throw error;
  }
}

/**
 * Valider une réservation
 *
 * @param {number} reservationId - ID de la réservation à valider
 * @param {Object} data - Données de validation
 * @param {string} data.commentaire_admin - Commentaire optionnel
 *
 * @returns {Promise<Object>} La réponse du serveur
 */
export async function validateReservation(reservationId, data = {}) {
  try {
    const response = await api.post(`/admin/reservations/${reservationId}/validate`, data);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Erreur lors de la validation');
    }

    return response.data;
  } catch (error) {
    console.error('Erreur validateReservation:', error);
    throw error;
  }
}

/**
 * Refuser une réservation
 *
 * @param {number} reservationId - ID de la réservation à refuser
 * @param {Object} data - Données du refus
 * @param {string} data.commentaire_admin - Raison du refus (requis)
 *
 * @returns {Promise<Object>} La réponse du serveur
 */
export async function refuseReservation(reservationId, data = {}) {
  try {
    const response = await api.post(`/admin/reservations/${reservationId}/refuse`, data);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Erreur lors du refus');
    }

    return response.data;
  } catch (error) {
    console.error('Erreur refuseReservation:', error);
    throw error;
  }
}

/**
 * Annuler une réservation (admin)
 *
 * @param {number} reservationId - ID de la réservation à annuler
 * @param {Object} data - Données de l'annulation
 * @param {string} data.cancellation_reason - Raison de l'annulation (requis)
 *
 * @returns {Promise<Object>} La réponse du serveur
 */
export async function cancelReservation(reservationId, data = {}) {
  try {
    const response = await api.post(`/admin/reservations/${reservationId}/cancel`, data);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Erreur lors de l\'annulation');
    }

    return response.data;
  } catch (error) {
    console.error('Erreur cancelReservation:', error);
    throw error;
  }
}

/**
 * Créer une réservation (admin - création directe)
 *
 * @param {Object} data - Données de la réservation
 * @param {number} data.user_id - ID de l'utilisateur
 * @param {number} data.local_id - ID du local
 * @param {string} data.date_debut - Date de début (YYYY-MM-DD)
 * @param {string} data.date_fin - Date de fin (YYYY-MM-DD)
 * @param {string} data.creneau - Créneau (matin, apres-midi, journee-complete)
 * @param {string} data.nature_evenement - Nature de l'événement
 * @param {number} data.participants_estimes - Nombre de participants
 * @param {string} data.motif - Motif de la réservation
 * @param {string} data.priorite - Priorité (optionnel)
 * @param {string} data.commentaire_admin - Commentaire (optionnel)
 *
 * @returns {Promise<Object>} La réservation créée
 */
export async function createAdminReservation(data = {}) {
  try {
    const response = await api.post('/admin/reservations/create', data);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Erreur lors de la création');
    }

    return response.data;
  } catch (error) {
    console.error('Erreur createAdminReservation:', error);
    throw error;
  }
}

/**
 * Modifier une réservation (admin)
 *
 * @param {number} reservationId - ID de la réservation à modifier
 * @param {Object} data - Données à modifier
 *
 * @returns {Promise<Object>} La réservation modifiée
 */
export async function updateReservation(reservationId, data = {}) {
  try {
    const response = await api.put(`/admin/reservations/${reservationId}`, data);

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Erreur lors de la modification');
    }

    return response.data;
  } catch (error) {
    console.error('Erreur updateReservation:', error);
    throw error;
  }
}

