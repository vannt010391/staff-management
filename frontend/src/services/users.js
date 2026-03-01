import api from './api';

/**
 * Users API Service
 * Handles all user-related API calls
 */

export const usersService = {
  buildPayload(data = {}) {
    const hasFile = Object.values(data).some((value) => value instanceof File || value instanceof Blob);
    if (!hasFile) return data;

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(key, value);
    });
    return formData;
  },
  /**
   * Get all users
   * @param {Object} params - Query parameters (role, is_active, search, etc.)
   * @returns {Promise} List of users
   */
  async getUsers(params = {}) {
    const response = await api.get('/users/', { params });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Get single user by ID
   * @param {number} id - User ID
   * @returns {Promise} User details
   */
  async getUser(id) {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },

  /**
   * Create new user
   * @param {Object} data - User data (username, email, password, role, etc.)
   * @returns {Promise} Created user
   */
  async createUser(data) {
    const payload = this.buildPayload(data);
    const response = await api.post('/users/', payload, payload instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  /**
   * Update existing user
   * @param {number} id - User ID
   * @param {Object} data - Updated user data
   * @returns {Promise} Updated user
   */
  async updateUser(id, data) {
    const payload = this.buildPayload(data);
    const response = await api.put(`/users/${id}/`, payload, payload instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  /**
   * Partially update user
   * @param {number} id - User ID
   * @param {Object} data - Partial update data
   * @returns {Promise} Updated user
   */
  async patchUser(id, data) {
    const payload = this.buildPayload(data);
    const response = await api.patch(`/users/${id}/`, payload, payload instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return response.data;
  },

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise}
   */
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise}
   */
  async changePassword(id, data) {
    const response = await api.post(`/users/${id}/change-password/`, data);
    return response.data;
  },

  /**
   * Activate user
   * @param {number} id - User ID
   * @returns {Promise} Updated user
   */
  async activateUser(id) {
    const response = await api.post(`/users/${id}/activate/`);
    return response.data;
  },

  /**
   * Deactivate user
   * @param {number} id - User ID
   * @returns {Promise} Updated user
   */
  async deactivateUser(id) {
    const response = await api.post(`/users/${id}/deactivate/`);
    return response.data;
  },

  /**
   * Update user avatar
   * @param {number} id - User ID
   * @param {File} avatarFile - Avatar image file
   * @returns {Promise} Updated user
   */
  async updateAvatar(id, avatarFile) {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await api.patch(`/users/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get user statistics
   * @param {number} id - User ID
   * @returns {Promise} User statistics (tasks, earnings, etc.)
   */
  async getUserStats(id) {
    const response = await api.get(`/users/${id}/stats/`);
    return response.data;
  },

  /**
   * Get users by role
   * @param {string} role - Role name (admin, manager, freelancer, etc.)
   * @returns {Promise} List of users with specified role
   */
  async getUsersByRole(role) {
    const response = await api.get('/users/', {
      params: { role }
    });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Search users
   * @param {string} query - Search query
   * @returns {Promise} List of matching users
   */
  async searchUsers(query) {
    const response = await api.get('/users/', {
      params: { search: query }
    });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  }
};

export const getUsers = (params = {}) => usersService.getUsers(params);
export const getUser = (id) => usersService.getUser(id);

export default usersService;
