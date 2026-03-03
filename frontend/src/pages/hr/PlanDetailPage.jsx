import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, CheckCircle2, Clock, FileText, Plus, Link2 } from 'lucide-react';
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
  const [projectTasks, setProjectTasks] = useState([]);
  const [linkProjectTasks, setLinkProjectTasks] = useState([]);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingLinkTask, setSavingLinkTask] = useState(false);
  const [taskMode, setTaskMode] = useState('create');

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    related_project: '',
    related_task: ''
  });

  const [noteText, setNoteText] = useState('');

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    due_date: ''
  });

  const [linkTaskForm, setLinkTaskForm] = useState({
    project: '',
    task_id: '',
    goal_title: '',
    goal_description: '',
    priority: 'medium'
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

  const fetchTasksByProject = async (projectId) => {
    if (!projectId) {
      setProjectTasks([]);
      return;
    }

    try {
      const data = await tasksService.getTasks({ project: projectId });
      setProjectTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      setProjectTasks([]);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchProjects();
  }, [id]);

  useEffect(() => {
    fetchTasksByProject(goalForm.related_project);
  }, [goalForm.related_project]);

  useEffect(() => {
    const fetchLinkTasks = async () => {
      if (!linkTaskForm.project) {
        setLinkProjectTasks([]);
        return;
      }

      try {
        const data = await tasksService.getTasks({ project: linkTaskForm.project });
        setLinkProjectTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching existing tasks:', error);
        setLinkProjectTasks([]);
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
        related_project: goalForm.related_project ? Number(goalForm.related_project) : null,
        related_task: goalForm.related_task ? Number(goalForm.related_task) : null
      });

      setGoalForm({
        title: '',
        description: '',
        priority: 'medium',
        related_project: '',
        related_task: ''
      });
      setProjectTasks([]);
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

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!canCreateTask) {
      toast.error('You do not have permission to create tasks');
      return;
    }

    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.project) {
      toast.error('Please fill title, description, and project');
      return;
    }

    try {
      setSavingTask(true);
      const dueDateValue = taskForm.due_date ? `${taskForm.due_date}T23:59:00` : null;

      const createdTask = await tasksService.createTask({
        title: taskForm.title,
        description: taskForm.description,
        project: Number(taskForm.project),
        priority: taskForm.priority,
        due_date: dueDateValue,
      });

      await plansService.addGoal(plan.id, {
        title: taskForm.title,
        description: taskForm.description,
        priority: mapTaskPriorityToGoalPriority(taskForm.priority),
        related_project: Number(taskForm.project),
        related_task: createdTask.id
      });

      setTaskForm({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        due_date: ''
      });

      toast.success('Task created and linked to this plan');
      await fetchDetail();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error(error.response?.data?.error || 'Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleLinkExistingTask = async (e) => {
    e.preventDefault();

    if (!linkTaskForm.project || !linkTaskForm.task_id) {
      toast.error('Please select project and existing task');
      return;
    }

    const selectedTask = linkProjectTasks.find(task => String(task.id) === String(linkTaskForm.task_id));
    if (!selectedTask) {
      toast.error('Selected task not found');
      return;
    }

    try {
      setSavingLinkTask(true);

      await plansService.addGoal(plan.id, {
        title: linkTaskForm.goal_title?.trim() || selectedTask.title,
        description: linkTaskForm.goal_description?.trim() || selectedTask.description || '',
        priority: linkTaskForm.priority || mapTaskPriorityToGoalPriority(selectedTask.priority),
        related_project: Number(linkTaskForm.project),
        related_task: Number(linkTaskForm.task_id)
      });

      setLinkTaskForm({
        project: '',
        task_id: '',
        goal_title: '',
        goal_description: '',
        priority: 'medium'
      });
      setLinkProjectTasks([]);

      toast.success('Existing task linked to this plan');
      await fetchDetail();
    } catch (error) {
      console.error('Error linking existing task:', error);
      toast.error('Failed to link existing task');
    } finally {
      setSavingLinkTask(false);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={goalForm.related_project}
                onChange={(e) => setGoalForm(prev => ({ ...prev, related_project: e.target.value, related_task: '' }))}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Link project (optional)</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>

              <select
                value={goalForm.related_task}
                onChange={(e) => setGoalForm(prev => ({ ...prev, related_task: e.target.value }))}
                disabled={!goalForm.related_project}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              >
                <option value="">Link task (optional)</option>
                {projectTasks.map(task => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>

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
                <div className="font-medium text-gray-900">{goal.title}</div>
                <div className="text-sm text-gray-600">{goal.description || '-'}</div>
                {(goal.related_task_details || goal.related_project_details) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {goal.related_project_details && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                        <Link2 className="h-3 w-3" />
                        Project: {goal.related_project_details.name}
                      </span>
                    )}
                    {goal.related_task_details && (
                      <button
                        onClick={() => navigate(`/tasks/${goal.related_task_details.id}`)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        <Link2 className="h-3 w-3" />
                        Task: {goal.related_task_details.title}
                      </button>
                    )}
                  </div>
                )}
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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Task (Linked to Project)</h3>

          {!canCreateTask ? (
            <p className="text-sm text-gray-600">You do not have permission to add tasks. Please ask Manager/Admin.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTaskMode('create')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    taskMode === 'create' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Create New Task
                </button>
                <button
                  type="button"
                  onClick={() => setTaskMode('link')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    taskMode === 'link' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Link Existing Task
                </button>
              </div>

              {taskMode === 'create' ? (
                <form onSubmit={handleAddTask} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Task title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={taskForm.project}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, project: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Task description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {savingTask ? 'Creating Task...' : 'Add Task to Plan'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLinkExistingTask} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={linkTaskForm.project}
                      onChange={(e) => setLinkTaskForm(prev => ({ ...prev, project: e.target.value, task_id: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                    <select
                      value={linkTaskForm.task_id}
                      onChange={(e) => setLinkTaskForm(prev => ({ ...prev, task_id: e.target.value }))}
                      disabled={!linkTaskForm.project}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    >
                      <option value="">Select existing task</option>
                      {linkProjectTasks.map(task => (
                        <option key={task.id} value={task.id}>{task.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={linkTaskForm.goal_title}
                      onChange={(e) => setLinkTaskForm(prev => ({ ...prev, goal_title: e.target.value }))}
                      placeholder="Goal title override (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={linkTaskForm.priority}
                      onChange={(e) => setLinkTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <textarea
                    value={linkTaskForm.goal_description}
                    onChange={(e) => setLinkTaskForm(prev => ({ ...prev, goal_description: e.target.value }))}
                    rows={3}
                    placeholder="Goal description override (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={savingLinkTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <Link2 className="h-4 w-4" />
                    {savingLinkTask ? 'Linking Task...' : 'Link Task to Plan'}
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
