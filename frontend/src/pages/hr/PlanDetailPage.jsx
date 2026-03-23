import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, CheckCircle2, Clock, FileText, Plus, Link2, FolderPlus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';
import tasksService from '../../services/tasks';
import projectsService from '../../services/projects';
import PlanDailyTracking from '../../components/hr/PlanDailyTracking';
import PlanUpdateHistory from '../../components/hr/PlanUpdateHistory';
import { useAuthStore } from '../../stores/authStore';

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [linkProjectTasks, setLinkProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskMode, setTaskMode] = useState('link'); // 'link' | 'create'
  const [taskProjectMode, setTaskProjectMode] = useState('existing'); // 'existing' | 'new'

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const [noteText, setNoteText] = useState('');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    due_date: ''
  });

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  const [linkTaskForm, setLinkTaskForm] = useState({
    project: '',
    task_id: '',
  });

  const canCreateTask = ['admin', 'manager', 'team_lead', 'staff'].includes(user?.role);

  const mapTaskPriorityToGoalPriority = (priority) => {
    if (priority === 'urgent') return 'critical';
    return priority;
  };

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await plansService.getPlan(id);
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan detail:', error);
      toast.error('Failed to load plan detail');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectsService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchProjects();
  }, [id]);

  useEffect(() => {
    const fetchLinkTasks = async () => {
      if (!linkTaskForm.project) {
        setLinkProjectTasks([]);
        return;
      }
      try {
        setLoadingTasks(true);
        const data = await tasksService.getTasks({ project: linkTaskForm.project, page_size: 100 });
        setLinkProjectTasks(Array.isArray(data) ? data : (data?.results || []));
      } catch (error) {
        console.error('Error fetching existing tasks:', error);
        setLinkProjectTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchLinkTasks();
  }, [linkTaskForm.project]);

  const handleAddGoal = async (e) => {
    e.preventDefault();

    if (!goalForm.title.trim()) {
      toast.error('Please enter goal title');
      return;
    }

    try {
      setSavingGoal(true);
      await plansService.addGoal(plan.id, {
        title: goalForm.title,
        description: goalForm.description,
        priority: goalForm.priority,
      });

      setGoalForm({ title: '', description: '', priority: 'medium' });
      toast.success('Goal added successfully');
      await fetchDetail();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error('Please enter note content');
      return;
    }

    try {
      setSavingNote(true);
      await plansService.addNote(plan.id, noteText.trim());
      setNoteText('');
      toast.success('Note added successfully');
      await fetchDetail();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  // Create new task (in existing or new project) and link as goal
  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!canCreateTask) {
      toast.error('You do not have permission to create tasks');
      return;
    }

    if (!taskForm.title.trim()) {
      toast.error('Please enter task title');
      return;
    }

    try {
      setSavingTask(true);
      let projectId;

      if (taskProjectMode === 'new') {
        // Create new project first
        if (!newProjectForm.name.trim() || !newProjectForm.start_date || !newProjectForm.end_date) {
          toast.error('Please fill in new project name, start date and end date');
          return;
        }
        const newProject = await projectsService.createProject({
          name: newProjectForm.name.trim(),
          start_date: newProjectForm.start_date,
          end_date: newProjectForm.end_date,
        });
        projectId = newProject.id;
        await fetchProjects();
        toast.success(`Project "${newProject.name}" created`);
      } else {
        if (!taskForm.project) {
          toast.error('Please select a project');
          return;
        }
        projectId = Number(taskForm.project);
      }

      const dueDateValue = taskForm.due_date ? `${taskForm.due_date}T23:59:00` : null;

      const createdTask = await tasksService.createTask({
        title: taskForm.title,
        description: taskForm.description,
        project: projectId,
        priority: taskForm.priority,
        due_date: dueDateValue,
      });

      await plansService.addGoal(plan.id, {
        title: taskForm.title,
        description: taskForm.description,
        priority: mapTaskPriorityToGoalPriority(taskForm.priority),
        related_project: projectId,
        related_task: createdTask.id
      });

      setTaskForm({ title: '', description: '', project: '', priority: 'medium', due_date: '' });
      setNewProjectForm({ name: '', start_date: '', end_date: '' });
      setTaskProjectMode('existing');

      toast.success('Task created and linked to this plan');
      await fetchDetail();
    } catch (error) {
      console.error('Error adding task:', error);
      const errMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to create task';
      toast.error(errMsg);
    } finally {
      setSavingTask(false);
    }
  };

  // Link an existing task as a goal in this plan
  const handleLinkExistingTask = async (e) => {
    e.preventDefault();

    if (!linkTaskForm.project || !linkTaskForm.task_id) {
      toast.error('Please select a project and a task');
      return;
    }

    const selectedTask = linkProjectTasks.find(t => String(t.id) === String(linkTaskForm.task_id));
    if (!selectedTask) {
      toast.error('Selected task not found');
      return;
    }

    try {
      setSavingTask(true);
      await plansService.addGoal(plan.id, {
        title: selectedTask.title,
        description: selectedTask.description || '',
        priority: mapTaskPriorityToGoalPriority(selectedTask.priority) || 'medium',
        related_project: Number(linkTaskForm.project),
        related_task: Number(linkTaskForm.task_id)
      });

      setLinkTaskForm({ project: '', task_id: '' });
      setLinkProjectTasks([]);

      toast.success('Task linked to this plan');
      await fetchDetail();
    } catch (error) {
      console.error('Error linking existing task:', error);
      toast.error('Failed to link task');
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!plan) return <div className="p-6 text-gray-600">Plan not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/hr/plans')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
          <p className="text-gray-600 mt-1">{plan.plan_type_display || plan.plan_type} • {plan.status_display || plan.status}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Calendar} label="Period" value={`${new Date(plan.period_start).toLocaleDateString()} - ${new Date(plan.period_end).toLocaleDateString()}`} />
          <Info icon={Target} label="Progress" value={`${plan.completion_percentage || 0}%`} />
          <Info icon={CheckCircle2} label="Completed Goals" value={`${plan.completed_goals || 0} / ${plan.total_goals || 0}`} />
          <Info icon={Clock} label="Active Period" value={plan.is_active_period ? 'Yes' : 'No'} />
        </div>

        <Section title="Description" content={plan.description} />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
          </div>

          <form onSubmit={handleAddGoal} className="mb-6 p-4 rounded-xl border border-purple-100 bg-purple-50/70 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={goalForm.title}
                onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Goal title"
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={goalForm.priority}
                onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <textarea
              value={goalForm.description}
              onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Goal description"
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
            />

            <button
              type="submit"
              disabled={savingGoal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {savingGoal ? 'Adding...' : 'Add Goal'}
            </button>
          </form>

          <div className="space-y-2">
            {plan.goals?.length ? plan.goals.map((goal) => (
              <div key={goal.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">{goal.title}</div>
                    {goal.description && <div className="text-sm text-gray-600 mt-0.5">{goal.description}</div>}
                    {goal.related_task_details && (
                      <button
                        onClick={() => navigate(`/tasks/${goal.related_task_details.id}`)}
                        className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        <Link2 className="h-3 w-3" />
                        Task: {goal.related_task_details.title}
                      </button>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    goal.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    goal.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{goal.priority}</span>
                </div>
              </div>
            )) : <p className="text-gray-500">No goals yet.</p>}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <div className="mb-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/70">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="Write a note for this plan..."
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={savingNote}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {savingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>

          <div className="space-y-2">
            {plan.notes?.length ? plan.notes.map((note) => (
              <div key={note.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700 whitespace-pre-line">{note.note}</div>
                <div className="text-xs text-gray-500 mt-1">{note.created_by_name} • {new Date(note.created_at).toLocaleString()}</div>
              </div>
            )) : <p className="text-gray-500">No notes yet.</p>}
          </div>
        </div>

        {/* Add Task to Plan */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Add Task to Plan</h3>
          <p className="text-sm text-gray-500 mb-4">Link an existing project task or create a new task and add it to this plan.</p>

          {!canCreateTask ? (
            <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">You do not have permission to add tasks. Please ask your Manager/Admin.</p>
          ) : (
            <div className="space-y-4">
              {/* Mode tabs */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setTaskMode('link')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    taskMode === 'link' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  Link Existing Task
                </button>
                <button
                  type="button"
                  onClick={() => setTaskMode('create')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    taskMode === 'create' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Create New Task
                </button>
              </div>

              {/* ── Link Existing Task ── */}
              {taskMode === 'link' && (
                <form onSubmit={handleLinkExistingTask} className="space-y-4 p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                  {/* Step 1: Select project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1. Select project</label>
                    <select
                      value={linkTaskForm.project}
                      onChange={(e) => setLinkTaskForm({ project: e.target.value, task_id: '' })}
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">— Choose a project —</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Task list (card selection) */}
                  {linkTaskForm.project && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Select task
                        {loadingTasks && <span className="ml-2 text-xs text-gray-400">Loading...</span>}
                      </label>
                      {!loadingTasks && linkProjectTasks.length === 0 ? (
                        <p className="text-sm text-gray-500 italic bg-white rounded-lg p-3 border border-gray-200">No tasks found in this project.</p>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                          {linkProjectTasks.map(task => (
                            <div
                              key={task.id}
                              onClick={() => setLinkTaskForm(prev => ({ ...prev, task_id: String(task.id) }))}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                linkTaskForm.task_id === String(task.id)
                                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                              }`}
                            >
                              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                                linkTaskForm.task_id === String(task.id) ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                              }`}>
                                {linkTaskForm.task_id === String(task.id) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 truncate">{task.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    task.status === 'in_progress' || task.status === 'working' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>{task.status}</span>
                                  <span className="text-xs text-gray-400">{task.priority}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingTask || !linkTaskForm.task_id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Link2 className="h-4 w-4" />
                    {savingTask ? 'Linking...' : 'Link Task to Plan'}
                  </button>
                </form>
              )}

              {/* ── Create New Task ── */}
              {taskMode === 'create' && (
                <form onSubmit={handleAddTask} className="space-y-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  {/* Project mode toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setTaskProjectMode('existing')}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          taskProjectMode === 'existing' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                        }`}
                      >Existing Project</button>
                      <button
                        type="button"
                        onClick={() => setTaskProjectMode('new')}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          taskProjectMode === 'new' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        <FolderPlus className="h-3 w-3" /> New Project
                      </button>
                    </div>

                    {taskProjectMode === 'existing' ? (
                      <select
                        value={taskForm.project}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, project: e.target.value }))}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">— Select project —</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2 p-3 bg-white rounded-lg border border-indigo-200">
                        <p className="text-xs text-indigo-600 font-medium">New project details</p>
                        <input
                          type="text"
                          value={newProjectForm.name}
                          onChange={(e) => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Project name *"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Start date *</label>
                            <input
                              type="date"
                              value={newProjectForm.start_date}
                              onChange={(e) => setNewProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">End date *</label>
                            <input
                              type="date"
                              value={newProjectForm.end_date}
                              onChange={(e) => setNewProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Task fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Task title *</label>
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      placeholder="Task description (optional)"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Due date</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {savingTask ? (taskProjectMode === 'new' ? 'Creating project & task...' : 'Creating task...') : 'Add Task to Plan'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Daily Progress Tracking and Update History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlanDailyTracking planId={plan.id} />
          <PlanUpdateHistory planId={plan.id} />
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-gray-900 whitespace-pre-line">{content || 'No content provided.'}</p>
        </div>
      </div>
    </div>
  );
}
