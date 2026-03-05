import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const leaveService = {
  // Leave Types
  getLeaveTypes: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/hr/leave-types/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Leave Balance
  getMyBalance: async (year = new Date().getFullYear()) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-balances/my_balance/?year=${year}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Leave Requests - Employee
  getMyRequests: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/my_requests/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  createRequest: async (data) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/leave-requests/`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Leave Requests - Manager
  getPendingApprovals: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/pending_approvals/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getAllRequests: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  processRequest: async (id, action, rejectionReason = '') => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/leave-requests/${id}/process_request/`,
      { action, rejection_reason: rejectionReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

export default leaveService;
