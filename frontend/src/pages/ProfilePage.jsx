import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Save, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const location = useLocation();
  const { loadUser } = useAuthStore();
  const passwordSectionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    bio: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    bank_branch: '',
    bank_qr_code: null,
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!loading && location.hash === '#change-password' && passwordSectionRef.current) {
      passwordSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.hash]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      setProfileData((prev) => ({
        ...prev,
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        bio: user.bio || '',
        bank_name: user.bank_name || '',
        bank_account_number: user.bank_account_number || '',
        bank_account_holder: user.bank_account_holder || '',
        bank_branch: user.bank_branch || '',
      }));
      setCurrentQr(user.bank_qr_code || '');
    } catch (_error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const [currentQr, setCurrentQr] = useState('');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const payload = {
        ...profileData,
        bank_qr_code: profileData.bank_qr_code || undefined,
      };
      const updatedUser = await authService.updateProfile(payload);
      setCurrentQr(updatedUser.bank_qr_code || currentQr);
      setProfileData((prev) => ({ ...prev, bank_qr_code: null }));
      await loadUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordData.new_password !== passwordData.new_password2) {
      toast.error('New password confirmation does not match');
      return;
    }

    // Validate minimum password length
    if (passwordData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    // Validate all fields are filled
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.new_password2) {
      toast.error('All password fields are required');
      return;
    }

    try {
      setSavingPassword(true);
      await authService.changePassword(passwordData);
      setPasswordData({ old_password: '', new_password: '', new_password2: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      // Handle different error formats
      const errorData = error.response?.data;
      if (errorData) {
        // Check for field-specific errors
        if (errorData.old_password) {
          toast.error(errorData.old_password[0] || errorData.old_password);
        } else if (errorData.new_password) {
          toast.error(errorData.new_password[0] || errorData.new_password);
        } else if (errorData.detail) {
          toast.error(errorData.detail);
        } else {
          toast.error('Failed to change password');
        }
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          My Profile
        </h1>
      </div>

      <form onSubmit={handleUpdateProfile} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Profile Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="first_name" value={profileData.first_name} onChange={handleProfileChange} placeholder="First Name" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="last_name" value={profileData.last_name} onChange={handleProfileChange} placeholder="Last Name" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="email" type="email" value={profileData.email} onChange={handleProfileChange} placeholder="Email" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="Phone" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="date_of_birth" type="date" value={profileData.date_of_birth} onChange={handleProfileChange} className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Address" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="bank_name" value={profileData.bank_name} onChange={handleProfileChange} placeholder="Bank Name" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="bank_account_number" value={profileData.bank_account_number} onChange={handleProfileChange} placeholder="Bank Account Number" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="bank_account_holder" value={profileData.bank_account_holder} onChange={handleProfileChange} placeholder="Bank Account Holder" className="px-3 py-2 border border-gray-300 rounded-lg" />
          <input name="bank_branch" value={profileData.bank_branch} onChange={handleProfileChange} placeholder="Bank Branch" className="px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <textarea name="bio" value={profileData.bio} onChange={handleProfileChange} rows={3} placeholder="Bio" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Bank QR Code</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileData((prev) => ({ ...prev, bank_qr_code: e.target.files?.[0] || null }))}
            className="px-3 py-2 border border-gray-300 rounded-lg w-full"
          />
          {currentQr && (
            <a href={currentQr} target="_blank" rel="noreferrer" className="inline-block">
              <img src={currentQr} alt="Current QR" className="w-40 h-40 object-contain border border-gray-200 rounded-lg bg-white" />
            </a>
          )}
        </div>

        <button type="submit" disabled={savingProfile} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form id="change-password" ref={passwordSectionRef} onSubmit={handleChangePassword} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          Change Password
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="password"
              placeholder="Current password"
              value={passwordData.old_password}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, old_password: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              minLength={1}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="New password (min. 8 chars)"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
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
              placeholder="Confirm new password"
              value={passwordData.new_password2}
              onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password2: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              minLength={8}
            />
            {passwordData.new_password2 && passwordData.new_password !== passwordData.new_password2 && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <button type="submit" disabled={savingPassword} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2">
          <Save className="h-4 w-4" />
          {savingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
