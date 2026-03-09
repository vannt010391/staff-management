import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Shield, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import usersService from '../services/users';
import { useAuthStore } from '../stores/authStore';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    new_password2: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await usersService.getUser(id);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user detail:', error);
        toast.error('Failed to load user detail');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  }

  if (!user) {
    return <div className="p-6 text-gray-600">User not found.</div>;
  }

  const canChangeThisUserPassword = currentUser?.role === 'admin';

  const handleChangeUserPassword = async (e) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!passwordData.new_password || !passwordData.new_password2) {
      toast.error('Please fill in all password fields');
      return;
    }

    // Validate minimum password length
    if (passwordData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    // Validate passwords match
    if (passwordData.new_password !== passwordData.new_password2) {
      toast.error('Password confirmation does not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await usersService.changePassword(user.id, {
        new_password: passwordData.new_password,
        new_password2: passwordData.new_password2,
      });
      setPasswordData({ new_password: '', new_password2: '' });
      toast.success(`Password updated successfully for ${user.username}`);
    } catch (error) {
      // Handle different error formats
      const errorData = error.response?.data;
      if (errorData) {
        if (errorData.new_password) {
          toast.error(errorData.new_password[0] || errorData.new_password);
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        } else {
          toast.error('Failed to update user password');
        }
      } else {
        toast.error('Failed to update user password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const fullName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/users')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-gray-600 mt-1">@{user.username}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={User} label="Username" value={`@${user.username}`} />
          <Info icon={Mail} label="Email" value={user.email || '-'} />
          <Info icon={Phone} label="Phone" value={user.phone || '-'} />
          <Info icon={Shield} label="Role" value={formatRole(user.role)} />
          <Info icon={Shield} label="Bank Name" value={user.bank_name || '-'} />
          <Info icon={Shield} label="Account Number" value={user.bank_account_number || '-'} />
          <Info icon={Shield} label="Account Holder" value={user.bank_account_holder || '-'} />
          <Info icon={Shield} label="Bank Branch" value={user.bank_branch || '-'} />
          <Info icon={Shield} label="Date of Birth" value={user.date_of_birth || '-'} />
          <Info icon={Shield} label="Address" value={user.address || '-'} />
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Bio</p>
            <p className="font-medium text-gray-900 whitespace-pre-line">{user.bio || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 mb-2">Bank QR Code</p>
            {user.bank_qr_code ? (
              <a href={user.bank_qr_code} target="_blank" rel="noreferrer" className="inline-block">
                <img src={user.bank_qr_code} alt="Bank QR" className="w-44 h-44 object-contain border border-gray-200 rounded-lg bg-white" />
              </a>
            ) : (
              <p className="font-medium text-gray-900">-</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user.is_active ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium text-gray-900">{user.is_active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>

        {canChangeThisUserPassword && (
          <form onSubmit={handleChangeUserPassword} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Change User Password
            </h2>
            <p className="text-sm text-gray-600">Set a new password for {user.username}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
                  placeholder="New password (min. 8 chars)"
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={8}
                />
                {passwordData.new_password && passwordData.new_password.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">Minimum 8 characters required</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  value={passwordData.new_password2}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password2: e.target.value }))}
                  placeholder="Confirm new password"
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={8}
                />
                {passwordData.new_password2 && passwordData.new_password !== passwordData.new_password2 && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function formatRole(role) {
  if (!role) return '-';
  return role.split('_').map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1)).join(' ');
}
