import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { SmartTimeProvider } from './contexts/SmartTimeContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import TokenDebugBanner from './components/TokenDebugBanner';
import './App.css';

// Lazy loading de CambiarContraseña para usarlo en el Gate
const CambiarContraseña = lazy(() => import('./pages/CambiarContraseña'));

/** Si el usuario debe cambiar la clave (RequiereCambioClave), redirige a /cambiar-contrasena y muestra solo esa página (sin Layout). */
function RequiereCambioClaveGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && user.requiereCambioClave === true) {
      Swal.close();
    }
  }, [user?.requiereCambioClave]);

  if (user && user.requiereCambioClave === true) {
    if (location.pathname !== '/cambiar-contrasena') {
      return <Navigate to="/cambiar-contrasena" replace />;
    }
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <CambiarContraseña obligatorio />
        </Suspense>
      </div>
    );
  }
  return children;
}

// Lazy loading de todas las páginas para code splitting
const Login = lazy(() => import('./pages/Login'));
const Index = lazy(() => import('./pages/Index'));
const Despacho = lazy(() => import('./pages/Despacho'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Planta = lazy(() => import('./pages/Planta'));
const CentroDeCosto = lazy(() => import('./pages/CentroDeCosto'));
const Proyecto = lazy(() => import('./pages/Proyecto'));
const PlanNutricional = lazy(() => import('./pages/PlanNutricional'));
const Jerarquia = lazy(() => import('./pages/Jerarquia'));
const Turno = lazy(() => import('./pages/Turno'));
const Plato = lazy(() => import('./pages/Plato'));
const MenuDelDia = lazy(() => import('./pages/MenuDelDia'));
const ReporteGComensales = lazy(() => import('./pages/ReporteGComensales'));
const ReporteGGestion = lazy(() => import('./pages/ReporteGGestion'));
// Pantallas vacías - comentadas hasta que se implementen
// const DatosPersonales = lazy(() => import('./pages/DatosPersonales'));
// const Calificacion = lazy(() => import('./pages/Calificacion'));
const Configuracion = lazy(() => import('./pages/Configuracion'));

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AuthProvider>
          <DashboardProvider>
            <Router>
            <SmartTimeProvider>
            <TokenDebugBanner />
            <RequiereCambioClaveGate>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Index />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/despacho"
                  element={
                    <PrivateRoute allowedRoles={['Cocina']}>
                      <Layout>
                        <Despacho />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Usuarios />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/planta"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Planta />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/centrodecosto"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <CentroDeCosto />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/proyecto"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Proyecto />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/plannutricional"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <PlanNutricional />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/jerarquia"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Jerarquia />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/turno"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Turno />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/plato"
                  element={
                    <PrivateRoute allowedRoles={['Cocina']}>
                      <Layout>
                        <Plato />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/menudeldia"
                  element={
                    <PrivateRoute allowedRoles={['Cocina']}>
                      <Layout>
                        <MenuDelDia />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reportegcomensales"
                  element={
                    <PrivateRoute allowedRoles={['Gerencia']}>
                      <Layout>
                        <ReporteGComensales />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reporteggestion"
                  element={
                    <PrivateRoute allowedRoles={['Gerencia']}>
                      <Layout>
                        <ReporteGGestion />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                {/* Pantallas vacías - comentadas hasta que se implementen */}
                {/* <Route
                  path="/datospersonales"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <DatosPersonales />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/calificacion"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Calificacion />
                      </Layout>
                    </PrivateRoute>
                  }
                /> */}
                <Route
                  path="/configuracion"
                  element={
                    <PrivateRoute allowedRoles={['Admin', 'Gerencia']}>
                      <Layout>
                        <Configuracion />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/cambiar-contrasena"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CambiarContraseña />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            </RequiereCambioClaveGate>
            </SmartTimeProvider>
          </Router>
          </DashboardProvider>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
