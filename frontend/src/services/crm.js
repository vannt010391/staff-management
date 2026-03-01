import api from './api';

// Customer Stages
export const getStages = async () => {
  const response = await api.get('/crm/stages/');
  return response.data;
};

export const createStage = async (data) => {
  const response = await api.post('/crm/stages/', data);
  return response.data;
};

export const updateStage = async (id, data) => {
  const response = await api.put(`/crm/stages/${id}/`, data);
  return response.data;
};

export const deleteStage = async (id) => {
  const response = await api.delete(`/crm/stages/${id}/`);
  return response.data;
};

export const toggleStageActive = async (id) => {
  const response = await api.post(`/crm/stages/${id}/toggle_active/`);
  return response.data;
};

// Expense Types
export const getExpenseTypes = async () => {
  const response = await api.get('/crm/expense-types/');
  return response.data;
};

export const createExpenseType = async (data) => {
  const response = await api.post('/crm/expense-types/', data);
  return response.data;
};

export const updateExpenseType = async (id, data) => {
  const response = await api.put(`/crm/expense-types/${id}/`, data);
  return response.data;
};

export const deleteExpenseType = async (id) => {
  const response = await api.delete(`/crm/expense-types/${id}/`);
  return response.data;
};

export const toggleExpenseTypeActive = async (id) => {
  const response = await api.post(`/crm/expense-types/${id}/toggle_active/`);
  return response.data;
};

// Customers
export const getCustomers = async (params = {}) => {
  const response = await api.get('/crm/customers/', { params });
  return response.data;
};

export const getCustomer = async (id) => {
  const response = await api.get(`/crm/customers/${id}/`);
  return response.data;
};

export const createCustomer = async (data) => {
  const response = await api.post('/crm/customers/', data);
  return response.data;
};

export const updateCustomer = async (id, data) => {
  const response = await api.put(`/crm/customers/${id}/`, data);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/crm/customers/${id}/`);
  return response.data;
};

export const getCustomerTimeline = async (id) => {
  const response = await api.get(`/crm/customers/${id}/timeline/`);
  return response.data;
};

export const getCustomerProjects = async (id) => {
  const response = await api.get(`/crm/customers/${id}/projects/`);
  return response.data;
};

export const moveCustomerStage = async (id, stageId) => {
  const response = await api.post(`/crm/customers/${id}/move_stage/`, {
    stage_id: stageId
  });
  return response.data;
};

export const getPipelineStats = async () => {
  const response = await api.get('/crm/customers/pipeline/');
  return response.data;
};

// Customer Interactions
export const getInteractions = async (params = {}) => {
  const response = await api.get('/crm/interactions/', { params });
  return response.data;
};

export const getInteraction = async (id) => {
  const response = await api.get(`/crm/interactions/${id}/`);
  return response.data;
};

export const createInteraction = async (data) => {
  const response = await api.post('/crm/interactions/', data);
  return response.data;
};

export const updateInteraction = async (id, data) => {
  const response = await api.put(`/crm/interactions/${id}/`, data);
  return response.data;
};

export const deleteInteraction = async (id) => {
  const response = await api.delete(`/crm/interactions/${id}/`);
  return response.data;
};

// Customer Expenses
export const getExpenses = async (params = {}) => {
  const response = await api.get('/crm/expenses/', { params });
  return response.data;
};

export const getExpense = async (id) => {
  const response = await api.get(`/crm/expenses/${id}/`);
  return response.data;
};

export const createExpense = async (data) => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (key === 'receipt' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  const response = await api.post('/crm/expenses/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const updateExpense = async (id, data) => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (key === 'receipt' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  const response = await api.put(`/crm/expenses/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/crm/expenses/${id}/`);
  return response.data;
};

export const approveExpense = async (id) => {
  const response = await api.post(`/crm/expenses/${id}/approve/`);
  return response.data;
};

export const rejectExpense = async (id, reason = '') => {
  const response = await api.post(`/crm/expenses/${id}/reject/`, { reason });
  return response.data;
};
