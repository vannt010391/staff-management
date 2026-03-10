import api from './api';

export const calendarService = {
  async getEvents(params = {}) {
    const response = await api.get('/events/', { params });
    return response.data.results || (Array.isArray(response.data) ? response.data : []);
  },

  async getEventsByDateRange(startDate, endDate) {
    const response = await api.get('/events/by_date_range/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getEvent(id) {
    const response = await api.get(`/events/${id}/`);
    return response.data;
  },

  async createEvent(data) {
    const response = await api.post('/events/', data);
    return response.data;
  },

  async updateEvent(id, data) {
    const response = await api.put(`/events/${id}/`, data);
    return response.data;
  },

  async deleteEvent(id) {
    const response = await api.delete(`/events/${id}/`);
    return response.data;
  },
};

export default calendarService;
