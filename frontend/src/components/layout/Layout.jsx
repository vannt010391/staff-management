import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ROLES } from '../../constants';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Briefcase,
  Building2,
  TrendingUp,
  FileText,
  Award,
  DollarSign,
} from 'lucide-react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = getNavigationItems(user?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <span className="text-xl font-bold text-blue-600">Freelancer MS</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          <div className="flex items-center h-16 px-4 border-b">
            <span className="text-xl font-bold text-blue-600">Freelancer MS</span>
          </div>
          <SidebarContent navigation={navigation} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b">
          <button
            className="px-4 text-gray-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-end items-center">
            {/* User info */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, currentPath }) {
  return (
    <nav className="flex-1 px-4 py-4 space-y-1">
      {navigation.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

function getNavigationItems(role) {
  const commonItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  ];

  const managerAdminItems = [
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'All Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Employees', href: '/hr/employees', icon: Briefcase },
    { name: 'Departments', href: '/hr/departments', icon: Building2 },
    { name: 'Career Paths', href: '/hr/career-paths', icon: TrendingUp },
    { name: 'KPI Dashboard', href: '/hr/kpi', icon: TrendingUp },
    { name: 'Evaluations', href: '/hr/evaluations', icon: Award },
    { name: 'Salary Reviews', href: '/hr/salary-reviews', icon: DollarSign },
    { name: 'Reports', href: '/hr/reports', icon: FileText },
  ];

  const teamLeadItems = [
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'All Tasks', href: '/tasks', icon: ListTodo },
  ];

  const staffItems = [
    { name: 'All Tasks', href: '/tasks', icon: ListTodo },
  ];

  const freelancerItems = [
    { name: 'My Tasks', href: '/tasks', icon: ListTodo },
  ];

  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return [...commonItems, ...managerAdminItems];
  } else if (role === ROLES.TEAM_LEAD) {
    return [...commonItems, ...teamLeadItems];
  } else if (role === ROLES.STAFF) {
    return [...commonItems, ...staffItems];
  } else if (role === ROLES.FREELANCER) {
    return [...commonItems, ...freelancerItems];
  }

  return commonItems;
}
