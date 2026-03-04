import api from './api';

const taskFilesService = {
  // Get all files for a task
  getTaskFiles: async (taskId) => {
    const response = await api.get('/task-files/', {
      params: { task: taskId },
    });
    return response.data;
  },

  // Upload a file
  uploadFile: async (taskId, fileData) => {
    const formData = new FormData();
    formData.append('task', taskId);
    formData.append('file', fileData.file);
    formData.append('file_type', fileData.file_type);
    if (fileData.comment) {
      formData.append('comment', fileData.comment);
    }

    const response = await api.post('/task-files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/task-files/${fileId}/`);
    return response.data;
  },
};

export default taskFilesService;
