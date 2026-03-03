import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';
import { useAuthStore } from '../../stores/authStore';

export default function PlanForm({ plan, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [formData, setFormData] = useState({
    user: '',
    plan_type: 'daily',
    period_start: '',
    period_end: '',
    title: '',
    description: '',
    status: 'draft'
  });

  const canAssignOwner = ['admin', 'manager', 'team_lead', 'staff'].includes(user?.role);

  useEffect(() => {
    if (plan) {
      setFormData({
        user: plan.user || '',
        plan_type: plan.plan_type || 'daily',
        period_start: plan.period_start || '',
        period_end: plan.period_end || '',
        title: plan.title || '',
        description: plan.description || '',
        status: plan.status || 'draft'
      });
    } else {
      // Set default dates based on plan type
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        user: user?.id || '',
        period_start: today
      }));
    }
  }, [plan, user?.id]);

  useEffect(() => {
    const fetchAssignableUsers = async () => {
      if (!canAssignOwner) return;
      try {
        const data = await plansService.getAssignableUsers();
        setAssignableUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching assignable users:', error);
      }
    };

    fetchAssignableUsers();
  }, [canAssignOwner]);

  // Auto-set period_end based on plan_type
  useEffect(() => {
    if (formData.period_start && !plan) {
      const start = new Date(formData.period_start);
      let end = new Date(start);

      switch (formData.plan_type) {
        case 'daily':
          end = new Date(start);
          break;
        case 'weekly':
          end.setDate(start.getDate() + 6);
          break;
        case 'monthly':
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          break;
        case 'quarterly':
          end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
          break;
        case 'yearly':
          end = new Date(start.getFullYear(), 11, 31);
          break;
      }

      setFormData(prev => ({
        ...prev,
        period_end: end.toISOString().split('T')[0]
      }));
    }
  }, [formData.plan_type, formData.period_start, plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.period_start || !formData.period_end) {
      toast.error('Please select period dates');
      return;
    }
    if (new Date(formData.period_end) < new Date(formData.period_start)) {
      toast.error('End date must be after start date');
      return;
    }
    if (canAssignOwner && !formData.user) {
      toast.error('Please select a plan owner');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        user: canAssignOwner ? Number(formData.user) : undefined
      };

      if (!canAssignOwner) {
        delete payload.user;
      }

      if (plan) {
        await plansService.updatePlan(plan.id, payload);
        toast.success('Plan updated successfully');
      } else {
        await plansService.createPlan(payload);
        toast.success('Plan created successfully');
      }
      await onSuccess();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {plan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Owner */}
          {canAssignOwner && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Owner *
              </label>
              <select
                name="user"
                value={formData.user}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select user</option>
                {assignableUsers.map(assignableUser => (
                  <option key={assignableUser.id} value={assignableUser.id}>
                    {assignableUser.full_name || assignableUser.username}
                    {assignableUser.department_name ? ` - ${assignableUser.department_name}` : ''}
                  </option>
                ))}
                {assignableUsers.length === 0 && user?.id && (
                  <option value={user.id}>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : user.username}
                  </option>
                )}
              </select>
            </div>
          )}

          {/* Plan Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Type *
            </label>
            <select
              name="plan_type"
              value={formData.plan_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="daily">Daily Plan</option>
              <option value="weekly">Weekly Plan</option>
              <option value="monthly">Monthly Plan</option>
              <option value="quarterly">Quarterly Plan</option>
              <option value="yearly">Yearly Plan</option>
            </select>
          </div>

          {/* Period Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start *
              </label>
              <input
                type="date"
                name="period_start"
                value={formData.period_start}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End *
              </label>
              <input
                type="date"
                name="period_end"
                value={formData.period_end}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Q1 Sales Goals, Sprint Planning, Weekly Focus"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Overview and context for this plan..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
