import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Tag, Edit, Trash2, ListOrdered, FolderKanban, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import projectsService from '../services/projects';
import { Table, ViewToggle } from '../components/ui';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function TopicsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [topics, setTopics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [view, setView] = useState('list');

  const [showForm, setShowForm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', project: '', order: 0 });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsData, projectsData] = await Promise.all([
        projectsService.getAllTopics(),
        projectsService.getProjects(),
      ]);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const projectNameById = useMemo(() => {
    const mapper = {};
    projects.forEach((project) => {
      mapper[project.id] = project.name;
    });
    return mapper;
  }, [projects]);

  const filteredTopics = topics.filter((topic) => {
    const matchesProject = filterProject === 'all' || String(topic.project) === String(filterProject);
    const search = searchQuery.trim().toLowerCase();
    const projectName = (projectNameById[topic.project] || '').toLowerCase();
    const matchesSearch =
      !search ||
      topic.name?.toLowerCase().includes(search) ||
      topic.description?.toLowerCase().includes(search) ||
      projectName.includes(search);
    return matchesProject && matchesSearch;
  });

  const stats = {
    total: topics.length,
    filtered: filteredTopics.length,
    totalTasksInTopics: topics.reduce((sum, topic) => sum + (topic.task_count || 0), 0),
  };

  const openCreateForm = () => {
    setSelectedTopic(null);
    setFormData({ name: '', description: '', project: '', order: 0 });
    setShowForm(true);
  };

  const openEditForm = (topic) => {
    setSelectedTopic(topic);
    setFormData({
      name: topic.name || '',
      description: topic.description || '',
      project: topic.project || '',
      order: topic.order || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.project) {
      toast.error('Name and project are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        project: Number(formData.project),
        order: Number(formData.order || 0),
      };

      if (selectedTopic) {
        await projectsService.updateTopic(selectedTopic.id, payload);
        toast.success('Topic updated successfully');
      } else {
        await projectsService.createTopicItem(payload);
        toast.success('Topic created successfully');
      }

      setShowForm(false);
      setSelectedTopic(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving topic:', error);
      toast.error(error.response?.data?.detail || 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;
    try {
      await projectsService.deleteTopic(topicToDelete.id);
      toast.success('Topic deleted successfully');
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    }
  };

  const columns = [
    { key: 'name', label: 'Topic', width: '25%' },
    {
      key: 'project',
      label: 'Project',
      width: '25%',
      render: (topic) => projectNameById[topic.project] || '-',
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      render: (topic) => (
        <span className="text-sm text-gray-600 line-clamp-2">{topic.description || '-'}</span>
      ),
    },
    {
      key: 'meta',
      label: 'Order / Tasks',
      width: '15%',
      render: (topic) => (
        <div className="text-sm">
          <div>#{topic.order ?? 0}</div>
          <div className="text-gray-500">{topic.task_count || 0} tasks</div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (topic) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${topic.project}`);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="Open Project"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          {canManage && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditForm(topic);
                }}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-3 w-3 text-blue-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTopicToDelete(topic);
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
      ),
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
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold mb-1 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Topics
            </h1>
            <p className="text-blue-100 text-sm">Manage project topics and their ordering</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {canManage && (
              <button
                onClick={openCreateForm}
                className="bg-white text-blue-600 px-6 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                New Topic
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat icon={Tag} label="Total Topics" value={stats.total} />
        <MiniStat icon={FolderKanban} label="Displayed" value={stats.filtered} />
        <MiniStat icon={ListOrdered} label="Linked Tasks" value={stats.totalTasksInTopics} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <Tag className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No topics found</h3>
          <p className="text-sm text-gray-600 mb-4">Create a topic and attach it to a project.</p>
          {canManage && (
            <button
              onClick={openCreateForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Topic
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        <Table columns={columns} data={filteredTopics} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div key={topic.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{topic.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">#{topic.order ?? 0}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{topic.description || '-'}</p>
              <p className="text-xs text-blue-700 font-medium mb-3">{projectNameById[topic.project] || '-'}</p>
              <p className="text-xs text-gray-500">{topic.task_count || 0} tasks</p>
              {canManage && (
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/projects/${topic.project}`)}
                    className="p-1.5 hover:bg-indigo-100 rounded-lg"
                    title="Open Project"
                  >
                    <Eye className="h-3 w-3 text-indigo-600" />
                  </button>
                  <button onClick={() => openEditForm(topic)} className="p-1.5 hover:bg-blue-100 rounded-lg" title="Edit">
                    <Edit className="h-3 w-3 text-blue-600" />
                  </button>
                  <button
                    onClick={() => {
                      setTopicToDelete(topic);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1.5 hover:bg-red-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              )}
              {!canManage && (
                <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/projects/${topic.project}`)}
                    className="p-1.5 hover:bg-indigo-100 rounded-lg"
                    title="Open Project"
                  >
                    <Eye className="h-3 w-3 text-indigo-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedTopic ? 'Edit Topic' : 'Create Topic'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : selectedTopic ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && topicToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Delete topic <span className="font-semibold">{topicToDelete.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
