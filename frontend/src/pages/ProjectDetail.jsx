import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  Plus,
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
} from 'lucide-react';
import { toast } from 'sonner';
import projectsService from '../services/projects';
import tasksService from '../services/tasks';
import TaskForm from '../components/tasks/TaskForm';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../constants';
import { formatCurrency, getTaskAssigneeName } from '../utils/helpers';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
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

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-bold text-gray-900">Project Tasks</h2>
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

        <div className="p-6">
          {tasks.length === 0 ? (
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
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTaskStatusColor(task.status)}`}>
                          {TASK_STATUS_LABELS[task.status] || 'New'}
                        </span>
                        <span className={`text-sm font-semibold ${getPriorityColor(task.priority)}`}>
                          {TASK_PRIORITY_LABELS[task.priority] || 'Medium'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {getTaskAssigneeName(task) && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{getTaskAssigneeName(task)}</span>
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(Number(task.price))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
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
                      <p className="text-sm text-gray-600">{rule.description}</p>
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
                <textarea
                  rows={4}
                  value={ruleFormData.description}
                  onChange={(e) => setRuleFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
}
