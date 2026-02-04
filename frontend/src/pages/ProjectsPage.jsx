import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users,
  MoreVertical,
  Archive,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - sẽ thay bằng API call
  const projects = [
    {
      id: 1,
      name: 'E-Learning Platform Design',
      description: 'Design PowerPoint slides for online learning platform',
      client_name: 'ABC Company',
      status: 'active',
      total_tasks: 15,
      completed_tasks: 8,
      start_date: '2024-01-15',
      end_date: '2024-03-30',
    },
    {
      id: 2,
      name: 'Corporate Training Module',
      description: 'Storyline interactive modules for employee training',
      client_name: 'XYZ Corp',
      status: 'active',
      total_tasks: 20,
      completed_tasks: 12,
      start_date: '2024-02-01',
      end_date: '2024-04-15',
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
              <FolderKanban className="h-8 w-8" />
              Projects
            </h1>
            <p className="text-blue-100 text-lg">
              Manage your design projects and track progress
            </p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<FolderKanban className="h-6 w-6" />}
          title="Total Projects"
          value="2"
          color="from-blue-500 to-blue-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          title="Active"
          value="2"
          color="from-green-500 to-emerald-600"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6" />}
          title="Completed"
          value="0"
          color="from-purple-500 to-pink-500"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<Archive className="h-6 w-6" />}
          title="Archived"
          value="0"
          color="from-gray-500 to-gray-600"
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FolderKanban className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-4xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`${iconBg} p-4 rounded-2xl ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const progress = (project.completed_tasks / project.total_tasks) * 100;

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Client */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{project.client_name}</span>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{project.completed_tasks}/{project.total_tasks} tasks</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right">
            <span className="text-xs font-semibold text-blue-600">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 py-2 rounded-xl font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center gap-2 group-hover:scale-105">
          <Sparkles className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  );
}
