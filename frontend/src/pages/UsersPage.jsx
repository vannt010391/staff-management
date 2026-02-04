import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  Users,
  Plus,
  Search,
  Shield,
  Briefcase,
  UserCircle,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Crown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      phone: '+1234567890',
      is_active: true,
      tasks_completed: 0,
      tasks_in_progress: 0,
      total_earned: 0,
    },
    {
      id: 2,
      username: 'john_doe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'freelancer',
      phone: '+1234567891',
      is_active: true,
      tasks_completed: 15,
      tasks_in_progress: 3,
      total_earned: 4500,
    },
    {
      id: 3,
      username: 'jane_smith',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'freelancer',
      phone: '+1234567892',
      is_active: true,
      tasks_completed: 22,
      tasks_in_progress: 5,
      total_earned: 7200,
    },
    {
      id: 4,
      username: 'manager',
      email: 'manager@example.com',
      first_name: 'Mike',
      last_name: 'Manager',
      role: 'manager',
      phone: '+1234567893',
      is_active: true,
      tasks_completed: 0,
      tasks_in_progress: 0,
      total_earned: 0,
    },
  ];

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Freelancers', value: users.filter(u => u.role === 'freelancer').length.toString(), icon: Briefcase, color: 'from-purple-500 to-pink-500' },
    { label: 'Managers', value: users.filter(u => u.role === 'manager').length.toString(), icon: Shield, color: 'from-orange-500 to-red-500' },
    { label: 'Active', value: users.filter(u => u.is_active).length.toString(), icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6 space-y-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Team Members
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-16">
              Manage your team and freelancers
            </p>
          </div>
          {currentUser?.role === 'admin' && (
            <button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Add User
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                <p className={`text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <stat.icon className="h-7 w-7 text-gray-700" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl`} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="freelancer">Freelancer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, index) => (
          <UserCard key={user.id} user={user} index={index} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

function UserCard({ user, index, currentUser }) {
  const roleConfig = {
    admin: {
      icon: Crown,
      color: 'from-yellow-400 to-orange-500',
      bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
      badge: 'bg-yellow-100 text-yellow-800',
      label: 'Admin'
    },
    manager: {
      icon: Shield,
      color: 'from-blue-400 to-indigo-500',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      badge: 'bg-blue-100 text-blue-800',
      label: 'Manager'
    },
    freelancer: {
      icon: Briefcase,
      color: 'from-purple-400 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
      badge: 'bg-purple-100 text-purple-800',
      label: 'Freelancer'
    },
  };

  const role = roleConfig[user.role];

  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header with Gradient */}
      <div className={`${role.bg} p-6 border-b border-white/50 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${role.color} opacity-10`} />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative p-4 bg-gradient-to-br ${role.color} rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
              <role.icon className="h-8 w-8 text-white" />
              {user.is_active && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-sm text-gray-600">@{user.username}</p>
            </div>
          </div>
          <span className={`${role.badge} px-3 py-1 rounded-xl text-xs font-bold shadow-lg`}>
            {role.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-gray-700 font-medium">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Stats for Freelancers */}
        {user.role === 'freelancer' && (
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {user.tasks_completed}
              </p>
              <p className="text-xs text-gray-600 font-medium">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {user.tasks_in_progress}
              </p>
              <p className="text-xs text-gray-600 font-medium">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${user.total_earned}
              </p>
              <p className="text-xs text-gray-600 font-medium">Earned</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 py-2">
          {user.is_active ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Inactive</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {currentUser?.role === 'admin' && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button className="px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-pink-700 transition-all hover:scale-[1.02] shadow-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
