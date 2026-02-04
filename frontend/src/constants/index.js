// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',
  STAFF: 'staff',
  FREELANCER: 'freelancer',
};

// Task Status
export const TASK_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  WORKING: 'working',
  REVIEW_PENDING: 'review_pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.NEW]: 'New',
  [TASK_STATUS.ASSIGNED]: 'Assigned',
  [TASK_STATUS.WORKING]: 'Working',
  [TASK_STATUS.REVIEW_PENDING]: 'Review Pending',
  [TASK_STATUS.APPROVED]: 'Approved',
  [TASK_STATUS.REJECTED]: 'Rejected',
  [TASK_STATUS.COMPLETED]: 'Completed',
};

export const TASK_STATUS_COLORS = {
  [TASK_STATUS.NEW]: 'bg-gray-100 text-gray-800',
  [TASK_STATUS.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [TASK_STATUS.WORKING]: 'bg-yellow-100 text-yellow-800',
  [TASK_STATUS.REVIEW_PENDING]: 'bg-purple-100 text-purple-800',
  [TASK_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [TASK_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [TASK_STATUS.COMPLETED]: 'bg-indigo-100 text-indigo-800',
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: 'Low',
  [TASK_PRIORITY.MEDIUM]: 'Medium',
  [TASK_PRIORITY.HIGH]: 'High',
  [TASK_PRIORITY.URGENT]: 'Urgent',
};

export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: 'bg-gray-100 text-gray-800',
  [TASK_PRIORITY.MEDIUM]: 'bg-blue-100 text-blue-800',
  [TASK_PRIORITY.HIGH]: 'bg-orange-100 text-orange-800',
  [TASK_PRIORITY.URGENT]: 'bg-red-100 text-red-800',
};

// Project Status
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

// Design Rule Categories
export const DESIGN_RULE_CATEGORIES = {
  LAYOUT: 'layout',
  TYPOGRAPHY: 'typography',
  COLOR: 'color',
  CONTENT: 'content',
  ANIMATION: 'animation',
  OTHER: 'other',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_CHANGED: 'task_status_changed',
  NEW_COMMENT: 'new_comment',
  REVIEW_COMPLETED: 'review_completed',
  FILE_UPLOADED: 'file_uploaded',
  TASK_DUE_SOON: 'task_due_soon',
  TASK_OVERDUE: 'task_overdue',
};

// File Types
export const FILE_TYPES = {
  REFERENCE: 'reference',
  SUBMISSION: 'submission',
  REVISION: 'revision',
  OTHER: 'other',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};
