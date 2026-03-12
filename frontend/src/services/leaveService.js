import api from './api';

const leaveService = {
  // Leave Types
  getLeaveTypes: async () => {
    const response = await api.get('/hr/leave-types/');
    return response.data;
  },

  // Leave Balance
  getMyBalance: async (year = new Date().getFullYear()) => {
    const response = await api.get(`/hr/leave-balances/my_balance/?year=${year}`);
    return response.data;
  },

  // Leave Requests - Employee
  getMyRequests: async () => {
    const response = await api.get('/hr/leave-requests/my_requests/');
    return response.data;
  },

  createRequest: async (data) => {
    const response = await api.post('/hr/leave-requests/', data);
    return response.data;
  },

  // Leave Requests - Manager
  getPendingApprovals: async () => {
    const response = await api.get('/hr/leave-requests/pending_approvals/');
    return response.data;
  },

  getAllRequests: async () => {
    const response = await api.get('/hr/leave-requests/');
    return response.data;
  },

  processRequest: async (id, action, rejectionReason = '') => {
    const response = await api.post(`/hr/leave-requests/${id}/process_request/`, {
      action,
      rejection_reason: rejectionReason,
    });
    return response.data;
  }
};

export default leaveService;
