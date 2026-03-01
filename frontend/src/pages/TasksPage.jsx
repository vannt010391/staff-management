import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ListTodo,
  Plus,
  Search,
  Clock,
  CheckCircle,
  PlayCircle,
  Calendar,
  DollarSign,
  User,
  Target,
  Edit,
  Trash2,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import tasksService from '../services/tasks';
import TaskForm from '../components/tasks/TaskForm';
import { TASK_STATUS, TASK_PRIORITY, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../constants';
import { Table, ViewToggle } from '../components/ui';
import { formatCurrency, getTaskAssigneeName } from '../utils/helpers';

const getReviewerName = (task) => task.reviewer_full_name || task.reviewer_username || 'Unassigned';

export default function TasksPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterReviewer, setFilterReviewer] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => {
    fetchTasks();
  }, [filterStatus, filterPriority]);

  useEffect(() => {
    if (user?.role === 'freelancer') {
      fetchEarningsSummary();
    }
  }, [user?.role]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;

      const data = await tasksService.getTasks(params);
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsSummary = async () => {
    try {
      setEarningsLoading(true);
      const data = await tasksService.getEarningsSummary();
      setEarningsSummary(data);
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      setEarningsSummary(null);
    } finally {
      setEarningsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;

    try {
      await tasksService.deleteTask(taskToDelete.id);
      toast.success('Task deleted successfully');
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleFormSuccess = async () => {
    await fetchTasks();
  };

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.project_name?.toLowerCase().includes(searchLower);
    const reviewerName = getReviewerName(task);
    const matchesReviewer = filterReviewer === 'all' || reviewerName === filterReviewer;
    return matchesSearch && matchesReviewer;
  });

  const reviewerOptions = Array.from(new Set(tasks.map((task) => getReviewerName(task)))).sort((a, b) =>
    a.localeCompare(b)
  );

  const stats = {
    total: tasks.length,
    in_progress: tasks.filter(t => t.status === 'working').length,
    review_pending: tasks.filter(t => t.status === 'review_pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const canCreateTask = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'team_lead';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header with Glass Morphism */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/50 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {user?.role === 'freelancer' ? 'My Tasks' : 'All Tasks'}
              </h1>
            </div>
            <p className="text-gray-600 text-sm ml-10">
              Track and manage your design tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {canCreateTask && (
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setShowForm(true);
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Task
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid with Floating Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={ListTodo}
          label="Total Tasks"
          value={stats.total.toString()}
          color="from-blue-500 to-cyan-500"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={PlayCircle}
          label="In Progress"
          value={stats.in_progress.toString()}
          color="from-orange-500 to-red-500"
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <StatCard
          icon={Clock}
          label="Review Pending"
          value={stats.review_pending.toString()}
          color="from-purple-500 to-pink-500"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed.toString()}
          color="from-green-500 to-emerald-500"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {user?.role === 'freelancer' && (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Summary</h2>
          {earningsLoading ? (
            <p className="text-gray-600">Loading earnings summary...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(Number(earningsSummary?.total_earned || 0))}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Approved/Completed Tasks</p>
                <p className="text-2xl font-bold text-blue-600">
                  {earningsSummary?.approved_or_completed_tasks || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Pending Review Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(Number(earningsSummary?.pending_review_amount || 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters with Glass Effect */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value={TASK_STATUS.NEW}>New</option>
            <option value={TASK_STATUS.ASSIGNED}>Assigned</option>
            <option value={TASK_STATUS.WORKING}>Working</option>
            <option value={TASK_STATUS.REVIEW_PENDING}>Review Pending</option>
            <option value={TASK_STATUS.APPROVED}>Approved</option>
            <option value={TASK_STATUS.COMPLETED}>Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value={TASK_PRIORITY.LOW}>Low</option>
            <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
            <option value={TASK_PRIORITY.HIGH}>High</option>
            <option value={TASK_PRIORITY.URGENT}>Urgent</option>
          </select>
          <select
            value={filterReviewer}
            onChange={(e) => setFilterReviewer(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Reviewers</option>
            {reviewerOptions.map((reviewerName) => (
              <option key={reviewerName} value={reviewerName}>
                {reviewerName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-12 text-center">
          <ListTodo className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterReviewer !== 'all' ? 'Try adjusting your filters or search criteria' : 'Get started by creating your first task'}
          </p>
          {canCreateTask && (
            <button
              onClick={() => {
                setSelectedTask(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Task
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        <Table
          columns={[
            { key: 'title', label: 'Task', width: '25%' },
            {
              key: 'project',
              label: 'Project',
              width: '15%',
              render: (task) => task.project_name || '-'
            },
            {
              key: 'assigned_to',
              label: 'Assigned To',
              width: '12%',
              render: (task) => getTaskAssigneeName(task) || 'Unassigned'
            },
            {
              key: 'reviewer',
              label: 'Reviewer',
              width: '12%',
              render: (task) => getReviewerName(task)
            },
            {
              key: 'status',
              label: 'Status',
              width: '12%',
              render: (task) => {
                const statusConfig = {
                  new: { bg: 'bg-gray-100', text: 'text-gray-800' },
                  assigned: { bg: 'bg-blue-100', text: 'text-blue-800' },
                  working: { bg: 'bg-orange-100', text: 'text-orange-800' },
                  review_pending: { bg: 'bg-purple-100', text: 'text-purple-800' },
                  approved: { bg: 'bg-green-100', text: 'text-green-800' },
                  completed: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
                };
                const status = statusConfig[task.status] || statusConfig.new;
                return (
                  <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-bold`}>
                    {TASK_STATUS_LABELS[task.status] || 'New'}
                  </span>
                );
              }
            },
            {
              key: 'priority',
              label: 'Priority',
              width: '10%',
              render: (task) => {
                const priorityConfig = {
                  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
                  medium: { bg: 'bg-blue-100', text: 'text-blue-800' },
                  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
                  urgent: { bg: 'bg-red-100', text: 'text-red-800' },
                };
                const priority = priorityConfig[task.priority] || priorityConfig.medium;
                return (
                  <span className={`${priority.bg} ${priority.text} px-3 py-1 rounded-full text-xs font-bold`}>
                    {TASK_PRIORITY_LABELS[task.priority] || 'Medium'}
                  </span>
                );
              }
            },
            {
              key: 'due_date',
              label: 'Due Date',
              width: '10%',
              render: (task) => task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'
            },
            {
              key: 'price',
              label: 'Price',
              width: '8%',
              render: (task) => task.price ? formatCurrency(Number(task.price)) : '-'
            },
            {
              key: 'actions',
              label: 'Actions',
              width: '5%',
              render: (task) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks/${task.id}`);
                    }}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                  {canCreateTask && (
                    <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(task);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                    </>
                  )}
                </div>
              )
            }
          ]}
          data={filteredTasks}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onView={() => {
                navigate(`/tasks/${task.id}`);
              }}
              onEdit={() => {
                setSelectedTask(task);
                setShowForm(true);
              }}
              onDelete={() => {
                setTaskToDelete(task);
                setShowDeleteConfirm(true);
              }}
              canEdit={canCreateTask}
            />
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={selectedTask}
          onClose={() => {
            setShowForm(false);
            setSelectedTask(null);
          }}
          onSuccess={handleFormSuccess}
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
                onClick={handleDelete}
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, iconBg, iconColor }) {
  return (
    <div className="group relative bg-white/60 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 p-4 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-600">{label}</p>
          <p className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`${iconBg} ${iconColor} p-3 rounded-xl shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${color} rounded-b-xl`} />
    </div>
  );
}

function TaskCard({ task, index, onView, onEdit, onDelete, canEdit }) {
  const statusConfig = {
    new: { color: 'from-gray-400 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-800', label: 'New' },
    assigned: { color: 'from-blue-400 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-800', label: 'Assigned' },
    working: { color: 'from-orange-400 to-orange-600', bg: 'bg-orange-100', text: 'text-orange-800', label: 'Working' },
    review_pending: { color: 'from-purple-400 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-800', label: 'Review Pending' },
    approved: { color: 'from-green-400 to-green-600', bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
    completed: { color: 'from-indigo-400 to-indigo-600', bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Completed' },
  };

  const priorityConfig = {
    low: { color: 'from-gray-400 to-gray-500', icon: '○' },
    medium: { color: 'from-blue-400 to-blue-500', icon: '◐' },
    high: { color: 'from-orange-400 to-orange-500', icon: '◉' },
    urgent: { color: 'from-red-500 to-red-600', icon: '⬤' },
  };

  const status = statusConfig[task.status] || statusConfig.new;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${status.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="absolute inset-[2px] bg-white rounded-2xl" />

      <div className="relative z-10 p-6">
        {/* Header with Title and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-xl bg-gradient-to-r ${priority.color} bg-clip-text text-transparent font-bold`}>
                {priority.icon}
              </span>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{task.description || 'No description'}</p>
          </div>
          <span className={`${status.bg} ${status.text} px-3 py-1.5 rounded-lg text-xs font-bold shadow-md whitespace-nowrap ml-4`}>
            {status.label}
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="space-y-3 mt-5">
          {task.project_name && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 mt-0.5">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Project</p>
                <p className="font-semibold text-gray-900 text-sm">{task.project_name}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {task.due_date && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Due Date</p>
                  <p className="font-semibold text-gray-900 text-sm">{new Date(task.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {task.price && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Price</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(task.price))}</p>
                </div>
              </div>
            )}

            {getTaskAssigneeName(task) && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Assigned To</p>
                  <p className="font-semibold text-gray-900 text-sm">{getTaskAssigneeName(task)}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Reviewer</p>
                <p className="font-semibold text-gray-900 text-sm">{getReviewerName(task)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onView}
            className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4 text-indigo-600" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
