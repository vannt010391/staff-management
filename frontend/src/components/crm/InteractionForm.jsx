import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { createInteraction, updateInteraction, getStages } from '../../services/crm';
import { getUsers } from '../../services/users';

const INTERACTION_TYPES = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'demo', label: 'Demo/Presentation' },
  { value: 'visit', label: 'Site Visit' },
  { value: 'other', label: 'Other' },
];

const OUTCOMES = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

export default function InteractionForm({ customerId, interaction = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    customer: interaction?.customer || customerId,
    interaction_type: interaction?.interaction_type || 'call',
    title: interaction?.title || '',
    description: interaction?.description || '',
    interaction_date: interaction?.interaction_date
      ? new Date(interaction.interaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    duration: interaction?.duration || '',
    stage_before: interaction?.stage_before || '',
    stage_after: interaction?.stage_after || '',
    outcome: interaction?.outcome || 'neutral',
    next_action: interaction?.next_action || '',
    next_action_date: interaction?.next_action_date || '',
    attendees: interaction?.attendees || [],
  });

  useEffect(() => {
    fetchStages();
    fetchUsers();
  }, []);

  const fetchStages = async () => {
    try {
      const data = await getStages();
      setStages(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, options } = e.target;

    if (type === 'select-multiple') {
      const selectedValues = Array.from(options)
        .filter(option => option.selected)
        .map(option => parseInt(option.value));
      setFormData(prev => ({ ...prev, [name]: selectedValues }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.interaction_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        stage_before: formData.stage_before || null,
        stage_after: formData.stage_after || null,
      };

      if (interaction) {
        await updateInteraction(interaction.id, submitData);
        toast.success('Interaction updated successfully');
      } else {
        await createInteraction(submitData);
        toast.success('Interaction created successfully');
      }

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving interaction:', error);
      toast.error(error.response?.data?.detail || 'Failed to save interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {interaction ? 'Edit Interaction' : 'Add New Interaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interaction Type <span className="text-red-500">*</span>
              </label>
              <select
                name="interaction_type"
                value={formData.interaction_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {INTERACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outcome
              </label>
              <select
                name="outcome"
                value={formData.outcome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {OUTCOMES.map(outcome => (
                  <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Initial contact call"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interaction Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="interaction_date"
                value={formData.interaction_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage Before
              </label>
              <select
                name="stage_before"
                value={formData.stage_before}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No change</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.icon} {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage After
              </label>
              <select
                name="stage_after"
                value={formData.stage_after}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No change</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.icon} {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the interaction..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Action
              </label>
              <input
                type="text"
                name="next_action"
                value={formData.next_action}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Send proposal, Schedule follow-up, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Action Date
              </label>
              <input
                type="date"
                name="next_action_date"
                value={formData.next_action_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendees
              </label>
              <select
                name="attendees"
                value={formData.attendees}
                onChange={handleChange}
                multiple
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || user.username} ({user.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Saving...' : (interaction ? 'Update Interaction' : 'Create Interaction')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
