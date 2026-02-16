import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/ProtectedRoute';
import { useToast } from './components/Toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ReservationPage from './pages/ReservationPage';
import MesReservationsPage from './pages/MesReservationsPage';
import AdminDashboard from './pages/AdminDashboard';
import ReservationsPage from './pages/ReservationsPage';
import HistoriquePage from './pages/HistoriquePage';
import CalendrierPage from './pages/CalendrierPage';
import MaintenancePage from './pages/MaintenancePage';
import DisponibilitesPage from './pages/DisponibilitesPage';

function App() {
  const { ToastContainer } = useToast();

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          {/* Routes utilisateur protégées */}
          <Route path="/reservation/:localId" element={
            <ProtectedRoute>
              <ReservationPage />
            </ProtectedRoute>
          } />

          <Route path="/disponibilites/:localId" element={
            <ProtectedRoute>
              <DisponibilitesPage />

            </ProtectedRoute>
          } />

          <Route path="/mes-reservations" element={
            <ProtectedRoute>
              <MesReservationsPage />
            </ProtectedRoute>
          } />

          {/* Routes admin protégées */}
          <Route path="/admin-dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="/admin/reservations" element={
            <AdminRoute>
              <ReservationsPage />
            </AdminRoute>
          } />

          <Route path="/admin/historique" element={
            <AdminRoute>
              <HistoriquePage />
            </AdminRoute>
          } />

          <Route path="/admin/calendrier" element={
            <AdminRoute>
              <CalendrierPage />
            </AdminRoute>
          } />

          <Route path="/admin/maintenance" element={
            <AdminRoute>
              <MaintenancePage />
            </AdminRoute>
          } />

          {/* Route 404 */}
          <Route path="*" element={
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-amber-800 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page non trouvée</h2>
                <p className="text-gray-600 mb-8">La page que vous recherchez n'existe pas.</p>
                <a
                  href="/"
                  className="px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
                >
                  Retour à l'accueil
                </a>
              </div>
            </div>
          } />
        </Routes>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

export default App;