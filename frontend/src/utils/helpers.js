import { format, formatDistanceToNow } from 'date-fns';

// Format date
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  return format(new Date(date), formatStr);
};

// Format date time
export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format currency (VND)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Truncate text
export const truncate = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Check if task is overdue
export const isOverdue = (dueDate, status) => {
  if (!dueDate) return false;
  if (['completed', 'approved'].includes(status)) return false;
  return new Date(dueDate) < new Date();
};

// Get status badge class
export const getStatusBadgeClass = (statusColors) => {
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors}`;
};

// Handle API errors
export const handleApiError = (error) => {
  if (error.response?.data) {
    // API error with response
    const data = error.response.data;

    if (typeof data === 'string') {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.error) {
      return data.error;
    }

    // Handle validation errors
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (Array.isArray(data[firstKey])) {
        return data[firstKey][0];
      }
      return data[firstKey];
    }
  }

  return error.message || 'An error occurred';
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};
