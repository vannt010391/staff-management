import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  Users,
  Plus,
  Search,
  Shield,
  Briefcase,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Crown,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import usersService from '../services/users';
import UserForm from '../components/users/UserForm';
import { Table, ViewToggle } from '../components/ui';

export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole !== 'all') params.role = filterRole;
      if (filterStatus !== 'all') params.is_active = filterStatus === 'active';

      const data = await usersService.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await usersService.deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleFormSuccess = async () => {
    await fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    freelancers: users.filter(u => u.role === 'freelancer').length,
    managers: users.filter(u => u.role === 'manager' || u.role === 'admin').length,
    active: users.filter(u => u.is_active).length,
  };

  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const roleConfig = {
    admin: {
      icon: Crown,
      color: 'from-yellow-400 to-orange-500',
      badge: 'bg-yellow-100 text-yellow-800',
      label: 'Admin'
    },
    manager: {
      icon: Shield,
      badge: 'bg-blue-100 text-blue-800',
      label: 'Manager'
    },
    team_lead: {
      icon: Users,
      badge: 'bg-purple-100 text-purple-800',
      label: 'Team Lead'
    },
    staff: {
      icon: Briefcase,
      badge: 'bg-green-100 text-green-800',
      label: 'Staff'
    },
    freelancer: {
      icon: Briefcase,
      badge: 'bg-purple-100 text-purple-800',
      label: 'Freelancer'
    },
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      width: '25%',
      render: (user) => {
        const role = roleConfig[user.role] || roleConfig.freelancer;
        const fullName = user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.username;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-br ${role.color} rounded-lg`}>
              <role.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{fullName}</div>
              <div className="text-xs text-gray-500">@{user.username}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'email',
      label: 'Email',
      width: '20%',
      render: (user) => (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-3 w-3 text-blue-600" />
          <span className="truncate">{user.email}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '15%',
      render: (user) => user.phone ? (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-3 w-3 text-green-600" />
          <span>{user.phone}</span>
        </div>
      ) : '-'
    },
    {
      key: 'role',
      label: 'Role',
      width: '12%',
      render: (user) => {
        const role = roleConfig[user.role] || roleConfig.freelancer;
        return (
          <span className={`${role.badge} px-2 py-1 rounded-lg text-xs font-bold`}>
            {role.label}
          </span>
        );
      }
    },
    {
      key: 'is_active',
      label: 'Status',
      width: '10%',
      render: (user) => user.is_active ? (
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span className="font-semibold">Active</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <XCircle className="h-4 w-4" />
          <span className="font-semibold">Inactive</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '8%',
      render: (user) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${user.id}`);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          {canManageUsers && (
            <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUser(user);
                setShowForm(true);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-3 w-3 text-blue-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserToDelete(user);
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
            </>
          )}
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6 space-y-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-xl shadow-md border border-white/50 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Team Members
              </h1>
            </div>
            <p className="text-gray-600 text-sm ml-8">
              Manage your team and freelancers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {canManageUsers && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowForm(true);
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total.toString()}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Briefcase}
          label="Freelancers"
          value={stats.freelancers.toString()}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={Shield}
          label="Managers"
          value={stats.managers.toString()}
          color="from-orange-500 to-red-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Active"
          value={stats.active.toString()}
          color="from-green-500 to-emerald-500"
        />
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-xl shadow-md border border-white/50 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-medium"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="team_lead">Team Lead</option>
            <option value="staff">Staff</option>
            <option value="freelancer">Freelancer</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Grid/List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-xl shadow-md border border-white/50 p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No users found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first user'}
          </p>
          {canManageUsers && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        <Table columns={columns} data={filteredUsers} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <UserCard
              key={user.id}
              user={user}
              index={index}
              currentUser={currentUser}
              onView={() => {
                navigate(`/users/${user.id}`);
              }}
              onEdit={() => {
                setSelectedUser(user);
                setShowForm(true);
              }}
              onDelete={() => {
                setUserToDelete(user);
                setShowDeleteConfirm(true);
              }}
              canEdit={canManageUsers}
            />
          ))}
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user{' '}
              <span className="font-semibold">{userToDelete.username}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="group relative bg-white/60 backdrop-blur-xl rounded-xl shadow-md border border-white/50 p-4 hover:shadow-lg transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-600">{label}</p>
          <p className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-b-xl`} />
    </div>
  );
}

function UserCard({ user, index, currentUser, onView, onEdit, onDelete, canEdit }) {
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
    team_lead: {
      icon: Users,
      color: 'from-purple-400 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
      badge: 'bg-purple-100 text-purple-800',
      label: 'Team Lead'
    },
    staff: {
      icon: Briefcase,
      color: 'from-green-400 to-emerald-500',
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      badge: 'bg-green-100 text-green-800',
      label: 'Staff'
    },
    freelancer: {
      icon: Briefcase,
      color: 'from-purple-400 to-pink-500',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
      badge: 'bg-purple-100 text-purple-800',
      label: 'Freelancer'
    },
  };

  const role = roleConfig[user.role] || roleConfig.freelancer;
  const fullName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.username;

  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-xl shadow-md border border-white/50 hover:shadow-lg transition-all duration-500 overflow-hidden hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header with Gradient */}
      <div className={`${role.bg} p-4 border-b border-white/50 relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${role.color} opacity-10`} />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative p-2 bg-gradient-to-br ${role.color} rounded-xl shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
              <role.icon className="h-6 w-6 text-white" />
              {user.is_active && (
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {fullName}
              </h3>
              <p className="text-xs text-gray-600">@{user.username}</p>
            </div>
          </div>
          <span className={`${role.badge} px-2 py-0.5 rounded-lg text-xs font-bold`}>
            {role.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Mail className="h-3 w-3 text-blue-600" />
            </div>
            <span className="text-gray-700 font-medium truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Phone className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-gray-700 font-medium">{user.phone}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 py-1.5">
          {user.is_active ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Inactive</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={onView}
            className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4 text-indigo-600" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
