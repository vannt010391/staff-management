import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { ROLES } from '../../constants';
import AttendanceNotification from '../AttendanceNotification';
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
  Target,
  ChevronDown,
  ChevronRight,
  UserCog,
  UsersRound,
  Tag,
  Palette,
  Settings,
  UserCircle,
  KeyRound,
  Clock,
  Calendar,
} from 'lucide-react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleGoToProfile = () => {
    setUserMenuOpen(false);
    navigate('/profile');
  };

  const handleGoToChangePassword = () => {
    setUserMenuOpen(false);
    navigate('/profile#change-password');
  };

  const navigation = getNavigationItems(user?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <span className="text-xl font-bold text-blue-600">WorkHub</span>
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
            <span className="text-xl font-bold text-blue-600">WorkHub</span>
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
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                    title="User menu"
                  >
                    <UserCircle className="h-6 w-6" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                      <button
                        onClick={handleGoToProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                      >
                        <UserCircle className="h-4 w-4" />
                        Xem profile
                      </button>
                      <button
                        onClick={handleGoToChangePassword}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                      >
                        <KeyRound className="h-4 w-4" />
                        Đổi mật khẩu
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Notification */}
        <AttendanceNotification />

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, currentPath }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <nav className="flex-1 px-4 py-4 space-y-1">
      {navigation.map((item) => {
        // If item has children, render as group
        if (item.children) {
          const isExpanded = expandedGroups[item.name] !== false; // Default to expanded
          const hasActiveChild = item.children.some(child => currentPath === child.href);

          return (
            <div key={item.name} className="mb-2">
              <button
                onClick={() => toggleGroup(item.name)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  hasActiveChild ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-1 ml-4 space-y-1">
                  {item.children.map((child) => {
                    const isActive = currentPath === child.href;
                    return (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <child.icon className="mr-3 h-4 w-4" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Regular single item (no children)
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'My Leave', href: '/hr/leave-requests', icon: Calendar },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
  ];

  const managerAdminGroups = [
    {
      name: 'CRM',
      icon: TrendingUp,
      children: [
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Customers', href: '/crm/customers', icon: Building2 },
        { name: 'Customer Stages', href: '/crm/settings/stages', icon: Target },
        { name: 'Expense Types', href: '/crm/settings/expense-types', icon: DollarSign },
      ]
    },
    {
      name: 'Projects',
      icon: FolderKanban,
      children: [
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Topics', href: '/topics', icon: Tag },
        { name: 'Design Rules', href: '/design-rules', icon: Palette },
        { name: 'Documents', href: '/documents', icon: FileText },
        { name: 'All Tasks', href: '/tasks', icon: ListTodo },
      ]
    },
    {
      name: 'Users',
      icon: Users,
      children: [
        { name: 'Departments', href: '/hr/departments', icon: Building2 },
        { name: 'Users', href: '/users', icon: Users },
        { name: 'Employees', href: '/hr/employees', icon: Briefcase },
      ]
    },
    {
      name: 'HR',
      icon: UserCog,
      children: [
        { name: 'Attendance Management', href: '/hr/attendance-management', icon: Clock },
        { name: 'Leave Management', href: '/hr/leave-management', icon: Calendar },
        { name: 'Leave Types', href: '/hr/leave-types', icon: Settings },
        { name: 'Career Paths', href: '/hr/career-paths', icon: TrendingUp },
        { name: 'KPI Dashboard', href: '/hr/kpi', icon: TrendingUp },
        { name: 'Evaluations', href: '/hr/evaluations', icon: Award },
        { name: 'Salary Reviews', href: '/hr/salary-reviews', icon: DollarSign },
        { name: 'Money Management', href: '/hr/money', icon: DollarSign },
      ]
    },
    {
      name: 'Team Management',
      icon: UsersRound,
      children: [
        { name: 'All Plans', href: '/hr/plans', icon: Target },
        { name: 'Reports', href: '/hr/reports', icon: FileText },
      ]
    },
  ];

  const teamLeadGroups = [
    {
      name: 'Projects',
      icon: FolderKanban,
      children: [
        { name: 'Projects', href: '/projects', icon: FolderKanban },
        { name: 'Documents', href: '/documents', icon: FileText },
        { name: 'All Tasks', href: '/tasks', icon: ListTodo },
      ]
    },
    {
      name: 'Team Management',
      icon: UsersRound,
      children: [
        { name: 'Leave Management', href: '/hr/leave-management', icon: Calendar },
        { name: 'My Plans', href: '/hr/plans', icon: Target },
      ]
    },
  ];

  const staffItems = [
    { name: 'All Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'My Plans', href: '/hr/plans', icon: Target },
  ];

  const freelancerItems = [
    { name: 'My Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'My Plans', href: '/hr/plans', icon: Target },
  ];

  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return [...commonItems, ...managerAdminGroups];
  } else if (role === ROLES.TEAM_LEAD) {
    return [...commonItems, ...teamLeadGroups];
  } else if (role === ROLES.STAFF) {
    return [...commonItems, ...staffItems];
  } else if (role === ROLES.FREELANCER) {
    return [...commonItems, ...freelancerItems];
  }

  return commonItems;
}
