import api from './api';

/**
 * Helper: Detect device information from browser
 */
const getDeviceInfo = () => {
  const ua = navigator.userAgent;

  // Detect device type
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const device_type = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';

  // Detect OS
  let device_os = 'Unknown';
  if (ua.includes('Win')) device_os = 'Windows';
  else if (ua.includes('Mac')) device_os = 'macOS';
  else if (ua.includes('Linux')) device_os = 'Linux';
  else if (ua.includes('Android')) device_os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) device_os = 'iOS';

  // Detect Browser
  let device_browser = 'Unknown';
  if (ua.includes('Edg')) device_browser = 'Edge';
  else if (ua.includes('Chrome')) device_browser = 'Chrome';
  else if (ua.includes('Firefox')) device_browser = 'Firefox';
  else if (ua.includes('Safari')) device_browser = 'Safari';

  return {
    device_type,
    device_os,
    device_browser,
    user_agent: ua
  };
};

/**
 * Helper: Get device location via Geolocation API
 */
const getDeviceLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    const options = {
      enableHighAccuracy: false, // Laptop/PC will use Wi-Fi, phone will use GPS
      timeout: 5000,
      maximumAge: 60000 // Cache for 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null); // Don't fail if location unavailable
      },
      options
    );
  });
};

/**
 * Helper: Reverse geocode coordinates to address
 * Uses OpenStreetMap Nominatim API (free, no API key needed)
 */
const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name || '';
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return '';
  }
};

/**
 * Helper: Collect all metadata for check-in/check-out
 */
const collectMetadata = async () => {
  // Get device info (always available)
  const deviceInfo = getDeviceInfo();

  // Try to get location (may fail if permission denied)
  const location = await getDeviceLocation();

  // If location available, get address
  let address = '';
  if (location) {
    address = await reverseGeocode(location.latitude, location.longitude);
  }

  return {
    ...deviceInfo,
    latitude: location?.latitude || null,
    longitude: location?.longitude || null,
    accuracy: location?.accuracy || null,
    address: address
  };
};

/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
const attendanceService = {
  /**
   * Get today's attendance status for current user
   */
  getTodayStatus: async () => {
    const response = await api.get('/hr/attendances/today/');
    return response.data;
  },

  /**
   * Check in for today
   * @param {Object} data - Check-in data (location, notes, status, metadata)
   * @param {boolean} skipMetadataCollection - If true, use metadata from data instead of collecting again
   */
  checkIn: async (data = {}, skipMetadataCollection = false) => {
    let metadata = {};
    if (skipMetadataCollection) {
      // Use provided metadata
      metadata = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        address: data.address,
        device_type: data.device_type,
        device_os: data.device_os,
        device_browser: data.device_browser,
        user_agent: data.user_agent
      };
    } else {
      // Collect device and location metadata
      metadata = await collectMetadata();
    }

    const response = await api.post(
      '/hr/attendances/check_in/',
      {
        location: data.location || '',
        notes: data.notes || '',
        status: data.status || 'present',
        // Include metadata
        ...metadata
      }
    );
    return response.data;
  },

  /**
   * Check out for today
   * @param {Object} data - Check-out data (location, notes, metadata)
   * @param {boolean} skipMetadataCollection - If true, use metadata from data instead of collecting again
   */
  checkOut: async (data = {}, skipMetadataCollection = false) => {
    let metadata = {};
    if (skipMetadataCollection) {
      // Use provided metadata
      metadata = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        address: data.address,
        device_type: data.device_type,
        device_os: data.device_os,
        device_browser: data.device_browser,
        user_agent: data.user_agent
      };
    } else {
      // Collect device and location metadata
      metadata = await collectMetadata();
    }

    const response = await api.post(
      '/hr/attendances/check_out/',
      {
        location: data.location || '',
        notes: data.notes || '',
        // Include metadata
        ...metadata
      }
    );
    return response.data;
  },

  /**
   * Get attendance history for current user
   * @param {Object} params - Query parameters (start_date, end_date, limit)
   */
  getMyHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api.get(`/hr/attendances/my_history/?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters (user_id, start_date, end_date)
   */
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const response = await api.get(`/hr/attendances/stats/?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get all attendances (admin/manager only)
   * @param {Object} params - Query parameters (user, date, status, page)
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.user) queryParams.append('user', params.user);
    if (params.date) queryParams.append('date', params.date);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);

    const response = await api.get(`/hr/attendances/?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get attendance by ID
   * @param {number} id - Attendance ID
   */
  getById: async (id) => {
    const response = await api.get(`/hr/attendances/${id}/`);
    return response.data;
  },

  /**
   * Update attendance (admin/manager only)
   * @param {number} id - Attendance ID
   * @param {Object} data - Updated data
   */
  update: async (id, data) => {
    const response = await api.patch(`/hr/attendances/${id}/`, data);
    return response.data;
  },

  /**
   * Delete attendance (admin only)
   * @param {number} id - Attendance ID
   */
  delete: async (id) => {
    const response = await api.delete(`/hr/attendances/${id}/`);
    return response.data;
  },

  /**
   * Get attendance settings
   */
  getSettings: async () => {
    const response = await api.get('/hr/attendance-settings/current/');
    return response.data;
  }
};

// Export helper for use in components (e.g., preview metadata before submit)
export { collectMetadata };

export default attendanceService;
