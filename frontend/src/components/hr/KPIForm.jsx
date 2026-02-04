import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';

export default function KPIForm({ kpi = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employee: kpi?.employee || '',
    month: kpi?.month || new Date().toISOString().slice(0, 7) + '-01',
    tasks_completed: kpi?.tasks_completed || 0,
    tasks_on_time: kpi?.tasks_on_time || 0,
    quality_score: kpi?.quality_score || 0,
    collaboration_score: kpi?.collaboration_score || 0,
    innovation_score: kpi?.innovation_score || 0,
    overall_score: kpi?.overall_score || 0,
    notes: kpi?.notes || '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Auto-calculate overall score
  useEffect(() => {
    const { quality_score, collaboration_score, innovation_score } = formData;
    const avg = (parseFloat(quality_score) + parseFloat(collaboration_score) + parseFloat(innovation_score)) / 3;
    setFormData(prev => ({ ...prev, overall_score: avg.toFixed(2) }));
  }, [formData.quality_score, formData.collaboration_score, formData.innovation_score]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/employees/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate tasks on time
    if (parseInt(formData.tasks_on_time) > parseInt(formData.tasks_completed)) {
      toast.error('Tasks on time cannot exceed total tasks completed');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = kpi
        ? `${API_BASE_URL}/hr/kpis/${kpi.id}/`
        : `${API_BASE_URL}/hr/kpis/`;

      const method = kpi ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`KPI ${kpi ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error(error.response?.data?.detail || 'Failed to save KPI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {kpi ? 'Edit KPI' : 'Add Monthly KPI'}
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
          {/* Employee & Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee *
              </label>
              <select
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                required
                disabled={!!kpi}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user_details?.full_name || emp.user_details?.username} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month *
              </label>
              <input
                type="month"
                name="month"
                value={formData.month.slice(0, 7)}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value + '-01' }))}
                required
                disabled={!!kpi}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Tasks Metrics */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasks Completed *
                </label>
                <input
                  type="number"
                  name="tasks_completed"
                  value={formData.tasks_completed}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasks On Time *
                </label>
                <input
                  type="number"
                  name="tasks_on_time"
                  value={formData.tasks_on_time}
                  onChange={handleChange}
                  required
                  min="0"
                  max={formData.tasks_completed}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Performance Scores */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Scores (0-10)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Score *
                </label>
                <input
                  type="number"
                  name="quality_score"
                  value={formData.quality_score}
                  onChange={handleChange}
                  required
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collaboration Score *
                </label>
                <input
                  type="number"
                  name="collaboration_score"
                  value={formData.collaboration_score}
                  onChange={handleChange}
                  required
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Innovation Score *
                </label>
                <input
                  type="number"
                  name="innovation_score"
                  value={formData.innovation_score}
                  onChange={handleChange}
                  required
                  min="0"
                  max="10"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Overall Score (Auto-calculated) */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Score (Auto-calculated)
              </label>
              <div className="text-3xl font-bold text-blue-600">
                {formData.overall_score}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about performance..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : kpi ? 'Update KPI' : 'Create KPI'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
