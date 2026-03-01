import api from './api';
import { STORAGE_KEYS } from '../constants';

// Authentication service
export const authService = {
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

  clearAuthStorage() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Login
  async login(credentials) {
    const response = await api.post('/auth/login/', credentials);
    const { user, tokens } = response.data;

    // Save tokens and user to localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user, tokens };
  },

  // Logout
  async logout() {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    try {
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthStorage();
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me/');
      const user = response.data;

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    } catch (error) {
      if (error.response?.status === 401) {
        this.clearAuthStorage();
      }
      throw error;
    }
  },

  // Update profile
  async updateProfile(data) {
    const payload = this.buildPayload(data);
    const response = await api.put('/auth/profile/', payload, payload instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    const user = response.data.user;

    // Update user in localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return user;
  },

  // Change password
  async changePassword(data) {
    const response = await api.post('/auth/change-password/', data);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // Get user from localStorage
  getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      this.clearAuthStorage();
      return null;
    }
  },
};

export default authService;
