import { X, Calendar, Users, DollarSign, Clock, Tag, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STAGE_LABELS } from '../../constants';
import { formatCurrency, getTaskAssigneeName } from '../../utils/helpers';

export default function TaskDetailModal({ task, onClose }) {
  if (!task) return null;

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      working: 'bg-orange-100 text-orange-800',
      review_pending: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-indigo-100 text-indigo-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const getStageColor = (stage) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-700',
      design: 'bg-purple-100 text-purple-700',
      development: 'bg-blue-100 text-blue-700',
      review: 'bg-orange-100 text-orange-700',
      testing: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-start justify-between rounded-t-2xl">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                {TASK_STATUS_LABELS[task.status] || task.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStageColor(task.stage)}`}>
                {TASK_STAGE_LABELS[task.stage] || task.stage}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white`}>
                {TASK_PRIORITY_LABELS[task.priority] || task.priority}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {task.description || 'No description provided'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assignees */}
            {getTaskAssigneeName(task) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Assigned To</span>
                </div>
                <p className="text-gray-700">{getTaskAssigneeName(task)}</p>
              </div>
            )}

            {/* Due Date */}
            {task.due_date && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Due Date</span>
                </div>
                <p className="text-gray-700">
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Price */}
            {task.price && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">Price</span>
                </div>
                <p className="text-gray-700 text-xl font-bold">{formatCurrency(Number(task.price))}</p>
              </div>
            )}

            {/* Topic */}
            {task.topic_name && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-gray-900">Topic</span>
                </div>
                <p className="text-gray-700">{task.topic_name}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600 w-32">Created:</span>
                <span className="text-gray-900">
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>
              {task.started_at && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 w-32">Started:</span>
                  <span className="text-gray-900">
                    {new Date(task.started_at).toLocaleString()}
                  </span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 w-32">Completed:</span>
                  <span className="text-gray-900">
                    {new Date(task.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-600 w-32">Last Updated:</span>
                <span className="text-gray-900">
                  {new Date(task.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          {task.is_overdue && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Task is Overdue</p>
                <p className="text-sm text-red-700">This task has passed its due date</p>
              </div>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Task Completed</p>
                <p className="text-sm text-green-700">This task has been marked as completed</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 flex justify-end rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
