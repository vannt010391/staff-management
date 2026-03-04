import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
const attendanceService = {
  /**
   * Get today's attendance status for current user
   */
  getTodayStatus: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/hr/attendances/today/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Check in for today
   * @param {Object} data - Check-in data (location, notes, status)
   */
  checkIn: async (data = {}) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/attendances/check_in/`,
      {
        location: data.location || '',
        notes: data.notes || '',
        status: data.status || 'present'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Check out for today
   * @param {Object} data - Check-out data (location, notes)
   */
  checkOut: async (data = {}) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/attendances/check_out/`,
      {
        location: data.location || '',
        notes: data.notes || ''
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Get attendance history for current user
   * @param {Object} params - Query parameters (start_date, end_date, limit)
   */
  getMyHistory: async (params = {}) => {
    const token = localStorage.getItem('access_token');
    const queryParams = new URLSearchParams();

    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await axios.get(
      `${API_URL}/hr/attendances/my_history/?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Get attendance statistics
   * @param {Object} params - Query parameters (user_id, start_date, end_date)
   */
  getStats: async (params = {}) => {
    const token = localStorage.getItem('access_token');
    const queryParams = new URLSearchParams();

    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const response = await axios.get(
      `${API_URL}/hr/attendances/stats/?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Get all attendances (admin/manager only)
   * @param {Object} params - Query parameters (user, date, status, page)
   */
  getAll: async (params = {}) => {
    const token = localStorage.getItem('access_token');
    const queryParams = new URLSearchParams();

    if (params.user) queryParams.append('user', params.user);
    if (params.date) queryParams.append('date', params.date);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);

    const response = await axios.get(
      `${API_URL}/hr/attendances/?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Get attendance by ID
   * @param {number} id - Attendance ID
   */
  getById: async (id) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/hr/attendances/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Update attendance (admin/manager only)
   * @param {number} id - Attendance ID
   * @param {Object} data - Updated data
   */
  update: async (id, data) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.patch(
      `${API_URL}/hr/attendances/${id}/`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  },

  /**
   * Delete attendance (admin only)
   * @param {number} id - Attendance ID
   */
  delete: async (id) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.delete(`${API_URL}/hr/attendances/${id}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get attendance settings
   */
  getSettings: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/hr/attendance-settings/current/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

export default attendanceService;
