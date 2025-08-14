import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './components/Auth/LoginPage';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import PatientsPage from './pages/Patients/PatientsPage';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Routes protégées */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PatientsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div>Agenda - En développement</div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/treatments"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div>Traitements - En développement</div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div>Facturation - En développement</div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <div>Paramètres - En développement</div>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Redirection par défaut */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Page non trouvée */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
