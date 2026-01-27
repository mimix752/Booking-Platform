import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ReservationsPage from './pages/ReservationsPage';
import HistoriquePage from './pages/HistoriquePage';
import CalendrierPage from './pages/CalendrierPage';
import MaintenancePage from './pages/MaintenancePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/reservations" element={<ReservationsPage />} />
        <Route path="/admin/historique" element={<HistoriquePage />} />
        <Route path="/admin/calendrier" element={<CalendrierPage />} />
        <Route path="/admin/maintenance" element={<MaintenancePage />} />
      </Routes>
    </Router>
  );
}

export default App;