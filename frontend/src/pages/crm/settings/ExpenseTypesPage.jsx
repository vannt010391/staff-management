import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { getExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType, toggleExpenseTypeActive } from '../../../services/crm';
import PageHeader from '../../../components/ui/PageHeader';

const COLORS = [
  { value: 'purple', label: 'Purple', hex: '#8b5cf6' },
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
  { value: 'yellow', label: 'Yellow', hex: '#f59e0b' },
  { value: 'green', label: 'Green', hex: '#10b981' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'gray', label: 'Gray', hex: '#6b7280' },
];

export default function ExpenseTypesPage() {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: 'gray',
    description: '',
    order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  const fetchExpenseTypes = async () => {
    try {
      setLoading(true);
      const data = await getExpenseTypes();
      setExpenseTypes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      toast.error('Failed to load expense types');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      icon: type.icon,
      color: type.color,
      description: type.description || '',
      order: type.order,
      is_active: type.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (type) => {
    if (type.is_system) {
      toast.error('Cannot delete system expense type');
      return;
    }

    if (confirm(`Delete expense type "${type.name}"?`)) {
      try {
        await deleteExpenseType(type.id);
        toast.success('Expense type deleted');
        await fetchExpenseTypes();
      } catch (error) {
        console.error('Error deleting expense type:', error);
        toast.error('Failed to delete expense type');
      }
    }
  };

  const handleToggleActive = async (type) => {
    try {
      await toggleExpenseTypeActive(type.id);
      toast.success(`Expense type ${type.is_active ? 'deactivated' : 'activated'}`);
      await fetchExpenseTypes();
    } catch (error) {
      console.error('Error toggling expense type:', error);
      toast.error('Failed to toggle expense type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedType) {
        await updateExpenseType(selectedType.id, formData);
        toast.success('Expense type updated');
      } else {
        await createExpenseType(formData);
        toast.success('Expense type created');
      }

      setShowForm(false);
      setSelectedType(null);
      setFormData({
        name: '',
        icon: '📝',
        color: 'gray',
        description: '',
        order: 0,
        is_active: true,
      });
      await fetchExpenseTypes();
    } catch (error) {
      console.error('Error saving expense type:', error);
      toast.error('Failed to save expense type');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PageHeader
        icon={DollarSign}
        title="Expense Types"
        subtitle="Manage customer expense categories"
        actions={
          <button
            onClick={() => {
              setSelectedType(null);
              setFormData({
                name: '',
                icon: '📝',
                color: 'gray',
                description: '',
                order: 0,
                is_active: true,
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Expense Type
          </button>
        }
      />

      {/* Expense Types List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : (
          <div className="divide-y">
            {expenseTypes.map((type) => (
              <div
                key={type.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-4xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                        {type.is_system && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                            System
                          </span>
                        )}
                        {!type.is_active && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Order: {type.order}</span>
                        <span>Color: <span className={`inline-block w-4 h-4 rounded bg-${type.color}-500`}></span> {type.color_display}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(type)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title={type.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {type.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(type)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5 text-blue-600" />
                    </button>
                    {!type.is_system && (
                      <button
                        onClick={() => handleDelete(type)}
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
              {selectedType ? 'Edit Expense Type' : 'Add New Expense Type'}
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
                  {selectedType ? 'Update' : 'Create'} Expense Type
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedType(null);
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
