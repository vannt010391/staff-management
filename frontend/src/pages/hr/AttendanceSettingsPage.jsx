import { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function AttendanceSettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [settings, setSettings] = useState({
    work_start_time: '09:00',
    work_end_time: '18:00',
    late_threshold_minutes: 15,
    require_checkout: true,
    allow_remote_checkin: true,
    send_reminder_notifications: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/attendance-settings/current/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${API_BASE_URL}/hr/attendance-settings/${settings.id}/`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSettings(response.data);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Calculate actual late time display
  const calculateLateTime = () => {
    if (!settings.work_start_time || !settings.late_threshold_minutes) return '';

    const [hours, minutes] = settings.work_start_time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + parseInt(settings.late_threshold_minutes);
    const lateHours = Math.floor(totalMinutes / 60);
    const lateMinutes = totalMinutes % 60;

    return `${String(lateHours).padStart(2, '0')}:${String(lateMinutes).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Attendance Settings</h1>
        <p className="text-gray-600">Configure work hours and attendance rules</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 flex items-center space-x-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow">
        {/* Work Hours Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Work Hours</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Start Time
              </label>
              <input
                type="time"
                value={settings.work_start_time}
                onChange={(e) => handleChange('work_start_time', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Standard time employees should start work
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work End Time
              </label>
              <input
                type="time"
                value={settings.work_end_time}
                onChange={(e) => handleChange('work_end_time', e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Standard time employees should end work
              </p>
            </div>
          </div>
        </div>

        {/* Late Policy Section */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Late Policy</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Threshold (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={settings.late_threshold_minutes}
                onChange={(e) => handleChange('late_threshold_minutes', parseInt(e.target.value))}
                disabled={!isAdmin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minutes after start time before marking as late
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Current Policy:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>
                      Work starts at <strong>{settings.work_start_time}</strong>
                    </li>
                    <li>
                      Employees checking in after <strong>{calculateLateTime()}</strong> will be marked as late
                    </li>
                    <li>
                      Grace period: <strong>{settings.late_threshold_minutes} minutes</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Settings Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Settings</h2>

          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_checkout}
                onChange={(e) => handleChange('require_checkout', e.target.checked)}
                disabled={!isAdmin}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Require Check-out</span>
                <p className="text-xs text-gray-500">
                  Users must check out at the end of their work day
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_remote_checkin}
                onChange={(e) => handleChange('allow_remote_checkin', e.target.checked)}
                disabled={!isAdmin}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Allow Remote Check-in</span>
                <p className="text-xs text-gray-500">
                  Allow employees to check in from remote locations (not just office)
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.send_reminder_notifications}
                onChange={(e) => handleChange('send_reminder_notifications', e.target.checked)}
                disabled={!isAdmin}
                className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Send Reminder Notifications</span>
                <p className="text-xs text-gray-500">
                  Send notifications to remind users to check in/out
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
          {!isAdmin ? (
            <div className="text-sm text-gray-600 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>Only administrators can modify these settings</span>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </div>
          )}

          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
