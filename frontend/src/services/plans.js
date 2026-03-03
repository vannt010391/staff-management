import api from './api';

/**
 * Plans API Service
 * Handles all plan-related API calls (daily/weekly/monthly/yearly planning)
 */

export const plansService = {
  /**
   * Get all plans
   * @param {Object} params - Query parameters (plan_type, status, etc.)
   * @returns {Promise} List of plans
   */
  async getPlans(params = {}) {
    const response = await api.get('/hr/plans/', { params });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Get single plan by ID
   * @param {number} id - Plan ID
   * @returns {Promise} Plan details with goals and notes
   */
  async getPlan(id) {
    const response = await api.get(`/hr/plans/${id}/`);
    return response.data;
  },

  /**
   * Create new plan
   * @param {Object} data - Plan data
   * @returns {Promise} Created plan
   */
  async createPlan(data) {
    const response = await api.post('/hr/plans/', data);
    return response.data;
  },

  /**
   * Update existing plan
   * @param {number} id - Plan ID
   * @param {Object} data - Updated plan data
   * @returns {Promise} Updated plan
   */
  async updatePlan(id, data) {
    const response = await api.put(`/hr/plans/${id}/`, data);
    return response.data;
  },

  /**
   * Delete plan
   * @param {number} id - Plan ID
   * @returns {Promise}
   */
  async deletePlan(id) {
    const response = await api.delete(`/hr/plans/${id}/`);
    return response.data;
  },

  /**
   * Get current user's plans
   * @param {string} planType - Optional plan type filter (daily/weekly/monthly/yearly)
   * @returns {Promise} List of user's plans
   */
  async getMyPlans(planType = null) {
    const params = planType ? { plan_type: planType } : {};
    const response = await api.get('/hr/plans/my_plans/', { params });
    return response.data;
  },

  /**
   * Get active plans
   * @returns {Promise} List of active plans
   */
  async getActivePlans() {
    const response = await api.get('/hr/plans/active_plans/');
    return response.data;
  },

  /**
   * Add a goal to a plan
   * @param {number} planId - Plan ID
   * @param {Object} goalData - Goal data (title, description, priority, etc.)
   * @returns {Promise} Created goal
   */
  async addGoal(planId, goalData) {
    const response = await api.post(`/hr/plans/${planId}/add_goal/`, goalData);
    return response.data;
  },

  /**
   * Add a note to a plan
   * @param {number} planId - Plan ID
   * @param {string} noteText - Note content
   * @returns {Promise} Created note
   */
  async addNote(planId, noteText) {
    const response = await api.post(`/hr/plans/${planId}/add_note/`, { note: noteText });
    return response.data;
  },

  /**
   * Get notes list
   * @param {Object} params - Optional filters (plan, created_by)
   * @returns {Promise} List of notes
   */
  async getNotes(params = {}) {
    const response = await api.get('/hr/plan-notes/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Update existing note
   * @param {number} id - Note ID
   * @param {Object} data - Updated note payload
   * @returns {Promise} Updated note
   */
  async updateNote(id, data) {
    const response = await api.put(`/hr/plan-notes/${id}/`, data);
    return response.data;
  },

  /**
   * Delete note
   * @param {number} id - Note ID
   * @returns {Promise}
   */
  async deleteNote(id) {
    const response = await api.delete(`/hr/plan-notes/${id}/`);
    return response.data;
  },

  /**
   * Manager reviews a plan
   * @param {number} planId - Plan ID
   * @param {string} feedback - Manager feedback
   * @returns {Promise} Updated plan
   */
  async reviewPlan(planId, feedback) {
    const response = await api.post(`/hr/plans/${planId}/review/`, { manager_feedback: feedback });
    return response.data;
  },

  // Goal Management

  /**
   * Get single goal by ID
   * @param {number} id - Goal ID
   * @returns {Promise} Goal details
   */
  async getGoal(id) {
    const response = await api.get(`/hr/plan-goals/${id}/`);
    return response.data;
  },

  /**
   * Update existing goal
   * @param {number} id - Goal ID
   * @param {Object} data - Updated goal data
   * @returns {Promise} Updated goal
   */
  async updateGoal(id, data) {
    const response = await api.put(`/hr/plan-goals/${id}/`, data);
    return response.data;
  },

  /**
   * Delete goal
   * @param {number} id - Goal ID
   * @returns {Promise}
   */
  async deleteGoal(id) {
    const response = await api.delete(`/hr/plan-goals/${id}/`);
    return response.data;
  },

  /**
   * Toggle goal completion status
   * @param {number} id - Goal ID
   * @returns {Promise} Updated goal
   */
  async toggleGoalComplete(id) {
    const response = await api.post(`/hr/plan-goals/${id}/toggle_complete/`);
    return response.data;
  },

  // Daily Progress Tracking

  /**
   * Get daily progress entries for a plan
   * @param {number} planId - Plan ID
   * @param {Object} params - Query parameters (date, etc.)
   * @returns {Promise} List of daily progress entries
   */
  async getDailyProgress(planId, params = {}) {
    const response = await api.get('/hr/plan-daily-progress/', {
      params: { plan: planId, ...params }
    });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Log today's progress for a plan
   * @param {number} planId - Plan ID
   * @param {Object} data - Progress data (completed_goals_count, hours_worked, etc.)
   * @returns {Promise} Created/updated progress entry
   */
  async logTodayProgress(planId, data) {
    const response = await api.post('/hr/plan-daily-progress/log_today/', {
      plan: planId,
      ...data
    });
    return response.data;
  },

  /**
   * Create daily progress entry
   * @param {Object} data - Progress data (plan, date, completed_goals_count, etc.)
   * @returns {Promise} Created progress entry
   */
  async createDailyProgress(data) {
    const response = await api.post('/hr/plan-daily-progress/', data);
    return response.data;
  },

  /**
   * Update daily progress entry
   * @param {number} id - Progress entry ID
   * @param {Object} data - Updated progress data
   * @returns {Promise} Updated progress entry
   */
  async updateDailyProgress(id, data) {
    const response = await api.put(`/hr/plan-daily-progress/${id}/`, data);
    return response.data;
  },

  // Update History

  /**
   * Get update history for a plan
   * @param {number} planId - Plan ID
   * @returns {Promise} List of update history entries
   */
  async getUpdateHistory(planId) {
    const response = await api.get('/hr/plan-update-history/', {
      params: { plan: planId }
    });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  // Enhanced filtering for All Plans view

  /**
   * Get all plans with filters (for managers/admins)
   * @param {Object} params - Query parameters (user, department, plan_type, status, etc.)
   * @returns {Promise} List of plans
   */
  async getAllPlans(params = {}) {
    const response = await api.get('/hr/plans/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Get users that current user can assign plans to
   * @returns {Promise} List of assignable users
   */
  async getAssignableUsers() {
    const response = await api.get('/hr/plans/assignable_users/');
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  }
};

export default plansService;
