import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './modules/auth/LoginPage';
import DashboardPage from './modules/dashboard/DashboardPage';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import SecretariasPage from './modules/settings/secretarias/SecretariasPage';
import MunicipiosPage from './modules/settings/municipios/MunicipiosPage';
import RolesPage from './modules/settings/roles/RolesPage';
import UsersPage from '@/modules/users/UsersPage';
import IndicadoresPage from './modules/indicadores/IndicadoresPage';
import VariablesPage from './modules/indicadores/VariablesPage';
import VisualizacionPage from './modules/indicadores/VisualizacionPage';
import CargaDatosPage from './modules/indicadores/CargaDatosPage';
import IndicadorDataPage from './modules/indicadores/IndicadorDataPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route path="/dashboard" element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  <Route index element={<DashboardPage />} />
                  {/* Add more private routes here */}
                  <Route path="users" element={<UsersPage />} />
                  <Route path="indicadores" element={<IndicadoresPage />} />
                  <Route path="indicadores/:id/variables" element={<VariablesPage />} />
                  <Route path="indicadores/:id/visualizacion" element={<VisualizacionPage />} />
                  <Route path="indicadores/:id/carga" element={<CargaDatosPage />} />
                  <Route path="indicadores/:id/data" element={<IndicadorDataPage />} />
                  <Route path="settings/secretarias" element={<SecretariasPage />} />
                  <Route path="settings/municipios" element={<MunicipiosPage />} />
                  <Route path="roles" element={<RolesPage />} />
                  <Route path="settings" element={<h2>Settings Module placeholder</h2>} />
                </Route>
              </Route>
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
