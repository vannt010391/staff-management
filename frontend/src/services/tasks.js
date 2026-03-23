import api from './api';

/**
 * Tasks API Service
 * Handles all task-related API calls including files and comments
 */

export const tasksService = {
  /**
   * Get all tasks (với privacy filter từ backend)
   * @param {Object} params - Query parameters (status, priority, project, assigned_to, etc.)
   * @returns {Promise} List of tasks
   */
  async getTasks(params = {}) {
    const response = await api.get('/tasks/', { params });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Get single task by ID
   * @param {number} id - Task ID
   * @returns {Promise} Task details with files and comments
   */
  async getTask(id) {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  /**
   * Create new task
   * @param {Object} data - Task data
   * @returns {Promise} Created task
   */
  async createTask(data) {
    const response = await api.post('/tasks/', data);
    return response.data;
  },

  /**
   * Update existing task
   * @param {number} id - Task ID
   * @param {Object} data - Updated task data
   * @returns {Promise} Updated task
   */
  async updateTask(id, data) {
    const response = await api.put(`/tasks/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update task
   * @param {number} id - Task ID
   * @param {Object} data - Partial update data
   * @returns {Promise} Updated task
   */
  async patchTask(id, data) {
    const response = await api.patch(`/tasks/${id}/`, data);
    return response.data;
  },

  /**
   * Delete task
   * @param {number} id - Task ID
   * @returns {Promise}
   */
  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },

  /**
   * Assign task to user
   * @param {number} id - Task ID
   * @param {number} userId - User ID to assign to
   * @returns {Promise} Updated task
   */
  async assignTask(id, userId) {
    const response = await api.post(`/tasks/${id}/assign/`, {
      assigned_to: userId
    });
    return response.data;
  },

  async assignReviewer(id, reviewerId = null) {
    const payload = reviewerId ? { reviewer: reviewerId } : { reviewer: null };
    const response = await api.post(`/tasks/${id}/assign_reviewer/`, payload);
    return response.data;
  },

  /**
   * Change task status
   * @param {number} id - Task ID
   * @param {string} status - New status
   * @returns {Promise} Updated task
   */
  async changeStatus(id, status) {
    const response = await api.post(`/tasks/${id}/change-status/`, {
      status
    });
    return response.data;
  },

  async approveTask(id, payload = {}) {
    const response = await api.post(`/tasks/${id}/approve/`, payload);
    return response.data;
  },

  async rejectTask(id, payload = {}) {
    const response = await api.post(`/tasks/${id}/reject/`, payload);
    return response.data;
  },

  async getEarningsSummary(params = {}) {
    const response = await api.get('/tasks/earnings_summary/', { params });
    return response.data;
  },

  /**
   * Update stage progress for a task
   * @param {number} id - Task ID
   * @param {Object} stageProgress - Stage progress object with status for each stage
   * @returns {Promise} Updated task with new stage_progress
   */
  async updateStageProgress(id, stageProgress) {
    const response = await api.post(`/tasks/${id}/update_stage_progress/`, {
      stage_progress: stageProgress
    });
    return response.data;
  },

  /**
   * Upload file to task
   * @param {number} taskId - Task ID
   * @param {File} file - File to upload
   * @param {string} fileType - File type (reference, submission, revision, other)
   * @param {string} description - Optional description
   * @returns {Promise} Created file record
   */
  async uploadFile(taskId, file, fileType = 'other', description = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('task', taskId);
    formData.append('file_type', fileType);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/task-files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get files for a task
   * @param {number} taskId - Task ID
   * @returns {Promise} List of files
   */
  async getTaskFiles(taskId) {
    const response = await api.get('/task-files/', {
      params: { task: taskId }
    });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Delete file
   * @param {number} fileId - File ID
   * @returns {Promise}
   */
  async deleteFile(fileId) {
    const response = await api.delete(`/task-files/${fileId}/`);
    return response.data;
  },

  /**
   * Add comment to task
   * @param {number} taskId - Task ID
   * @param {string|Object} commentData - Comment text or object payload
   * @returns {Promise} Created comment
   */
  async addComment(taskId, commentData) {
    if (typeof commentData === 'string') {
      const response = await api.post('/task-comments/', {
        task: taskId,
        comment: commentData
      });
      return response.data;
    }

    const payload = commentData || {};
    const hasAttachment = !!payload.attachment;

    if (hasAttachment) {
      const formData = new FormData();
      formData.append('task', taskId);
      if (payload.comment) formData.append('comment', payload.comment);
      if (payload.design_rule) formData.append('design_rule', payload.design_rule);
      if (payload.is_passed !== undefined && payload.is_passed !== null) {
        formData.append('is_passed', payload.is_passed);
      }
      if (payload.parent) formData.append('parent', payload.parent);
      formData.append('attachment', payload.attachment);

      const response = await api.post('/task-comments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.post('/task-comments/', {
      task: taskId,
      comment: payload.comment || '',
      design_rule: payload.design_rule,
      is_passed: payload.is_passed,
      parent: payload.parent,
    });
    return response.data;
  },

  /**
   * Get comments for a task
   * @param {number} taskId - Task ID
   * @returns {Promise} List of comments
   */
  async getTaskComments(taskId) {
    const response = await api.get('/task-comments/', {
      params: { task: taskId }
    });
    // Handle paginated response from DRF
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  /**
   * Update comment
   * @param {number} commentId - Comment ID
   * @param {string|Object} commentData - Updated text or payload
   * @returns {Promise} Updated comment
   */
  async updateComment(commentId, commentData) {
    if (typeof commentData === 'string') {
      const response = await api.patch(`/task-comments/${commentId}/`, {
        comment: commentData
      });
      return response.data;
    }

    const payload = commentData || {};
    const hasAttachment = !!payload.attachment;

    if (hasAttachment) {
      const formData = new FormData();
      if (payload.comment !== undefined) formData.append('comment', payload.comment);
      if (payload.design_rule) formData.append('design_rule', payload.design_rule);
      if (payload.is_passed !== undefined && payload.is_passed !== null) {
        formData.append('is_passed', payload.is_passed);
      }
      if (payload.parent) formData.append('parent', payload.parent);
      formData.append('attachment', payload.attachment);

      const response = await api.patch(`/task-comments/${commentId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.patch(`/task-comments/${commentId}/`, {
      comment: payload.comment,
      design_rule: payload.design_rule,
      is_passed: payload.is_passed,
      parent: payload.parent,
    });
    return response.data;
  },

  /**
   * Delete comment
   * @param {number} commentId - Comment ID
   * @returns {Promise}
   */
  async deleteComment(commentId) {
    const response = await api.delete(`/task-comments/${commentId}/`);
    return response.data;
  },

  /**
   * Get task statistics for dashboard
   * @returns {Promise} Task statistics
   */
  async getTaskStats() {
    const response = await api.get('/tasks/stats/');
    return response.data;
  },

  /**
   * Get my tasks (for current user)
   * @param {Object} params - Query parameters
   * @returns {Promise} List of user's tasks
   */
  async getMyTasks(params = {}) {
    const response = await api.get('/tasks/my-tasks/', { params });
    return response.data;
  },

  async getChangeHistory(taskId) {
    const response = await api.get(`/tasks/${taskId}/change_history/`);
    return response.data;
  }
};

export default tasksService;
