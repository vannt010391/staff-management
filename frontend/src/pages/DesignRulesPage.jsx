import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Plus, Search, Eye, Edit, Trash2, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import projectsService from '../services/projects';
import { Table, ViewToggle, RichTextEditor } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

const CATEGORY_OPTIONS = [
  { value: 'layout', label: 'Layout' },
  { value: 'typography', label: 'Typography' },
  { value: 'color', label: 'Color Scheme' },
  { value: 'content', label: 'Content' },
  { value: 'animation', label: 'Animation' },
  { value: 'other', label: 'Other' },
];

export default function DesignRulesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'team_lead' || user?.role === 'staff';
  const canDelete = user?.role === 'admin';

  const [rules, setRules] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRequired, setFilterRequired] = useState('all');
  const [view, setView] = useState('list');

  const [showForm, setShowForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    project: '',
    is_required: true,
    order: 0,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, projectsData] = await Promise.all([
        projectsService.getAllDesignRules(),
        projectsService.getProjects(),
      ]);
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Error fetching design rules:', error);
      toast.error('Failed to load design rules');
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

  const filteredRules = rules.filter((rule) => {
    const matchesProject = filterProject === 'all' || String(rule.project) === String(filterProject);
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesRequired =
      filterRequired === 'all' ||
      (filterRequired === 'required' && rule.is_required) ||
      (filterRequired === 'optional' && !rule.is_required);

    const search = searchQuery.trim().toLowerCase();
    const projectName = (projectNameById[rule.project] || '').toLowerCase();
    const matchesSearch =
      !search ||
      rule.name?.toLowerCase().includes(search) ||
      rule.description?.toLowerCase().includes(search) ||
      projectName.includes(search);

    return matchesProject && matchesCategory && matchesRequired && matchesSearch;
  });

  const stats = {
    total: rules.length,
    required: rules.filter((rule) => rule.is_required).length,
    optional: rules.filter((rule) => !rule.is_required).length,
  };

  const openCreateForm = () => {
    setSelectedRule(null);
    setFormData({
      name: '',
      description: '',
      category: 'other',
      project: '',
      is_required: true,
      order: 0,
    });
    setShowForm(true);
  };

  const openEditForm = (rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name || '',
      description: rule.description || '',
      category: rule.category || 'other',
      project: rule.project || '',
      is_required: !!rule.is_required,
      order: rule.order || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.project) {
      toast.error('Name, description and project are required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        project: Number(formData.project),
        is_required: formData.is_required,
        order: Number(formData.order || 0),
      };

      if (selectedRule) {
        await projectsService.updateDesignRule(selectedRule.id, payload);
        toast.success('Design rule updated successfully');
      } else {
        await projectsService.createDesignRuleItem(payload);
        toast.success('Design rule created successfully');
      }

      setShowForm(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving design rule:', error);
      toast.error(error.response?.data?.detail || 'Failed to save design rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await projectsService.deleteDesignRule(ruleToDelete.id);
      toast.success('Design rule deleted successfully');
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting design rule:', error);
      toast.error('Failed to delete design rule');
    }
  };

  const columns = [
    { key: 'name', label: 'Rule', width: '20%' },
    {
      key: 'project',
      label: 'Project',
      width: '20%',
      render: (rule) => projectNameById[rule.project] || '-',
    },
    {
      key: 'category',
      label: 'Category',
      width: '15%',
      render: (rule) => rule.category_display || rule.category,
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      render: (rule) => (
        <div
          className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: rule.description }}
        />
      ),
    },
    {
      key: 'required',
      label: 'Type',
      width: '10%',
      render: (rule) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rule.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
          {rule.is_required ? 'Required' : 'Optional'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (rule) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${rule.project}`);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="Open Project"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          {canManage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditForm(rule);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-3 w-3 text-blue-600" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRuleToDelete(rule);
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </button>
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
              <Palette className="h-5 w-5" />
              Design Rules
            </h1>
            <p className="text-blue-100 text-sm">Manage design standards for all projects</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            {canManage && (
              <button
                onClick={openCreateForm}
                className="bg-white text-blue-600 px-6 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="h-4 w-4" />
                New Rule
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStat icon={Palette} label="Total Rules" value={stats.total} />
        <MiniStat icon={Filter} label="Required" value={stats.required} />
        <MiniStat icon={Filter} label="Optional" value={stats.optional} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl bg-white">
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl bg-white">
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select value={filterRequired} onChange={(e) => setFilterRequired(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-xl bg-white">
            <option value="all">All Types</option>
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
        </div>
      </div>

      {filteredRules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <Palette className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No design rules found</h3>
          <p className="text-sm text-gray-600 mb-4">Create design rules to standardize project output.</p>
          {canManage && (
            <button
              onClick={openCreateForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Rule
            </button>
          )}
        </div>
      ) : view === 'list' ? (
        <Table columns={columns} data={filteredRules} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{rule.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${rule.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                  {rule.is_required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p className="text-xs text-blue-700 font-medium mb-2">{projectNameById[rule.project] || '-'}</p>
              <p className="text-xs text-gray-500 mb-2">{rule.category_display || rule.category}</p>
              <div
                className="text-sm text-gray-600 line-clamp-3 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: rule.description }}
              />
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => navigate(`/projects/${rule.project}`)} className="p-1.5 hover:bg-indigo-100 rounded-lg" title="Open Project">
                  <Eye className="h-3 w-3 text-indigo-600" />
                </button>
                {canManage && (
                  <button onClick={() => openEditForm(rule)} className="p-1.5 hover:bg-blue-100 rounded-lg" title="Edit">
                    <Edit className="h-3 w-3 text-blue-600" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      setRuleToDelete(rule);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1.5 hover:bg-red-100 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedRule ? 'Edit Design Rule' : 'Create Design Rule'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="required-rule"
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_required: e.target.checked }))}
                  className="h-4 w-4"
                />
                <label htmlFor="required-rule" className="text-sm text-gray-700">Required rule</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                  placeholder="Describe the design rule..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : selectedRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && ruleToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Delete design rule <span className="font-semibold">{ruleToDelete.name}</span>?</p>
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
