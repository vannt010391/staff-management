import api from './api';
import { STORAGE_KEYS } from '../constants';

// Authentication service
export const authService = {
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
      // Clear local storage regardless
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/me/');
    const user = response.data;

    // Update user in localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return user;
  },

  // Update profile
  async updateProfile(data) {
    const response = await api.put('/auth/profile/', data);
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
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;
