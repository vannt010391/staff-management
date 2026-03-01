import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Target, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { getStages, createStage, updateStage, deleteStage, toggleStageActive } from '../../../services/crm';
import PageHeader from '../../../components/ui/PageHeader';

const COLORS = [
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'green', label: 'Green', hex: '#10b981' },
  { value: 'yellow', label: 'Yellow', hex: '#f59e0b' },
  { value: 'purple', label: 'Purple', hex: '#8b5cf6' },
  { value: 'emerald', label: 'Emerald', hex: '#10b981' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
];

export default function CustomerStagesPage() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: 'blue',
    description: '',
    order: 0,
    success_probability: 50,
    is_active: true,
    is_final: false,
  });

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const data = await getStages();
      setStages(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast.error('Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stage) => {
    setSelectedStage(stage);
    setFormData({
      name: stage.name,
      icon: stage.icon,
      color: stage.color,
      description: stage.description || '',
      order: stage.order,
      success_probability: stage.success_probability,
      is_active: stage.is_active,
      is_final: stage.is_final,
    });
    setShowForm(true);
  };

  const handleDelete = async (stage) => {
    if (stage.is_system) {
      toast.error('Cannot delete system stage');
      return;
    }

    if (confirm(`Delete stage "${stage.name}"?`)) {
      try {
        await deleteStage(stage.id);
        toast.success('Stage deleted');
        await fetchStages();
      } catch (error) {
        console.error('Error deleting stage:', error);
        toast.error('Failed to delete stage');
      }
    }
  };

  const handleToggleActive = async (stage) => {
    try {
      await toggleStageActive(stage.id);
      toast.success(`Stage ${stage.is_active ? 'deactivated' : 'activated'}`);
      await fetchStages();
    } catch (error) {
      console.error('Error toggling stage:', error);
      toast.error('Failed to toggle stage');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedStage) {
        await updateStage(selectedStage.id, formData);
        toast.success('Stage updated');
      } else {
        await createStage(formData);
        toast.success('Stage created');
      }

      setShowForm(false);
      setSelectedStage(null);
      setFormData({
        name: '',
        icon: '📝',
        color: 'blue',
        description: '',
        order: 0,
        success_probability: 50,
        is_active: true,
        is_final: false,
      });
      await fetchStages();
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error('Failed to save stage');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PageHeader
        icon={Target}
        title="Customer Stages"
        subtitle="Manage sales pipeline stages"
        actions={
          <button
            onClick={() => {
              setSelectedStage(null);
              setFormData({
                name: '',
                icon: '📝',
                color: 'blue',
                description: '',
                order: 0,
                success_probability: 50,
                is_active: true,
                is_final: false,
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Stage
          </button>
        }
      />

      {/* Stages List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : (
          <div className="divide-y">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-4xl">{stage.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
                        {stage.is_system && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            System
                          </span>
                        )}
                        {stage.is_final && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                            Final
                          </span>
                        )}
                        {!stage.is_active && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Order: {stage.order}</span>
                        <span>Probability: {stage.success_probability}%</span>
                        <span>Color: <span className={`inline-block w-4 h-4 rounded bg-${stage.color}-500`}></span> {stage.color_display}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(stage)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title={stage.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {stage.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(stage)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5 text-blue-600" />
                    </button>
                    {!stage.is_system && (
                      <button
                        onClick={() => handleDelete(stage)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">
              {selectedStage ? 'Edit Stage' : 'Add New Stage'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-full px-4 py-2 border rounded-lg text-left flex items-center gap-2"
                    >
                      <span className="text-2xl">{formData.icon}</span>
                      <span className="text-gray-600">Click to change</span>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute top-full left-0 mt-2 z-10">
                        <EmojiPicker
                          onEmojiClick={(emoji) => {
                            setFormData({ ...formData, icon: emoji.emoji });
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color *</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {COLORS.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Success Probability (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.success_probability}
                    onChange={(e) => setFormData({ ...formData, success_probability: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Order *</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_final}
                      onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Final Stage</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
                >
                  {selectedStage ? 'Update' : 'Create'} Stage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedStage(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
