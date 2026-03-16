import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Upload,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Palette,
  Edit,
  Trash2,
  Loader2,
  ListTodo,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import projectsService from '../services/projects';
import tasksService from '../services/tasks';
import TaskForm from '../components/tasks/TaskForm';
import TaskImportModal from '../components/tasks/TaskImportModal';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STAGE_LABELS } from '../constants';
import { formatCurrency, getTaskAssigneeName } from '../utils/helpers';
import { RichTextEditor } from '../components/ui';

// Helper function for stage colors
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

// Kanban Task Card Component
function TaskCard({ task, onView, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100',
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{task.title}</h4>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(task);
            }}
            className="p-1 hover:bg-green-100 rounded transition-colors"
            title="View"
          >
            <Eye className="h-3 w-3 text-green-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Edit"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {TASK_STATUS_LABELS[task.status] || task.status}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {TASK_PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{getTaskAssigneeName(task) || 'Unassigned'}</span>
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1 ${task.is_overdue ? 'text-red-600' : ''}`}>
            <Calendar className="h-3 w-3" />
            <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {task.price && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs font-semibold text-green-600">
          {formatCurrency(Number(task.price))}
        </div>
      )}
    </div>
  );
}

// Kanban Column Component
function KanbanColumn({ stage, tasks, onView, onEdit }) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: stage ? `stage-${stage.id}` : 'stage-no-stage',
    data: {
      type: 'column',
      stage,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4 transition-all ${
        stage ? `border-2 ${getStageColorClass(stage.color)}` : 'border-2 border-dashed border-gray-300'
      } ${isOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">
          {stage ? stage.name : 'No Stage'}
        </h3>
        <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={onView}
                onEdit={onEdit}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState('all');
  const [taskFilterAssignee, setTaskFilterAssignee] = useState('all');

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    is_required: true,
    order: 0,
  });
  const [ruleSaving, setRuleSaving] = useState(false);
  const [showRuleDeleteConfirm, setShowRuleDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [ruleFilterCategory, setRuleFilterCategory] = useState('all');
  const [ruleFilterRequired, setRuleFilterRequired] = useState('all');

  const [showStageForm, setShowStageForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [stageFormData, setStageFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    order: 0,
  });
  const [stageSaving, setStageSaving] = useState(false);
  const [showStageDeleteConfirm, setShowStageDeleteConfirm] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [activeTaskId, setActiveTaskId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        projectsService.getProject(id),
        tasksService.getTasks({ project: id })
      ]);
      setProject(projectData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await tasksService.deleteTask(taskToDelete.id);
      toast.success('Task deleted successfully');
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      fetchProjectAndTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleTaskFormSuccess = async () => {
    await fetchProjectAndTasks();
  };

  const openCreateRuleForm = () => {
    setSelectedRule(null);
    setRuleFormData({
      name: '',
      description: '',
      category: 'other',
      is_required: true,
      order: 0,
    });
    setShowRuleForm(true);
  };

  const openEditRuleForm = (rule) => {
    setSelectedRule(rule);
    setRuleFormData({
      name: rule.name || '',
      description: rule.description || '',
      category: rule.category || 'other',
      is_required: !!rule.is_required,
      order: rule.order || 0,
    });
    setShowRuleForm(true);
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    if (!ruleFormData.name.trim() || !ruleFormData.description.trim()) {
      toast.error('Rule name and description are required');
      return;
    }

    try {
      setRuleSaving(true);
      const payload = {
        name: ruleFormData.name.trim(),
        description: ruleFormData.description.trim(),
        category: ruleFormData.category,
        is_required: ruleFormData.is_required,
        order: Number(ruleFormData.order || 0),
        project: Number(project.id),
      };

      if (selectedRule) {
        await projectsService.updateDesignRule(selectedRule.id, payload);
        toast.success('Design rule updated successfully');
      } else {
        await projectsService.createDesignRuleItem(payload);
        toast.success('Design rule created successfully');
      }

      setShowRuleForm(false);
      await fetchProjectAndTasks();
    } catch (error) {
      console.error('Error saving design rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to save design rule');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      await projectsService.deleteDesignRule(ruleToDelete.id);
      toast.success('Design rule deleted successfully');
      setShowRuleDeleteConfirm(false);
      setRuleToDelete(null);
      await fetchProjectAndTasks();
    } catch (error) {
      console.error('Error deleting design rule:', error);
      toast.error('Failed to delete design rule');
    }
  };

  const openCreateStageForm = () => {
    setSelectedStage(null);
    setStageFormData({
      name: '',
      description: '',
      color: 'blue',
      order: 0,
    });
    setShowStageForm(true);
  };

  const openEditStageForm = (stage) => {
    setSelectedStage(stage);
    setStageFormData({
      name: stage.name || '',
      description: stage.description || '',
      color: stage.color || 'blue',
      order: stage.order || 0,
    });
    setShowStageForm(true);
  };

  const handleStageSubmit = async (e) => {
    e.preventDefault();
    if (!stageFormData.name.trim()) {
      toast.error('Stage name is required');
      return;
    }

    try {
      setStageSaving(true);
      const payload = {
        name: stageFormData.name.trim(),
        description: stageFormData.description.trim(),
        color: stageFormData.color,
        order: Number(stageFormData.order || 0),
        project: Number(project.id),
      };

      if (selectedStage) {
        await projectsService.updateStage(selectedStage.id, payload);
        toast.success('Stage updated successfully');
      } else {
        await projectsService.createStage(payload);
        toast.success('Stage created successfully');
      }

      setShowStageForm(false);
      await fetchProjectAndTasks();
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error(error.response?.data?.detail || 'Failed to save stage');
    } finally {
      setStageSaving(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;

    try {
      await projectsService.deleteStage(stageToDelete.id);
      toast.success('Stage deleted successfully');
      setShowStageDeleteConfirm(false);
      setStageToDelete(null);
      await fetchProjectAndTasks();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Failed to delete stage');
    }
  };

  const handleDragStart = (event) => {
    setActiveTaskId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStageId = null;

    // Check if dropped over a column
    if (over.data.current?.type === 'column') {
      newStageId = over.data.current.stage?.id || null;
    } else {
      // Dropped over a task, find which stage it belongs to
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        newStageId = overTask.project_stage || null;
      }
    }

    // If stage changed, update the task
    if (task.project_stage !== newStageId) {
      try {
        await tasksService.patchTask(taskId, { project_stage: newStageId });
        toast.success('Task moved successfully');
        await fetchProjectAndTasks();
      } catch (error) {
        console.error('Error updating task stage:', error);
        toast.error('Failed to move task');
      }
    }
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      working: 'bg-orange-100 text-orange-800',
      review_pending: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
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

  const getTaskStageColor = (stage) => {
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

  const taskStats = {
    total: tasks.length,
    new: tasks.filter(t => t.status === 'new').length,
    working: tasks.filter(t => t.status === 'working').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const designRules = Array.isArray(project.design_rules) ? project.design_rules : [];
  const getTaskAssigneeKey = (task) => {
    if (task.assigned_to !== null && task.assigned_to !== undefined) {
      return `id:${task.assigned_to}`;
    }
    const assigneeName = getTaskAssigneeName(task);
    if (assigneeName) {
      return `name:${assigneeName}`;
    }
    return 'unassigned';
  };

  const taskAssigneeOptions = Array.from(
    new Map(
      tasks.map((task) => {
        const key = getTaskAssigneeKey(task);
        const assigneeName = getTaskAssigneeName(task);
        const label = assigneeName || (key === 'unassigned' ? 'Unassigned' : `User #${task.assigned_to}`);
        return [key, label];
      })
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = taskFilterStatus === 'all' || task.status === taskFilterStatus;
    const matchesPriority = taskFilterPriority === 'all' || task.priority === taskFilterPriority;
    const matchesAssignee = taskFilterAssignee === 'all' || getTaskAssigneeKey(task) === taskFilterAssignee;
    return matchesStatus && matchesPriority && matchesAssignee;
  });
  const filteredDesignRules = designRules.filter((rule) => {
    const matchesCategory = ruleFilterCategory === 'all' || rule.category === ruleFilterCategory;
    const matchesRequired =
      ruleFilterRequired === 'all' ||
      (ruleFilterRequired === 'required' && rule.is_required) ||
      (ruleFilterRequired === 'optional' && !rule.is_required);
    return matchesCategory && matchesRequired;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-2 hover:bg-white/80 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {project.name}
          </h1>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-5 py-3 bg-white border-2 border-green-500 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-all flex items-center gap-2 shadow"
          >
            <Upload className="h-5 w-5" />
            Import Tasks
          </button>
          <button
            onClick={() => {
              setSelectedTask(null);
              setShowTaskForm(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Client</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{project.client_name}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Duration</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-gray-600">Budget</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(project.budget || 0))}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-lg font-bold text-gray-900">{project.progress}%</span>
          </div>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
            <ListTodo className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">New</p>
              <p className="text-3xl font-bold text-gray-900">{taskStats.new}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-gray-600" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-gray-900">{taskStats.working}</p>
            </div>
            <Clock className="h-10 w-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{taskStats.completed}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Project Tasks</h2>
            {project.stages && project.stages.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Kanban view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={taskFilterStatus}
              onChange={(e) => setTaskFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All status</option>
              <option value="new">{TASK_STATUS_LABELS.new || 'New'}</option>
              <option value="assigned">{TASK_STATUS_LABELS.assigned || 'Assigned'}</option>
              <option value="working">{TASK_STATUS_LABELS.working || 'Working'}</option>
              <option value="review_pending">{TASK_STATUS_LABELS.review_pending || 'Review Pending'}</option>
              <option value="approved">{TASK_STATUS_LABELS.approved || 'Approved'}</option>
              <option value="completed">{TASK_STATUS_LABELS.completed || 'Completed'}</option>
            </select>

            <select
              value={taskFilterPriority}
              onChange={(e) => setTaskFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All priority</option>
              <option value="low">{TASK_PRIORITY_LABELS.low || 'Low'}</option>
              <option value="medium">{TASK_PRIORITY_LABELS.medium || 'Medium'}</option>
              <option value="high">{TASK_PRIORITY_LABELS.high || 'High'}</option>
              <option value="urgent">{TASK_PRIORITY_LABELS.urgent || 'Urgent'}</option>
            </select>

            <select
              value={taskFilterAssignee}
              onChange={(e) => setTaskFilterAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All assignees</option>
              {taskAssigneeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setTaskFilterStatus('all');
                setTaskFilterPriority('all');
                setTaskFilterAssignee('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === 'kanban' && project.stages && project.stages.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="p-6">
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {project.stages.map((stage) => {
                    const stageTasks = filteredTasks.filter(t => t.project_stage === stage.id);
                    return (
                      <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        tasks={stageTasks}
                        onView={(task) => {
                          navigate(`/projects/${id}/tasks/${task.id}`);
                        }}
                        onEdit={(task) => {
                          setSelectedTask(task);
                          setShowTaskForm(true);
                        }}
                      />
                    );
                  })}
                  {/* No Stage Column */}
                  {(() => {
                    const noStageTasks = filteredTasks.filter(t => !t.project_stage);
                    if (noStageTasks.length > 0) {
                      return (
                        <KanbanColumn
                          key="no-stage"
                          stage={null}
                          tasks={noStageTasks}
                          onView={(task) => {
                            navigate(`/projects/${id}/tasks/${task.id}`);
                          }}
                          onEdit={(task) => {
                            setSelectedTask(task);
                            setShowTaskForm(true);
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              <DragOverlay>
                {activeTaskId ? (
                  <div className="bg-white rounded-lg p-3 shadow-lg border-2 border-blue-500 opacity-90">
                    <div className="font-semibold text-sm text-gray-900">
                      {tasks.find(t => t.id === activeTaskId)?.title || 'Task'}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first task for this project</p>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setShowTaskForm(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add First Task
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks match current filters</h3>
              <p className="text-gray-600 mb-6">Try changing status or priority filter</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-200">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Stage</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Assignee</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Due Date</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTaskStatusColor(task.status)}`}>
                        {TASK_STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.project_stage_name ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStageColorClass(task.project_stage_color || 'blue')}`}>
                          {task.project_stage_name}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTaskStageColor(task.stage)}`}>
                          {TASK_STAGE_LABELS[task.stage] || task.stage}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${getPriorityColor(task.priority)}`}>
                        {TASK_PRIORITY_LABELS[task.priority] || task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getTaskAssigneeName(task) || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {task.price ? formatCurrency(Number(task.price)) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/projects/${id}/tasks/${task.id}`)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskForm(true);
                          }}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(task);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Project Stages */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Project Stages
            </h2>
            <p className="text-sm text-gray-600 mt-1">Custom workflow stages for this project</p>
          </div>
          <button
            onClick={openCreateStageForm}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Stage
          </button>
        </div>

        <div className="p-6">
          {!project.stages || project.stages.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No stages defined yet. Create stages to organize your tasks.</p>
              <button
                onClick={openCreateStageForm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Stage
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {project.stages.map((stage) => (
                <div key={stage.id} className={`bg-white rounded-xl p-4 border-2 ${getStageColorClass(stage.color)}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{stage.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{stage.description || 'No description'}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {stage.task_count || 0} task{stage.task_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditStageForm(stage)}
                        className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                        title="Edit stage"
                      >
                        <Edit className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setStageToDelete(stage);
                          setShowStageDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="Delete stage"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Design Rules */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Design Rules
            </h2>
            <p className="text-sm text-gray-600 mt-1">Guidelines applied for this project</p>
          </div>
          <button
            onClick={openCreateRuleForm}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>

        <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
          <select
            value={ruleFilterCategory}
            onChange={(e) => setRuleFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All categories</option>
            <option value="layout">Layout</option>
            <option value="typography">Typography</option>
            <option value="color">Color Scheme</option>
            <option value="content">Content</option>
            <option value="animation">Animation</option>
            <option value="other">Other</option>
          </select>

          <select
            value={ruleFilterRequired}
            onChange={(e) => setRuleFilterRequired(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All types</option>
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
        </div>

        <div className="p-6">
          {filteredDesignRules.length === 0 ? (
            <div className="text-center py-10">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No design rules match the current filters.</p>
              <button
                onClick={openCreateRuleForm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDesignRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{rule.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {rule.category_display || rule.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${rule.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {rule.is_required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <div
                        className="text-sm text-gray-600 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: rule.description }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditRuleForm(rule)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Edit rule"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setRuleToDelete(rule);
                          setShowRuleDeleteConfirm(true);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import Tasks Modal */}
      {showImportModal && (
        <TaskImportModal
          projectId={project.id}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchProjectAndTasks();
          }}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={selectedTask}
          projectId={project.id}
          onClose={() => {
            setShowTaskForm(false);
            setSelectedTask(null);
          }}
          onSuccess={handleTaskFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete task{' '}
              <span className="font-semibold">{taskToDelete.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteTask}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTaskToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedRule ? 'Edit Design Rule' : 'Add Design Rule'}</h3>
            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  value={ruleFormData.name}
                  onChange={(e) => setRuleFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={ruleFormData.category}
                    onChange={(e) => setRuleFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="layout">Layout</option>
                    <option value="typography">Typography</option>
                    <option value="color">Color Scheme</option>
                    <option value="content">Content</option>
                    <option value="animation">Animation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={ruleFormData.order}
                    onChange={(e) => setRuleFormData((prev) => ({ ...prev, order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="rule-required"
                  type="checkbox"
                  checked={ruleFormData.is_required}
                  onChange={(e) => setRuleFormData((prev) => ({ ...prev, is_required: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="rule-required" className="text-sm text-gray-700">Required rule</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <RichTextEditor
                  value={ruleFormData.description}
                  onChange={(html) => setRuleFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Describe the design rule..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ruleSaving}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {ruleSaving ? 'Saving...' : selectedRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design Rule Delete Confirmation Modal */}
      {showRuleDeleteConfirm && ruleToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete design rule{' '}
              <span className="font-semibold">{ruleToDelete.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRule}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowRuleDeleteConfirm(false);
                  setRuleToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Form Modal */}
      {showStageForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedStage ? 'Edit Stage' : 'Add Stage'}</h3>
            <form onSubmit={handleStageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name *</label>
                <input
                  type="text"
                  value={stageFormData.name}
                  onChange={(e) => setStageFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Design Review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={stageFormData.description}
                  onChange={(e) => setStageFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe this stage..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={stageFormData.color}
                    onChange={(e) => setStageFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="gray">Gray</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="yellow">Yellow</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={stageFormData.order}
                    onChange={(e) => setStageFormData((prev) => ({ ...prev, order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStageForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stageSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {stageSaving ? 'Saving...' : selectedStage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage Delete Confirmation Modal */}
      {showStageDeleteConfirm && stageToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete stage{' '}
              <span className="font-semibold">{stageToDelete.name}</span>?
              {stageToDelete.task_count > 0 && (
                <span className="block mt-2 text-sm text-orange-600">
                  Warning: {stageToDelete.task_count} task{stageToDelete.task_count !== 1 ? 's are' : ' is'} currently using this stage.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteStage}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowStageDeleteConfirm(false);
                  setStageToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
