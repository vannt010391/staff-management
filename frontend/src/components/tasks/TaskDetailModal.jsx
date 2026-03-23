import { useState, useEffect } from 'react';
import { X, Calendar, Users, DollarSign, Clock, Tag, FileText, CheckCircle, AlertCircle, Target, Flag, TrendingUp, Save, History } from 'lucide-react';
import { toast } from 'sonner';
import tasksService from '../../services/tasks';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STAGE_LABELS } from '../../constants';
import { formatCurrency, getTaskAssigneeName } from '../../utils/helpers';

const InfoRow = ({ icon: Icon, label, value, colorClass = 'text-gray-900' }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
    <div className="flex-1">
      <div className="text-xs text-gray-600 font-medium mb-1">{label}</div>
      <div className={`text-sm font-semibold ${colorClass}`}>{value}</div>
    </div>
  </div>
);

const StageProgressItem = ({ stageName, stageLabel, status, onUpdate }) => {
  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-600 border-gray-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '⚙️';
    return '⏳';
  };

  const statuses = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all">
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">{stageLabel}</div>
        <select
          value={status || 'not_started'}
          onChange={(e) => onUpdate(stageName, e.target.value)}
          className={`px-3 py-1 rounded-lg text-sm font-medium border-2 ${getStatusColor(status)} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {getStatusIcon(s.value)} {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default function TaskDetailModal({ task: initialTask, onClose, onUpdate }) {
  const [task, setTask] = useState(initialTask);
  const [stageProgress, setStageProgress] = useState(
    task.stage_progress || {
      planning: 'not_started',
      design: 'not_started',
      development: 'not_started',
      review: 'not_started',
      testing: 'not_started',
      completed: 'not_started',
    }
  );
  const [saving, setSaving] = useState(false);
  const [changeHistory, setChangeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const data = await tasksService.getChangeHistory(task.id);
        setChangeHistory(Array.isArray(data) ? data : (data.results || []));
      } catch {
        // ignore errors silently
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [task.id]);

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

  const getAssignees = () => {
    if (task.assignee_names && Array.isArray(task.assignee_names) && task.assignee_names.length > 0) {
      return task.assignee_names.map(a => a.full_name || a.username).join(', ');
    }
    return getTaskAssigneeName(task) || 'Unassigned';
  };

  const handleStageProgressUpdate = (stageName, status) => {
    setStageProgress(prev => ({
      ...prev,
      [stageName]: status,
    }));
  };

  const handleSaveStageProgress = async () => {
    try {
      setSaving(true);
      await tasksService.updateStageProgress(task.id, stageProgress);
      toast.success('Stage progress updated successfully');

      // Update local task state
      setTask(prev => ({ ...prev, stage_progress: stageProgress }));

      // Notify parent component if callback provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating stage progress:', error);
      toast.error('Failed to update stage progress');
    } finally {
      setSaving(false);
    }
  };

  const calculateOverallProgress = () => {
    const stages = Object.values(stageProgress);
    const completedCount = stages.filter(s => s === 'completed').length;
    const inProgressCount = stages.filter(s => s === 'in_progress').length;
    const totalStages = stages.length;

    return Math.round(((completedCount + (inProgressCount * 0.5)) / totalStages) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-start justify-between rounded-t-2xl z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold mb-3">{task.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                📊 {TASK_STATUS_LABELS[task.status] || task.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStageColor(task.stage)}`}>
                🎯 Stage: {TASK_STAGE_LABELS[task.stage] || task.stage}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white`}>
                🚩 {TASK_PRIORITY_LABELS[task.priority] || task.priority}
              </span>
              {task.is_overdue && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                  ⚠️ OVERDUE
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/30 text-white">
                📈 {calculateOverallProgress()}% Complete
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
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Description
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {task.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Stage Progress Management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Stage Progress Tracking
              </h3>
              <button
                onClick={handleSaveStageProgress}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg space-y-3">
              <StageProgressItem
                stageName="planning"
                stageLabel="📋 Planning"
                status={stageProgress.planning}
                onUpdate={handleStageProgressUpdate}
              />
              <StageProgressItem
                stageName="design"
                stageLabel="🎨 Design"
                status={stageProgress.design}
                onUpdate={handleStageProgressUpdate}
              />
              <StageProgressItem
                stageName="development"
                stageLabel="💻 Development"
                status={stageProgress.development}
                onUpdate={handleStageProgressUpdate}
              />
              <StageProgressItem
                stageName="review"
                stageLabel="🔍 Review"
                status={stageProgress.review}
                onUpdate={handleStageProgressUpdate}
              />
              <StageProgressItem
                stageName="testing"
                stageLabel="🧪 Testing"
                status={stageProgress.testing}
                onUpdate={handleStageProgressUpdate}
              />
              <StageProgressItem
                stageName="completed"
                stageLabel="✨ Completed"
                status={stageProgress.completed}
                onUpdate={handleStageProgressUpdate}
              />
            </div>
          </div>

          {/* Task Information Grid */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Task Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoRow
                icon={Target}
                label="Project"
                value={task.project_name || '-'}
              />

              <InfoRow
                icon={Tag}
                label="Topic"
                value={task.topic_name || 'No topic'}
              />

              <InfoRow
                icon={Clock}
                label="Status"
                value={TASK_STATUS_LABELS[task.status] || task.status}
                colorClass={task.status === 'completed' ? 'text-green-600' : 'text-gray-900'}
              />

              <InfoRow
                icon={TrendingUp}
                label="Current Stage"
                value={TASK_STAGE_LABELS[task.stage] || task.stage}
                colorClass="text-purple-600"
              />

              <InfoRow
                icon={Flag}
                label="Priority"
                value={TASK_PRIORITY_LABELS[task.priority] || task.priority}
                colorClass={getPriorityColor(task.priority)}
              />

              <InfoRow
                icon={Users}
                label="Assigned To"
                value={getAssignees()}
              />

              <InfoRow
                icon={Users}
                label="Assigned By"
                value={task.assigned_by_username || '-'}
              />

              <InfoRow
                icon={Users}
                label="Reviewer"
                value={task.reviewer_full_name || task.reviewer_username || 'No reviewer'}
              />

              <InfoRow
                icon={DollarSign}
                label="Price"
                value={task.price ? formatCurrency(Number(task.price)) : 'Not set'}
                colorClass="text-green-600"
              />

              <InfoRow
                icon={Calendar}
                label="Due Date"
                value={task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No due date'}
                colorClass={task.is_overdue ? 'text-red-600' : 'text-gray-900'}
              />

              <InfoRow
                icon={Calendar}
                label="Created At"
                value={new Date(task.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />

              {task.started_at && (
                <InfoRow
                  icon={Clock}
                  label="Started At"
                  value={new Date(task.started_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
              )}

              {task.completed_at && (
                <InfoRow
                  icon={CheckCircle}
                  label="Completed At"
                  value={new Date(task.completed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  colorClass="text-green-600"
                />
              )}

              {task.freelancer_earning > 0 && (
                <InfoRow
                  icon={DollarSign}
                  label="Freelancer Earning"
                  value={formatCurrency(Number(task.freelancer_earning))}
                  colorClass="text-green-600"
                />
              )}

              {task.resource_count !== undefined && (
                <InfoRow
                  icon={FileText}
                  label="Resources"
                  value={`${task.resource_count} file(s)`}
                />
              )}

              {task.upload_count !== undefined && (
                <InfoRow
                  icon={FileText}
                  label="Submissions"
                  value={`${task.upload_count} file(s)`}
                />
              )}
            </div>
          </div>

          {/* Status Indicator */}
          {task.is_overdue && (
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">⚠️ Task is Overdue</p>
                <p className="text-sm text-red-700">This task has passed its due date</p>
              </div>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">✅ Task Completed</p>
                <p className="text-sm text-green-700">This task has been successfully completed</p>
              </div>
            </div>
          )}

          {task.status === 'review_pending' && (
            <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-purple-900">🔍 Under Review</p>
                <p className="text-sm text-purple-700">This task is waiting for review</p>
              </div>
            </div>
          )}

          {/* Change History */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Lịch sử thay đổi
            </h3>
            {historyLoading ? (
              <div className="text-center py-6 text-gray-400">Đang tải...</div>
            ) : changeHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">Chưa có lịch sử thay đổi</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {changeHistory.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">
                        {item.changed_by_full_name || item.changed_by_username || 'Hệ thống'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.changed_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {item.change_note ? (
                      <p className="text-gray-600">{item.change_note}</p>
                    ) : (
                      <p className="text-gray-600">
                        <span className="font-medium text-blue-700">{item.field_name}</span>
                        {': '}
                        <span className="line-through text-red-500">{item.old_value || '(trống)'}</span>
                        {' → '}
                        <span className="text-green-600">{item.new_value || '(trống)'}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 flex justify-end rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
