import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Calendar,
  DollarSign,
  User,
  Sparkles,
  TrendingUp,
  Target,
} from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Mock data
  const tasks = [
    {
      id: 1,
      title: 'Design PowerPoint Template - Module 1',
      description: 'Create modern PPT template for e-learning module 1',
      status: 'working',
      priority: 'high',
      project: 'E-Learning Platform',
      assigned_to: 'John Doe',
      due_date: '2024-03-15',
      price: 250.00,
    },
    {
      id: 2,
      title: 'Storyline Interactive Quiz',
      description: 'Build interactive quiz with 20 questions',
      status: 'review_pending',
      priority: 'urgent',
      project: 'Corporate Training',
      assigned_to: 'Jane Smith',
      due_date: '2024-03-10',
      price: 350.00,
    },
    {
      id: 3,
      title: 'Slide Animations & Transitions',
      description: 'Add smooth animations to existing slides',
      status: 'assigned',
      priority: 'medium',
      project: 'E-Learning Platform',
      assigned_to: 'John Doe',
      due_date: '2024-03-20',
      price: 150.00,
    },
  ];

  const stats = [
    { label: 'Total Tasks', value: '15', icon: ListTodo, color: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'In Progress', value: '8', icon: PlayCircle, color: 'from-orange-500 to-red-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: 'Review Pending', value: '3', icon: Clock, color: 'from-purple-500 to-pink-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'Completed', value: '4', icon: CheckCircle, color: 'from-green-500 to-emerald-500', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Header with Glass Morphism */}
      <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                <ListTodo className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {user?.role === 'freelancer' ? 'My Tasks' : 'All Tasks'}
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-16">
              Track and manage your design tasks
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Create Task
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid with Floating Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-600">{stat.label}</p>
                <p className={`text-5xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.iconBg} ${stat.iconColor} p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                <stat.icon className="h-7 w-7" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl`} />
          </div>
        ))}
      </div>

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
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="working">Working</option>
            <option value="review_pending">Review Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-6 py-4 bg-white/80 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium cursor-pointer"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks List with Advanced Cards */}
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, index }) {
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

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div
      className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Gradient Border on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-r ${status.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="absolute inset-[2px] bg-white rounded-2xl" />

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`text-2xl bg-gradient-to-r ${priority.color} bg-clip-text text-transparent`}>
                {priority.icon}
              </span>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
            </div>
            <p className="text-gray-600 ml-8">{task.description}</p>
          </div>
          <span className={`${status.bg} ${status.text} px-4 py-2 rounded-xl text-sm font-bold shadow-lg`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Project</p>
              <p className="font-semibold text-gray-900">{task.project}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned To</p>
              <p className="font-semibold text-gray-900">{task.assigned_to}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="font-semibold text-gray-900">{new Date(task.due_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="font-semibold text-gray-900">${task.price}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl">
            View Details
          </button>
          {task.status === 'review_pending' && (
            <button className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl">
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
