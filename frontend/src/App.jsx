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
import TopicsPage from './pages/TopicsPage';
import DesignRulesPage from './pages/DesignRulesPage';
import ProjectDetail from './pages/ProjectDetail';
import TasksPage from './pages/TasksPage';
import UsersPage from './pages/UsersPage';
import TaskDetailPage from './pages/TaskDetailPage';
import UserDetailPage from './pages/UserDetailPage';
import ProfilePage from './pages/ProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import AttendancePage from './pages/AttendancePage';

// HR Pages
import EmployeesPage from './pages/hr/EmployeesPage';
import DepartmentsPage from './pages/hr/DepartmentsPage';
import CareerPathsPage from './pages/hr/CareerPathsPage';
import KPIPage from './pages/hr/KPIPage';
import EvaluationsPage from './pages/hr/EvaluationsPage';
import SalaryReviewsPage from './pages/hr/SalaryReviewsPage';
import FreelancerEarningsPage from './pages/hr/FreelancerEarningsPage';
import PersonalReportsPage from './pages/hr/PersonalReportsPage';
import PlansPage from './pages/hr/PlansPage';
import DepartmentDetailPage from './pages/hr/DepartmentDetailPage';
import CareerPathDetailPage from './pages/hr/CareerPathDetailPage';
import PersonalReportDetailPage from './pages/hr/PersonalReportDetailPage';
import PlanDetailPage from './pages/hr/PlanDetailPage';
import AttendanceManagementPage from './pages/hr/AttendanceManagementPage';
import AttendanceSettingsPage from './pages/hr/AttendanceSettingsPage';
import LeaveRequestsPage from './pages/hr/LeaveRequestsPage';
import LeaveManagementPage from './pages/hr/LeaveManagementPage';
import LeaveTypesPage from './pages/hr/LeaveTypesPage';

// CRM Pages
import CRMDashboardPage from './pages/crm/CRMDashboardPage';
import CustomersPage from './pages/crm/CustomersPage';
import CustomerStagesPage from './pages/crm/settings/CustomerStagesPage';
import ExpenseTypesPage from './pages/crm/settings/ExpenseTypesPage';

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
                    <Route path="/topics" element={<TopicsPage />} />
                    <Route path="/design-rules" element={<DesignRulesPage />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/:id" element={<TaskDetailPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/:id" element={<UserDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/attendance" element={<AttendancePage />} />
                    <Route path="/hr/attendance-management" element={<AttendanceManagementPage />} />
                    <Route path="/hr/attendance-settings" element={<AttendanceSettingsPage />} />
                    <Route path="/hr/employees" element={<EmployeesPage />} />
                    <Route path="/hr/departments" element={<DepartmentsPage />} />
                    <Route path="/hr/departments/:id" element={<DepartmentDetailPage />} />
                    <Route path="/hr/career-paths" element={<CareerPathsPage />} />
                    <Route path="/hr/career-paths/:id" element={<CareerPathDetailPage />} />
                    <Route path="/hr/kpi" element={<KPIPage />} />
                    <Route path="/hr/evaluations" element={<EvaluationsPage />} />
                    <Route path="/hr/salary-reviews" element={<SalaryReviewsPage />} />
                    <Route path="/hr/money" element={<FreelancerEarningsPage />} />
                    <Route path="/hr/reports" element={<PersonalReportsPage />} />
                    <Route path="/hr/reports/:id" element={<PersonalReportDetailPage />} />
                    <Route path="/hr/plans" element={<PlansPage />} />
                    <Route path="/hr/plans/:id" element={<PlanDetailPage />} />
                    <Route path="/hr/leave-requests" element={<LeaveRequestsPage />} />
                    <Route path="/hr/leave-management" element={<LeaveManagementPage />} />
                    <Route path="/hr/leave-types" element={<LeaveTypesPage />} />

                    {/* CRM Routes */}
                    <Route path="/crm" element={<CRMDashboardPage />} />
                    <Route path="/crm/customers" element={<CustomersPage />} />
                    <Route path="/crm/settings/stages" element={<CustomerStagesPage />} />
                    <Route path="/crm/settings/expense-types" element={<ExpenseTypesPage />} />

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
