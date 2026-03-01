import api from './api';

/**
 * Projects API Service
 * Handles all project-related API calls
 */

export const projectsService = {
  /**
   * Get all projects
   * @param {Object} params - Query parameters (status, search, etc.)
   * @returns {Promise} List of projects
   */
  async getProjects(params = {}) {
    const response = await api.get('/projects/', { params });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Get single project by ID
   * @param {number} id - Project ID
   * @returns {Promise} Project details
   */
  async getProject(id) {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  /**
   * Create new project
   * @param {Object} data - Project data
   * @returns {Promise} Created project
   */
  async createProject(data) {
    const response = await api.post('/projects/', data);
    return response.data;
  },

  /**
   * Update existing project
   * @param {number} id - Project ID
   * @param {Object} data - Updated project data
   * @returns {Promise} Updated project
   */
  async updateProject(id, data) {
    const response = await api.put(`/projects/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update project
   * @param {number} id - Project ID
   * @param {Object} data - Partial update data
   * @returns {Promise} Updated project
   */
  async patchProject(id, data) {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  },

  /**
   * Delete project
   * @param {number} id - Project ID
   * @returns {Promise}
   */
  async deleteProject(id) {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  /**
   * Get project topics
   * @param {number} projectId - Project ID
   * @returns {Promise} List of topics
   */
  async getTopics(projectId) {
    const response = await api.get(`/projects/${projectId}/topics/`);
    return response.data;
  },

  /**
   * Create project topic
   * @param {number} projectId - Project ID
   * @param {Object} data - Topic data
   * @returns {Promise} Created topic
   */
  async createTopic(projectId, data) {
    const response = await api.post(`/projects/${projectId}/topics/`, data);
    return response.data;
  },

  /**
   * Get all topics
   * @param {Object} params - Query params (project, search, ordering)
   * @returns {Promise} List of topics
   */
  async getAllTopics(params = {}) {
    const response = await api.get('/topics/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Create topic via topic endpoint
   * @param {Object} data - Topic payload
   * @returns {Promise} Created topic
   */
  async createTopicItem(data) {
    const response = await api.post('/topics/', data);
    return response.data;
  },

  /**
   * Update topic
   * @param {number} id - Topic ID
   * @param {Object} data - Updated payload
   * @returns {Promise} Updated topic
   */
  async updateTopic(id, data) {
    const response = await api.put(`/topics/${id}/`, data);
    return response.data;
  },

  /**
   * Delete topic
   * @param {number} id - Topic ID
   * @returns {Promise}
   */
  async deleteTopic(id) {
    const response = await api.delete(`/topics/${id}/`);
    return response.data;
  },

  /**
   * Get design rules for project
   * @param {number} projectId - Project ID
   * @returns {Promise} List of design rules
   */
  async getDesignRules(projectId) {
    const response = await api.get(`/projects/${projectId}/design-rules/`);
    return response.data;
  },

  /**
   * Create design rule
   * @param {number} projectId - Project ID
   * @param {Object} data - Design rule data
   * @returns {Promise} Created design rule
   */
  async createDesignRule(projectId, data) {
    const response = await api.post('/design-rules/', {
      ...data,
      project: projectId,
    });
    return response.data;
  },

  /**
   * Get all design rules
   * @param {Object} params - Query params (project, category, is_required, search)
   * @returns {Promise} List of design rules
   */
  async getAllDesignRules(params = {}) {
    const response = await api.get('/design-rules/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Create design rule directly
   * @param {Object} data - Design rule payload
   * @returns {Promise} Created design rule
   */
  async createDesignRuleItem(data) {
    const response = await api.post('/design-rules/', data);
    return response.data;
  },

  /**
   * Update design rule
   * @param {number} id - Rule ID
   * @param {Object} data - Updated payload
   * @returns {Promise} Updated design rule
   */
  async updateDesignRule(id, data) {
    const response = await api.put(`/design-rules/${id}/`, data);
    return response.data;
  },

  /**
   * Delete design rule
   * @param {number} id - Rule ID
   * @returns {Promise}
   */
  async deleteDesignRule(id) {
    const response = await api.delete(`/design-rules/${id}/`);
    return response.data;
  },

  /**
   * Get project statistics
   * @param {number} id - Project ID
   * @returns {Promise} Project statistics
   */
  async getProjectStats(id) {
    const response = await api.get(`/projects/${id}/stats/`);
    return response.data;
  }
};

export default projectsService;
