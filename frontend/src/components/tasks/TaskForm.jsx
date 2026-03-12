import { useState, useEffect } from 'react';
import { X, ListTodo, Save, Loader2, Upload, UserPlus, Check, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import tasksService from '../../services/tasks';
import projectsService from '../../services/projects';
import usersService from '../../services/users';
import { TASK_STATUS, TASK_PRIORITY } from '../../constants';

export default function TaskForm({ task = null, projectId = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project || projectId || '',
    topic: task?.topic || '',
    assignees: task?.assignees || [],
    status: task?.status || 'new',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    price: task?.price || '',
    estimated_hours: task?.estimated_hours || '',
    notes: task?.notes || '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch topics whenever selected project changes
  useEffect(() => {
    if (!formData.project) {
      setTopics([]);
      return;
    }
    projectsService.getAllTopics({ project: formData.project })
      .then(data => setTopics(Array.isArray(data) ? data : []))
      .catch(() => setTopics([]));
  }, [formData.project]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [projectsResult, usersResult] = await Promise.allSettled([
        projectsService.getProjects({ status: 'active' }),
        usersService.getUsers()
      ]);

      if (projectsResult.status === 'fulfilled') {
        setProjects(Array.isArray(projectsResult.value) ? projectsResult.value : []);
      }
      if (usersResult.status === 'fulfilled') {
        setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear topic when project changes
      ...(name === 'project' ? { topic: '' } : {}),
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleAssignee = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.project) {
      newErrors.project = 'Project is required';
    }

    // Price is optional, but if provided, must be greater than 0
    if (formData.price && parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    // Build clean payload - omit empty optional fields
    const payload = {
      title: formData.title,
      description: formData.description,
      project: formData.project,
      assignees: formData.assignees,
      status: formData.status,
      priority: formData.priority,
    };
    if (formData.topic) payload.topic = formData.topic;
    if (formData.due_date) payload.due_date = formData.due_date;
    if (formData.price) payload.price = formData.price;

    try {
      let result;
      if (task) {
        result = await tasksService.updateTask(task.id, payload);
        toast.success('Task updated successfully');
      } else {
        result = await tasksService.createTask(payload);
        toast.success('Task created successfully');

        // Upload files if any
        if (selectedFiles.length > 0) {
          for (const file of selectedFiles) {
            try {
              await tasksService.uploadFile(result.id, file, 'reference');
            } catch (error) {
              console.error('Error uploading file:', error);
              toast.warning(`Failed to upload ${file.name}`);
            }
          }
        }
      }

      if (onSuccess) {
        await onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          'Failed to save task';
      toast.error(errorMessage);

      if (error.response?.data) {
        const apiErrors = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            apiErrors[key] = error.response.data[key][0];
          }
        });
        setErrors(apiErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ListTodo className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {task ? 'Edit Task' : 'Create New Task'}
                </h2>
                <p className="text-purple-100 text-sm">
                  {task ? 'Update task information' : 'Add a new task to track'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                placeholder="Describe the task..."
              />
            </div>

            {/* Project + Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Project */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    errors.project ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Topic
                </label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  disabled={!formData.project || topics.length === 0}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{!formData.project ? 'Select project first' : topics.length === 0 ? 'No topics available' : 'No topic'}</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assign To - Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                Assign To
                {formData.assignees.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {formData.assignees.length} selected
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-200 rounded-xl bg-gray-50 max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-400">No users available</p>
                ) : (
                  users.map(user => {
                    const isSelected = formData.assignees.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-green-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {user.first_name || user.last_name
                          ? `${user.first_name} ${user.last_name}`.trim()
                          : user.username}
                        <span className="text-gray-400">({user.role})</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value={TASK_STATUS.NEW}>New</option>
                  <option value={TASK_STATUS.ASSIGNED}>Assigned</option>
                  <option value={TASK_STATUS.WORKING}>Working</option>
                  <option value={TASK_STATUS.REVIEW_PENDING}>Review Pending</option>
                  <option value={TASK_STATUS.APPROVED}>Approved</option>
                  <option value={TASK_STATUS.REJECTED}>Rejected</option>
                  <option value={TASK_STATUS.COMPLETED}>Completed</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value={TASK_PRIORITY.LOW}>Low</option>
                  <option value={TASK_PRIORITY.MEDIUM}>Medium</option>
                  <option value={TASK_PRIORITY.HIGH}>High</option>
                  <option value={TASK_PRIORITY.URGENT}>Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date, Price & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (VND)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Est. Hours
                </label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={formData.estimated_hours}
                  onChange={handleChange}
                  step="0.5"
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* File Upload (only for new tasks) */}
            {!task && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Drop files here or{' '}
                      <span className="text-purple-600 font-semibold">browse</span>
                    </span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      {selectedFiles.length} file(s) selected
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {task ? 'Update Task' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
