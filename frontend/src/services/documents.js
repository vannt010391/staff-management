import api from './api';

export const documentsService = {
  async getDocuments(params = {}) {
    const response = await api.get('/documents/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  async createDocument(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      formData.append(key, value);
    });

    const response = await api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateDocument(id, data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      formData.append(key, value);
    });

    const response = await api.put(`/documents/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}/`);
    return response.data;
  },
};

export default documentsService;
