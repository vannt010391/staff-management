import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit,
  Trash2,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import projectsService from '../services/projects';
import ProjectForm from '../components/projects/ProjectForm';
import { Table, ViewToggle } from '../components/ui';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const data = await projectsService.getProjects(params);
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    try {
      await projectsService.deleteProject(projectToDelete.id);
      toast.success('Project deleted successfully');
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleFormSuccess = async () => {
    await fetchProjects();
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };

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

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      width: '25%',
      render: (project) => (
        <div>
          <div className="font-semibold text-gray-900">{project.name}</div>
          {project.description && (
            <div className="text-xs text-gray-500 line-clamp-1">{project.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'client_name',
      label: 'Client',
      width: '15%',
      render: (project) => project.client_name || '-'
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (project) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      width: '12%',
      render: (project) => new Date(project.start_date).toLocaleDateString()
    },
    {
      key: 'end_date',
      label: 'End Date',
      width: '12%',
      render: (project) => project.end_date ? new Date(project.end_date).toLocaleDateString() : '-'
    },
    {
      key: 'progress',
      label: 'Progress',
      width: '15%',
      render: (project) => {
        const progress = project.total_tasks ? (project.completed_tasks / project.total_tasks) * 100 : 0;
        return (
          <div>
            <div className="text-xs text-gray-600 mb-1">
              {project.completed_tasks}/{project.total_tasks} tasks
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '14%',
      render: (project) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}`);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setShowForm(true);
                }}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-3 w-3 text-blue-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project);
                  setShowDeleteConfirm(true);
                }}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            </>
          )}
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </h1>
            <p className="text-blue-100 text-sm">
              Manage your design projects and track progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setShowForm(true);
                }}
                className="bg-white text-blue-600 px-6 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="h-5 w-5" />}
          title="Total Projects"
          value={stats.total.toString()}
          color="from-blue-500 to-blue-600"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          title="Active"
          value={stats.active.toString()}
          color="from-green-500 to-emerald-600"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          title="Completed"
          value={stats.completed.toString()}
          color="from-purple-500 to-pink-500"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={<Archive className="h-5 w-5" />}
          title="Archived"
          value={stats.archived.toString()}
          color="from-gray-500 to-gray-600"
          iconBg="bg-gray-100"
          iconColor="text-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-3">
            <FolderKanban className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No projects found</h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
          </p>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => {
                setSelectedProject(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        <Table columns={columns} data={filteredProjects} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => {
                setSelectedProject(project);
                setShowForm(true);
              }}
              onDelete={() => {
                setProjectToDelete(project);
                setShowDeleteConfirm(true);
              }}
              canEdit={user?.role === 'admin' || user?.role === 'manager'}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <ProjectForm
          project={selectedProject}
          onClose={() => {
            setShowForm(false);
            setSelectedProject(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete project{' '}
              <span className="font-semibold">{projectToDelete.name}</span>?
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
                  setProjectToDelete(null);
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

function StatCard({ icon, title, value, color, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`${iconBg} p-3 rounded-xl ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onEdit, onDelete, canEdit }) {
  const progress = project.total_tasks
    ? (project.completed_tasks / project.total_tasks) * 100
    : 0;

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
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">{project.description || 'No description'}</p>
          </div>
          {canEdit && (
            <div className="relative">
              <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Client */}
        {project.client_name && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            <span>{project.client_name}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(project.start_date).toLocaleDateString()}
            {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
          </span>
        </div>

        {/* Progress */}
        {project.total_tasks > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-bold text-gray-900">
                {project.completed_tasks}/{project.total_tasks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-0.5 text-right">
              <span className="text-xs font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 py-1.5 rounded-lg font-semibold hover:from-blue-100 hover:to-indigo-100 transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 py-1.5 rounded-lg font-semibold hover:from-red-100 hover:to-pink-100 transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
