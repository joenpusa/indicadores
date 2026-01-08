import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './modules/auth/LoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              {/* Add more private routes here */}
              <Route path="users" element={<h2>Usuarios Module placeholder</h2>} />
              <Route path="settings" element={<h2>Settings Module placeholder</h2>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
