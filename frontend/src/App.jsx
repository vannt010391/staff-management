import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';

// HR Pages
import EmployeesPage from './pages/hr/EmployeesPage';
import DepartmentsPage from './pages/hr/DepartmentsPage';
import CareerPathsPage from './pages/hr/CareerPathsPage';
import KPIPage from './pages/hr/KPIPage';
import EvaluationsPage from './pages/hr/EvaluationsPage';
import SalaryReviewsPage from './pages/hr/SalaryReviewsPage';
import PersonalReportsPage from './pages/hr/PersonalReportsPage';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/hr/employees" element={<EmployeesPage />} />
                    <Route path="/hr/departments" element={<DepartmentsPage />} />
                    <Route path="/hr/career-paths" element={<CareerPathsPage />} />
                    <Route path="/hr/kpi" element={<KPIPage />} />
                    <Route path="/hr/evaluations" element={<EvaluationsPage />} />
                    <Route path="/hr/salary-reviews" element={<SalaryReviewsPage />} />
                    <Route path="/hr/reports" element={<PersonalReportsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
