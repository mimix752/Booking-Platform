<template>
  <div class="historique-container">
    <div class="page-header">
      <h1>Historique des Réservations</h1>
      <p class="subtitle">Affichage des réservations confirmées, refusées et annulées</p>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="filter-group">
        <div class="filter-item">
          <label for="search">Recherche</label>
          <input
            id="search"
            v-model="filters.search"
            type="text"
            class="input-search"
            placeholder="Demandeur, email, salle, motif..."
            @input="onSearchChange"
          />
        </div>

        <div class="filter-item">
          <label for="status">Statut</label>
          <select
            id="status"
            v-model="filters.statut"
            class="select-filter"
            @change="fetchReservations"
          >
            <option value="">Tous les statuts</option>
            <option value="confirmee">Confirmées</option>
            <option value="refusee">Refusées</option>
            <option value="annulee_utilisateur">Annulées (Utilisateur)</option>
            <option value="annulee_admin">Annulées (Admin)</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="site">Site</label>
          <select
            id="site"
            v-model="filters.site_id"
            class="select-filter"
            @change="fetchReservations"
          >
            <option value="">Tous les sites</option>
            <option v-for="site in sites" :key="site.id" :value="site.id">
              {{ site.name }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label for="date-from">De</label>
          <input
            id="date-from"
            v-model="filters.date_from"
            type="date"
            class="input-date"
            @change="fetchReservations"
          />
        </div>

        <div class="filter-item">
          <label for="date-to">À</label>
          <input
            id="date-to"
            v-model="filters.date_to"
            type="date"
            class="input-date"
            @change="fetchReservations"
          />
        </div>

        <button class="btn-reset" @click="resetFilters">
          Réinitialiser
        </button>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de l'historique...</p>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchReservations" class="btn-retry">Réessayer</button>
    </div>

    <!-- Tableau des réservations -->
    <div v-if="!loading && !error" class="table-section">
      <div class="table-info">
        <p>
          Affichage de
          <strong>{{ displayedCount }}</strong>
          sur
          <strong>{{ totalCount }}</strong>
          réservations
        </p>
      </div>

      <div v-if="reservations.length === 0" class="empty-state">
        <p>Aucune réservation trouvée correspondant aux critères de recherche.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="reservations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Demandeur</th>
              <th>Email</th>
              <th>Salle</th>
              <th>Lieu</th>
              <th>Date</th>
              <th>Horaire</th>
              <th>Type</th>
              <th>Participants</th>
              <th>Statut</th>
              <th>Commentaire Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in reservations" :key="reservation.id" class="table-row">
              <td class="cell-id">{{ reservation.id }}</td>
              <td class="cell-demandeur">{{ reservation.nom_demandeur }}</td>
              <td class="cell-email">
                <a :href="`mailto:${reservation.email_demandeur}`">
                  {{ reservation.email_demandeur }}
                </a>
              </td>
              <td class="cell-salle">{{ reservation.salle }}</td>
              <td class="cell-lieu">{{ reservation.lieu }}</td>
              <td class="cell-date">{{ formatDate(reservation.date_debut) }}</td>
              <td class="cell-horaire">
                {{ reservation.heure_debut }} - {{ reservation.heure_fin }}
              </td>
              <td class="cell-type">{{ formatEventType(reservation.type_reunion) }}</td>
              <td class="cell-participants">{{ reservation.nombre_participants }}</td>
              <td class="cell-statut">
                <span :class="['status-badge', `status-${reservation.status}`]">
                  {{ formatStatus(reservation.status) }}
                </span>
              </td>
              <td class="cell-commentaire">
                <span
                  v-if="reservation.commentaire_admin"
                  :title="reservation.commentaire_admin"
                  class="comment-preview"
                >
                  {{ truncateText(reservation.commentaire_admin, 30) }}
                </span>
                <span v-else class="no-comment">-</span>
              </td>
              <td class="cell-actions">
                <button
                  class="btn-detail"
                  :title="`Voir les détails de la réservation #${reservation.id}`"
                  @click="viewDetails(reservation)"
                >
                  Détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination-section">
        <button
          :disabled="pagination.page === 1"
          class="btn-page"
          @click="goToPage(pagination.page - 1)"
        >
          Précédent
        </button>

        <div class="page-info">
          Page
          <input
            v-model.number="currentPage"
            type="number"
            :min="1"
            :max="pagination.totalPages"
            class="page-input"
            @change="goToPage(currentPage)"
          />
          sur {{ pagination.totalPages }}
        </div>

        <button
          :disabled="pagination.page === pagination.totalPages"
          class="btn-page"
          @click="goToPage(pagination.page + 1)"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- Modal de détails -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Détails de la réservation #{{ selectedReservation.id }}</h2>
          <button class="btn-close" @click="showDetailsModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Demandeur</label>
              <p>{{ selectedReservation.nom_demandeur }}</p>
            </div>
            <div class="detail-item">
              <label>Email</label>
              <p>
                <a :href="`mailto:${selectedReservation.email_demandeur}`">
                  {{ selectedReservation.email_demandeur }}
                </a>
              </p>
            </div>
            <div class="detail-item">
              <label>Salle</label>
              <p>{{ selectedReservation.salle }}</p>
            </div>
            <div class="detail-item">
              <label>Lieu</label>
              <p>{{ selectedReservation.lieu }}</p>
            </div>
            <div class="detail-item">
              <label>Date</label>
              <p>{{ formatDate(selectedReservation.date_debut) }}</p>
            </div>
            <div class="detail-item">
              <label>Horaire</label>
              <p>{{ selectedReservation.heure_debut }} - {{ selectedReservation.heure_fin }}</p>
            </div>
            <div class="detail-item">
              <label>Type de réunion</label>
              <p>{{ formatEventType(selectedReservation.type_reunion) }}</p>
            </div>
            <div class="detail-item">
              <label>Participants</label>
              <p>{{ selectedReservation.nombre_participants }}</p>
            </div>
            <div class="detail-item full-width">
              <label>Motif</label>
              <p>{{ selectedReservation.raison }}</p>
            </div>
            <div class="detail-item">
              <label>Statut</label>
              <p>
                <span :class="['status-badge', `status-${selectedReservation.status}`]">
                  {{ formatStatus(selectedReservation.status) }}
                </span>
              </p>
            </div>
            <div class="detail-item full-width">
              <label>Commentaire Admin</label>
              <p v-if="selectedReservation.commentaire_admin">
                {{ selectedReservation.commentaire_admin }}
              </p>
              <p v-else class="no-comment">Aucun commentaire</p>
            </div>
            <div v-if="selectedReservation.validated_at" class="detail-item">
              <label>Validé par</label>
              <p>{{ selectedReservation.validated_by }} le {{ selectedReservation.validated_at }}</p>
            </div>
            <div v-if="selectedReservation.cancelled_at" class="detail-item">
              <label>Annulé par</label>
              <p>{{ selectedReservation.cancelled_by }} le {{ selectedReservation.cancelled_at }}</p>
            </div>
            <div v-if="selectedReservation.cancellation_reason" class="detail-item full-width">
              <label>Raison de l'annulation</label>
              <p>{{ selectedReservation.cancellation_reason }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getReservationHistory } from '@/services/adminReservationService';

export default {
  name: 'HistoriquePage',
  data() {
    return {
      reservations: [],
      sites: [],
      loading: false,
      error: null,
      pagination: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1
      },
      currentPage: 1,
      filters: {
        search: '',
        statut: '',
        site_id: '',
        date_from: '',
        date_to: ''
      },
      showDetailsModal: false,
      selectedReservation: null,
      searchTimeout: null
    };
  },
  computed: {
    displayedCount() {
      return this.reservations.length;
    },
    totalCount() {
      return this.pagination.total;
    }
  },
  methods: {
    async fetchReservations() {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          limit: this.pagination.limit,
          page: this.pagination.page,
          ...Object.fromEntries(
            Object.entries(this.filters).filter(([, value]) => value !== '')
          )
        };

        const response = await getReservationHistory(params);

        if (response.success) {
          this.reservations = response.data;
          this.pagination = response.pagination;
        }
      } catch (err) {
        this.error = err.message || 'Erreur lors du chargement de l\'historique';
        console.error('Erreur fetchReservations:', err);
      } finally {
        this.loading = false;
      }
    },

    onSearchChange() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.pagination.page = 1;
        this.currentPage = 1;
        this.fetchReservations();
      }, 500);
    },

    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pagination.totalPages) {
        this.pagination.page = pageNumber;
        this.currentPage = pageNumber;
        this.fetchReservations();
        window.scrollTo(0, 0);
      }
    },

    resetFilters() {
      this.filters = {
        search: '',
        statut: '',
        site_id: '',
        date_from: '',
        date_to: ''
      };
      this.pagination.page = 1;
      this.currentPage = 1;
      this.fetchReservations();
    },

    viewDetails(reservation) {
      this.selectedReservation = reservation;
      this.showDetailsModal = true;
    },

    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    formatStatus(status) {
      const statusMap = {
        confirmee: 'Confirmée',
        refusee: 'Refusée',
        annulee_utilisateur: 'Annulée (Utilisateur)',
        annulee_admin: 'Annulée (Admin)',
        en_attente: 'En attente'
      };
      return statusMap[status] || status;
    },

    formatEventType(type) {
      const typeMap = {
        reunion: 'Réunion',
        audience: 'Audience',
        convention: 'Convention',
        conference: 'Conférence',
        congres: 'Congrès'
      };
      return typeMap[type] || type;
    },

    truncateText(text, length) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    }
  },
  mounted() {
    this.fetchReservations();
    // Récupérer les sites pour le filtre
    this.sites = [
      { id: 1, name: 'Site 1' },
      { id: 2, name: 'Site 2' }
      // À remplacer par un appel API réel si nécessaire
    ];
  }
};
</script>

<style scoped>
.historique-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

/* Filtres */
.filters-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.input-search,
.select-filter,
.input-date {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.input-search:focus,
.select-filter:focus,
.input-date:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-reset {
  padding: 8px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-reset:hover {
  background-color: #5a6268;
}

/* États de chargement et erreur */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.error-message p {
  margin: 0 0 10px 0;
}

.btn-retry {
  padding: 6px 15px;
  background-color: #721c24;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-retry:hover {
  background-color: #5a1419;
}

/* Table */
.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-info {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.table-responsive {
  overflow-x: auto;
}

.reservations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.reservations-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.reservations-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.reservations-table tbody tr {
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.reservations-table tbody tr:hover {
  background-color: #f9f9f9;
}

.reservations-table td {
  padding: 12px;
  color: #555;
}

.cell-id {
  font-weight: 600;
  color: #007bff;
}

.cell-demandeur {
  font-weight: 500;
  color: #333;
}

.cell-email a {
  color: #007bff;
  text-decoration: none;
}

.cell-email a:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-confirmee {
  background-color: #d4edda;
  color: #155724;
}

.status-refusee {
  background-color: #f8d7da;
  color: #721c24;
}

.status-annulee_utilisateur {
  background-color: #fff3cd;
  color: #856404;
}

.status-annulee_admin {
  background-color: #e7e7e7;
  color: #383838;
}

.comment-preview {
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.no-comment {
  color: #999;
  font-style: italic;
}

.cell-actions {
  text-align: center;
}

.btn-detail {
  padding: 6px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.btn-detail:hover {
  background-color: #0056b3;
}

/* Pagination */
.pagination-section {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  border-top: 1px solid #eee;
}

.btn-page {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-page:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-page:hover:not(:disabled) {
  background-color: #0056b3;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.page-input {
  width: 50px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 20px;
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 6px;
  display: block;
}

.detail-item p {
  margin: 0;
  color: #333;
  word-wrap: break-word;
}

.detail-item a {
  color: #007bff;
  text-decoration: none;
}

.detail-item a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .historique-container {
    padding: 10px;
  }

  .filter-group {
    grid-template-columns: 1fr;
  }

  .reservations-table {
    font-size: 12px;
  }

  .reservations-table th,
  .reservations-table td {
    padding: 8px;
  }

  .pagination-section {
    flex-direction: column;
    gap: 10px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full-width {
    grid-column: 1;
  }
}
</style>

