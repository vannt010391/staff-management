import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  DollarSign,
  FolderKanban,
  ListTodo,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import tasksService from '../services/tasks';
import projectsService from '../services/projects';
import { formatCurrency, getTaskAssigneeName } from '../utils/helpers';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STAGE_LABELS } from '../constants';

export default function ProjectTaskDetailPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [stageProgress, setStageProgress] = useState({});
  const [currentStageId, setCurrentStageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [newProgressStage, setNewProgressStage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId, taskId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskData, projectData] = await Promise.all([
        tasksService.getTask(taskId),
        projectsService.getProject(projectId),
      ]);
      setTask(taskData);
      setProject(projectData);
      setStageProgress(taskData.stage_progress || {});

      // Auto-set current stage if task has project_stage
      if (taskData.project_stage) {
        setCurrentStageId(taskData.project_stage);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleStageProgressUpdate = (stageId, percentage) => {
    setStageProgress(prev => ({
      ...prev,
      [stageId]: Math.min(100, Math.max(0, percentage)),
    }));
  };

  const handleSaveStageProgress = async () => {
    try {
      setSaving(true);

      // Save stage progress
      await tasksService.updateStageProgress(taskId, stageProgress);

      // Save current stage if selected
      if (currentStageId) {
        await tasksService.patchTask(taskId, { project_stage: currentStageId });
      }

      toast.success('Stage progress updated successfully');
      setTask(prev => ({
        ...prev,
        stage_progress: stageProgress,
        project_stage: currentStageId
      }));
    } catch (error) {
      console.error('Error updating stage progress:', error);
      toast.error('Failed to update stage progress');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProgress = () => {
    if (!newProgressStage) {
      toast.error('Please select a stage');
      return;
    }
    if (stageProgress.hasOwnProperty(newProgressStage)) {
      toast.error('Progress for this stage already exists');
      return;
    }
    setStageProgress(prev => ({
      ...prev,
      [newProgressStage]: 0,
    }));
    setNewProgressStage('');
    setShowAddProgress(false);
    toast.success('Progress tracking added');
  };

  const handleRemoveProgress = (stageId) => {
    const newProgress = { ...stageProgress };
    delete newProgress[stageId];
    setStageProgress(newProgress);
    toast.success('Progress tracking removed');
  };

  const calculateOverallProgress = () => {
    const percentages = Object.values(stageProgress);
    if (percentages.length === 0) return 0;
    const total = percentages.reduce((sum, val) => sum + Number(val || 0), 0);
    return Math.round(total / percentages.length);
  };

  const getAutoStatus = () => {
    const overallProgress = calculateOverallProgress();
    if (overallProgress === 0) return 'Not Started';
    if (overallProgress === 100) return 'Completed';
    if (overallProgress >= 75) return 'Nearly Complete';
    if (overallProgress >= 50) return 'In Progress (Good)';
    if (overallProgress >= 25) return 'In Progress';
    return 'Just Started';
  };

  const getAutoStatusColor = () => {
    const overallProgress = calculateOverallProgress();
    if (overallProgress === 0) return 'bg-gray-100 text-gray-800';
    if (overallProgress === 100) return 'bg-green-100 text-green-800';
    if (overallProgress >= 75) return 'bg-blue-100 text-blue-800';
    if (overallProgress >= 50) return 'bg-yellow-100 text-yellow-800';
    if (overallProgress >= 25) return 'bg-orange-100 text-orange-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getStageColorClass = (color) => {
    const colors = {
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      red: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[color] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

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
    if (task?.assignee_names && Array.isArray(task.assignee_names) && task.assignee_names.length > 0) {
      return task.assignee_names.map(a => a.full_name || a.username).join(', ');
    }
    return getTaskAssigneeName(task) || 'Unassigned';
  };

  const StageStepItem = ({ stageId, stageName, percentage, isLast, stepNumber, onUpdate, onRemove, isCurrent, onSetCurrent }) => {
    const getStepColor = () => {
      if (percentage >= 100) return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' };
      if (percentage >= 75) return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' };
      if (percentage >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' };
      if (percentage >= 25) return { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' };
      if (percentage > 0) return { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400' };
      return { bg: 'bg-gray-300', text: 'text-gray-300', border: 'border-gray-300' };
    };

    const colors = getStepColor();

    return (
      <div className="flex items-center group">
        <div className="relative">
          {/* Compact stage card */}
          <div
            onClick={() => onSetCurrent(stageId)}
            className={`relative ${colors.bg} text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer min-w-[120px] ${isCurrent ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105' : 'hover:scale-102'}`}
          >
            {/* Badge */}
            <div className="flex items-center justify-between mb-1">
              <div className={`w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xs font-bold ${isCurrent ? 'ring-2 ring-white' : ''}`}>
                {isCurrent ? '★' : stepNumber}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(stageId); }}
                className="opacity-0 group-hover:opacity-100 text-white/80 hover:text-white transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {/* Stage name */}
            <div className="text-xs font-semibold mb-2 leading-tight">
              {stageName}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Percentage input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={percentage || 0}
                onChange={(e) => { e.stopPropagation(); onUpdate(stageId, Number(e.target.value)); }}
                onClick={(e) => e.stopPropagation()}
                className="w-12 px-1 py-0.5 bg-white/90 text-gray-900 rounded text-center text-xs font-bold focus:outline-none focus:ring-1 focus:ring-white"
              />
              <span className="text-xs font-medium text-white/90">%</span>
            </div>

            {/* Current indicator */}
            {isCurrent && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                NOW
              </div>
            )}
          </div>

          {/* Arrow connector */}
          {!isLast && (
            <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
              <div className={`w-6 h-0.5 ${colors.bg}`} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const InfoRow = ({ icon: Icon, label, value, colorClass = 'text-gray-900' }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
      <div className="flex-1">
        <div className="text-xs text-gray-600 font-medium mb-1">{label}</div>
        <div className={`text-sm font-semibold ${colorClass}`}>{value}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!task || !project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Task not found</p>
        <Link to={`/projects/${projectId}`} className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Project
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-xl">
          <h1 className="text-3xl font-bold mb-3">{task.title}</h1>
          <div className="flex flex-wrap gap-2">
            {Object.keys(stageProgress).length > 0 ? (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getAutoStatusColor()}`}>
                ⚡ {getAutoStatus()}
              </span>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                {TASK_STATUS_LABELS[task.status] || task.status}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
              {TASK_PRIORITY_LABELS[task.priority] || task.priority}
            </span>
            {task.is_overdue && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                OVERDUE
              </span>
            )}
            {Object.keys(stageProgress).length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
                {calculateOverallProgress()}% Done
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Stage Progress
              </h3>
              <p className="text-xs text-gray-500">
                Click stage to mark as current ★ • Status auto-updates
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddProgress(!showAddProgress)}
                className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow hover:shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              <button
                onClick={handleSaveStageProgress}
                disabled={saving}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow hover:shadow-md"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {showAddProgress && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2">
                <select
                  value={newProgressStage}
                  onChange={(e) => setNewProgressStage(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select a stage...</option>
                  {project?.stages?.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddProgress}
                  className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddProgress(false);
                    setNewProgressStage('');
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border border-gray-200">
            {Object.keys(stageProgress).length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <TrendingUp className="h-16 w-16 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-semibold text-gray-700 mb-1">No progress tracking yet</p>
                <p className="text-sm text-gray-500">Click "Add Stage" to start tracking</p>
              </div>
            ) : (
              <>
                {/* Overall Progress Bar */}
                <div className="mb-6 p-4 bg-white/50 backdrop-blur rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{getAutoStatus()}</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {calculateOverallProgress()}%
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out rounded-full shadow-inner"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    />
                  </div>
                </div>

                {/* Stage Stepper */}
                <div className="relative overflow-x-auto">
                  <div className="flex items-center gap-3 pb-2">
                    {Object.entries(stageProgress).map(([stageId, percentage], index) => {
                      const stage = project?.stages?.find(s => s.id === Number(stageId));
                      const isLast = index === Object.keys(stageProgress).length - 1;
                      const isCurrent = currentStageId === Number(stageId);
                      return (
                        <StageStepItem
                          key={stageId}
                          stageId={stageId}
                          stageName={stage?.name || `Stage #${stageId}`}
                          percentage={percentage}
                          stepNumber={index + 1}
                          isLast={isLast}
                          isCurrent={isCurrent}
                          onUpdate={handleStageProgressUpdate}
                          onRemove={handleRemoveProgress}
                          onSetCurrent={(id) => setCurrentStageId(Number(id))}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task Information Grid */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-600" />
            Task Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoRow
              icon={FolderKanban}
              label="Project"
              value={project.name || '-'}
            />
            <InfoRow
              icon={ListTodo}
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
              value={
                currentStageId
                  ? `★ ${project?.stages?.find(s => s.id === currentStageId)?.name || 'Unknown'}`
                  : task.project_stage_name || TASK_STAGE_LABELS[task.stage] || task.stage
              }
              colorClass="text-purple-600"
            />
            <InfoRow
              icon={AlertCircle}
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
          </div>
        </div>

        {/* Status Indicators */}
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
      </div>
    </div>
  );
}
