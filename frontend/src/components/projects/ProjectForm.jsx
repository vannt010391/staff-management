import { useState, useEffect } from 'react';
import { X, FolderKanban, Save, Loader2, Building2, UserPlus, Check, BookOpen, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import projectsService from '../../services/projects';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function ProjectForm({ project = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [existingTopics, setExistingTopics] = useState([]);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [topicsToDelete, setTopicsToDelete] = useState([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    client_name: project?.client_name || '',
    status: project?.status || 'active',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    budget: project?.budget || '',
    departments: (project?.departments || []).map(d => typeof d === 'object' ? d.id : Number(d)),
    members: (project?.members || []).map(m => typeof m === 'object' ? m.id : Number(m)),
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API_BASE_URL}/hr/departments/`, { headers })
      .then(r => setDepartments(r.data.results || r.data || []))
      .catch(() => {});
    axios.get(`${API_BASE_URL}/users/`, { headers })
      .then(r => setUsers(r.data.results || r.data || []))
      .catch(() => {});
    if (project?.id) {
      projectsService.getAllTopics({ project: project.id })
        .then(data => setExistingTopics(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, []);

  const handleAddTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    if (pendingTopics.some(t => t.name.toLowerCase() === name.toLowerCase()) ||
        existingTopics.some(t => t.name.toLowerCase() === name.toLowerCase() && !topicsToDelete.includes(t.id))) {
      toast.error('Topic name already exists');
      return;
    }
    setPendingTopics(prev => [...prev, { tempId: Date.now(), name }]);
    setNewTopicName('');
  };

  const handleRemovePending = (tempId) => {
    setPendingTopics(prev => prev.filter(t => t.tempId !== tempId));
  };

  const handleMarkDeleteExisting = (topicId) => {
    setTopicsToDelete(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  const toggleSelection = (field, id) => {
    const numId = Number(id);
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(numId)
        ? prev[field].filter(x => x !== numId)
        : [...prev[field], numId]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.client_name.trim()) newErrors.client_name = 'Client name is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date))
        newErrors.end_date = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the errors in the form'); return; }
    setLoading(true);
    try {
      let result;
      if (project) {
        result = await projectsService.updateProject(project.id, formData);
        toast.success('Project updated successfully');
      } else {
        result = await projectsService.createProject(formData);
        toast.success('Project created successfully');
      }
      const savedProjectId = result.id;
      // Create pending topics
      for (const t of pendingTopics) {
        try {
          await projectsService.createTopicItem({ name: t.name, project: savedProjectId });
        } catch (e) {
          toast.warning(`Could not create topic "${t.name}"`);
        }
      }
      // Delete marked topics
      for (const id of topicsToDelete) {
        try {
          await projectsService.deleteTopic(id);
        } catch (e) {
          toast.warning('Could not delete a topic');
        }
      }
      if (onSuccess) await onSuccess(result);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to save project';
      toast.error(errorMessage);
      if (error.response?.data) {
        const apiErrors = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) apiErrors[key] = error.response.data[key][0];
        });
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FolderKanban className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{project ? 'Edit Project' : 'Create New Project'}</h2>
                <p className="text-blue-100 text-sm">{project ? 'Update project information' : 'Add a new project to your portfolio'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter project name" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Client Name <span className="text-red-500">*</span></label>
              <input type="text" name="client_name" value={formData.client_name} onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.client_name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter client name" />
              {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                placeholder="Describe the project..." />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (VND)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} step="0.01" min="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="0.00" />
            </div>

            {/* Departments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-indigo-500" /> Departments
                <span className="text-xs font-normal text-gray-400">(employees in selected departments can see this project)</span>
              </label>
              {departments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No departments available</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border-2 border-gray-200 rounded-xl p-3">
                  {departments.map(dept => {
                    const selected = formData.departments.includes(dept.id);
                    return (
                      <button key={dept.id} type="button" onClick={() => toggleSelection('departments', dept.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                        }`}>
                        {selected && <Check size={12} className="shrink-0" />}
                        <span className="truncate">{dept.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Members */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <UserPlus size={16} className="text-green-500" /> Individual Members
                <span className="text-xs font-normal text-gray-400">(add specific users regardless of department)</span>
              </label>
              {users.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No users available</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3">
                  {users.filter(u => ['admin','manager','team_lead','staff'].includes(u.role)).map(u => {
                    const selected = formData.members.includes(u.id);
                    return (
                      <button key={u.id} type="button" onClick={() => toggleSelection('members', u.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          selected ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                        }`}>
                        {selected && <Check size={12} className="shrink-0" />}
                        <span className="truncate">{u.full_name || u.username}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen size={16} className="text-purple-500" /> Topics
                <span className="text-xs font-normal text-gray-400">(group tasks under topics)</span>
              </label>
              {/* Existing topics (edit mode) */}
              {existingTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {existingTopics.map(t => {
                    const markedDelete = topicsToDelete.includes(t.id);
                    return (
                      <div key={t.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                          markedDelete
                            ? 'bg-red-50 border-red-300 text-red-500 line-through'
                            : 'bg-purple-50 border-purple-300 text-purple-700'
                        }`}>
                        <span>{t.name}</span>
                        <button type="button" onClick={() => handleMarkDeleteExisting(t.id)}
                          className="ml-1 hover:text-red-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Pending new topics */}
              {pendingTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pendingTopics.map(t => (
                    <div key={t.tempId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border-2 bg-green-50 border-green-300 text-green-700">
                      <Plus size={12} />
                      <span>{t.name}</span>
                      <button type="button" onClick={() => handleRemovePending(t.tempId)}
                        className="ml-1 hover:text-red-600 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add new topic input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                  placeholder="New topic name..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <button type="button" onClick={handleAddTopic}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold text-sm hover:bg-purple-200 transition-colors flex items-center gap-1.5">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              disabled={loading}>Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (<><Loader2 className="h-5 w-5 animate-spin" />Saving...</>) : (<><Save className="h-5 w-5" />{project ? 'Update Project' : 'Create Project'}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
