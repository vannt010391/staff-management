import { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Circle, Trash2, MessageSquare, Calendar, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';

export default function PlanDetail({ planId, onClose, onUpdate }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', priority: 'medium' });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  useEffect(() => {
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const data = await plansService.getPlan(planId);
      setPlan(data);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast.error('Failed to load plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      await plansService.addGoal(planId, newGoal);
      toast.success('Goal added successfully');
      setNewGoal({ title: '', description: '', priority: 'medium' });
      setShowGoalForm(false);
      fetchPlanDetails();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const handleToggleGoal = async (goalId) => {
    try {
      await plansService.toggleGoalComplete(goalId);
      fetchPlanDetails();
    } catch (error) {
      console.error('Error toggling goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return;

    try {
      await plansService.deleteGoal(goalId);
      toast.success('Goal deleted');
      fetchPlanDetails();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await plansService.addNote(planId, newNote);
      toast.success('Note added');
      setNewNote('');
      fetchPlanDetails();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.note || '');
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSaveEditNote = async (noteId) => {
    if (!editingNoteText.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    try {
      await plansService.updateNote(noteId, { note: editingNoteText });
      toast.success('Note updated');
      handleCancelEditNote();
      fetchPlanDetails();
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await plansService.deleteNote(noteId);
      toast.success('Note deleted');
      fetchPlanDetails();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {plan.plan_type_display}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {plan.status_display}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
              <div className="flex items-center space-x-2 text-white/90">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(plan.period_start).toLocaleDateString()} - {new Date(plan.period_end).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-bold">{plan.completion_percentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: `${plan.completion_percentage}%` }}
              />
            </div>
            <div className="text-sm mt-2 text-white/90">
              {plan.completed_goals} of {plan.total_goals} goals completed
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          {plan.description && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{plan.description}</p>
            </div>
          )}

          {/* Goals Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goals</h3>
              <button
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </div>

            {/* Add Goal Form */}
            {showGoalForm && (
              <form onSubmit={handleAddGoal} className="bg-purple-50 rounded-lg p-4 mb-4 space-y-3">
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Goal title"
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Goal description (optional)"
                  rows={2}
                  className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <div className="flex items-center space-x-3">
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                    className="px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Add Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Goals List */}
            <div className="space-y-3">
              {plan.goals && plan.goals.length > 0 ? (
                plan.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                      goal.is_completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleGoal(goal.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {goal.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-purple-600" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium ${goal.is_completed ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                            {goal.title}
                          </h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              goal.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              goal.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              goal.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {goal.priority}
                            </span>
                            {goal.related_task_details && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                Task: {goal.related_task_details.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No goals yet. Add your first goal to get started!
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Reflections</h3>

            {/* Add Note */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or reflection..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <button
                onClick={handleAddNote}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                Add Note
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {plan.notes && plan.notes.length > 0 ? (
                plan.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 text-sm text-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">{note.created_by_name}</span>
                        <span>•</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {editingNoteId === note.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEditNote(note.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEditNote}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {editingNoteId === note.id ? (
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none bg-white"
                      />
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No notes yet</p>
              )}
            </div>
          </div>

          {/* Manager Feedback */}
          {plan.manager_feedback && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manager Feedback</h3>
              <p className="text-gray-700 whitespace-pre-wrap mb-2">{plan.manager_feedback}</p>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{plan.reviewed_by_name}</span>
                {' • '}
                <span>{new Date(plan.reviewed_at).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
