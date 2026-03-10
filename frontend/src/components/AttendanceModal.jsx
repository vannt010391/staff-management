import { useState, useEffect } from 'react';
import { X, Clock, MapPin, FileText, Monitor, RefreshCw } from 'lucide-react';
import attendanceService, { collectMetadata } from '../services/attendanceService';

/**
 * AttendanceModal - Modal for check-in/check-out
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSuccess - Success callback
 * @param {string} props.type - 'check-in' or 'check-out'
 */
export default function AttendanceModal({ isOpen, onClose, onSuccess, type = 'check-in' }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    notes: '',
    status: 'present' // For check-in only
  });
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        location: '',
        notes: '',
        status: 'present'
      });
      setError('');
      // Collect metadata when modal opens
      loadMetadata();
    }
  }, [isOpen]);

  const loadMetadata = async () => {
    setMetadataLoading(true);
    try {
      const data = await collectMetadata();
      setMetadata(data);
      // Auto-fill address if available
      if (data.address) {
        setFormData(prev => ({ ...prev, location: data.address }));
      }
    } catch (error) {
      console.error('Failed to collect metadata:', error);
    } finally {
      setMetadataLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data with the already-collected metadata
      const submitData = {
        location: formData.location,
        notes: formData.notes,
        ...(type === 'check-in' && { status: formData.status }),
        // Include metadata if available, otherwise it will be empty
        latitude: metadata?.latitude || null,
        longitude: metadata?.longitude || null,
        accuracy: metadata?.accuracy || null,
        address: metadata?.address || '',
        device_type: metadata?.device_type || '',
        device_os: metadata?.device_os || '',
        device_browser: metadata?.device_browser || '',
        user_agent: metadata?.user_agent || ''
      };

      let response;
      if (type === 'check-in') {
        // Pass metadata directly to skip re-collection
        response = await attendanceService.checkIn(submitData, true);
      } else {
        // Pass metadata directly to skip re-collection
        response = await attendanceService.checkOut(submitData, true);
      }

      if (onSuccess) {
        onSuccess(response);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${type}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isCheckIn = type === 'check-in';
  const title = isCheckIn ? 'Check In' : 'Check Out';
  const buttonText = isCheckIn ? 'Check In' : 'Check Out';
  const buttonColor = isCheckIn ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isCheckIn ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Clock className={`w-6 h-6 ${isCheckIn ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Current Time Display */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Current Time</p>
            <p className="text-2xl font-semibold text-gray-800">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Metadata Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-800 flex items-center">
                <Monitor className="w-4 h-4 mr-1" />
                Check-in Information
              </p>
              <button
                type="button"
                onClick={loadMetadata}
                disabled={metadataLoading}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Refresh location"
              >
                <RefreshCw className={`w-4 h-4 ${metadataLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {metadataLoading ? (
              <p className="text-sm text-gray-600">Detecting location and device...</p>
            ) : metadata ? (
              <ul className="text-sm text-gray-700 space-y-1">
                <li>🖥️ Device: {metadata.device_type} ({metadata.device_os})</li>
                <li>🌐 Browser: {metadata.device_browser}</li>
                {metadata.latitude && metadata.longitude ? (
                  <>
                    <li>📍 Location: {metadata.latitude.toFixed(6)}, {metadata.longitude.toFixed(6)}</li>
                    <li>🎯 Accuracy: ±{Math.round(metadata.accuracy)}m</li>
                    {metadata.address && <li>📌 Address: {metadata.address}</li>}
                  </>
                ) : (
                  <li className="text-yellow-700">⚠️ Location unavailable (permission denied or not supported)</li>
                )}
                <li className="text-xs text-gray-500 mt-2">🔒 IP address will be recorded for security</li>
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Failed to collect information</p>
            )}
          </div>

          {/* Status Selection (Check-in only) */}
          {isCheckIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="present">Present</option>
                <option value="wfh">Work From Home</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
          )}

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Office, Home, Client Site"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${buttonColor}`}
              disabled={loading}
            >
              {loading ? 'Processing...' : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
