import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DashboardRefreshProvider,
  ToastProvider,
  AuthProvider,
  ThemeProvider,
} from './contexts';
import {
  Dashboard,
  StudentRequestHistoryPage,
  StudentNoticeBoardPage,
  WardenDashboard,
  NoticeBoardPage,
  WardenPassHistoryPage,
  WardenReportsPage,
  SecurityDashboard,
  SecurityNoticeBoardPage,
  SecurityVerificationQueuePage,
  SecurityActivePassesPage,
  LoginPage,
  ProfilePage,
} from './pages';
import ChangePasswordPage from './pages/ChangePasswordPage';
import GuestRequestPage from './pages/GuestRequestPage';
import MaintenanceRequestPage from './pages/MaintenanceRequestPage';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { setupGlobalErrorHandlers } from './utils/errorHandling';
import './App.css';

setupGlobalErrorHandlers();

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
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <DashboardRefreshProvider>
                <ToastProvider>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/change-password"
                      element={<ChangePasswordPage />}
                    />

                    {/* Student Routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute allowedRole="student">
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/guest-request"
                      element={
                        <ProtectedRoute allowedRole="student">
                          <GuestRequestPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/request-history"
                      element={
                        <ProtectedRoute allowedRole="student">
                          <StudentRequestHistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student/notice-board"
                      element={
                        <ProtectedRoute allowedRole="student">
                          <StudentNoticeBoardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/maintenance-request"
                      element={
                        <ProtectedRoute allowedRole="student">
                          <MaintenanceRequestPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            'student',
                            'warden',
                            'security',
                            'maintenance',
                            'admin',
                          ]}
                        >
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Warden Routes */}
                    <Route
                      path="/warden/dashboard"
                      element={
                        <ProtectedRoute allowedRole="warden">
                          <WardenDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notice-board"
                      element={
                        <ProtectedRoute allowedRoles={['warden', 'admin']}>
                          <NoticeBoardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/warden/history"
                      element={
                        <ProtectedRoute allowedRole="warden">
                          <WardenPassHistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/warden/reports"
                      element={
                        <ProtectedRoute allowedRole="warden">
                          <WardenReportsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Security Routes */}
                    <Route
                      path="/security/dashboard"
                      element={
                        <ProtectedRoute allowedRole="security">
                          <SecurityDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/security/notice-board"
                      element={
                        <ProtectedRoute allowedRole="security">
                          <SecurityNoticeBoardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/security/verification-queue"
                      element={
                        <ProtectedRoute allowedRole="security">
                          <SecurityVerificationQueuePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/security/active-passes"
                      element={
                        <ProtectedRoute allowedRole="security">
                          <SecurityActivePassesPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Maintenance Routes */}
                    <Route
                      path="/maintenance/dashboard"
                      element={
                        <ProtectedRoute allowedRole="maintenance">
                          <MaintenanceDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute allowedRole="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                  <Toast />
                </ToastProvider>
              </DashboardRefreshProvider>
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
