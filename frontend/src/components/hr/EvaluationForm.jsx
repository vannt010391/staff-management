import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';

export default function EvaluationForm({ evaluation = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    employee: evaluation?.employee || '',
    period_type: evaluation?.period_type || 'quarterly',
    period_start: evaluation?.period_start || '',
    period_end: evaluation?.period_end || '',
    overall_rating: evaluation?.overall_rating || 'meets',
    strengths: evaluation?.strengths || '',
    areas_for_improvement: evaluation?.areas_for_improvement || '',
    achievements: evaluation?.achievements || '',
    goals_next_period: evaluation?.goals_next_period || '',
    promotion_recommended: evaluation?.promotion_recommended || false,
    salary_increase_recommended: evaluation?.salary_increase_recommended || false,
    recommended_increase_percentage: evaluation?.recommended_increase_percentage || 0,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate date range
    if (formData.period_start && formData.period_end) {
      if (new Date(formData.period_end) <= new Date(formData.period_start)) {
        toast.error('Period end date must be after period start date');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = evaluation
        ? `${API_BASE_URL}/hr/evaluations/${evaluation.id}/`
        : `${API_BASE_URL}/hr/evaluations/`;

      const method = evaluation ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Evaluation ${evaluation ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error(error.response?.data?.detail || 'Failed to save evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {evaluation ? 'Edit Evaluation' : 'New Performance Evaluation'}
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
          {/* Basic Info */}
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
                disabled={!!evaluation}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
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
                Period Type *
              </label>
              <select
                name="period_type"
                value={formData.period_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi-Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <select
              name="overall_rating"
              value={formData.overall_rating}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="outstanding">Outstanding</option>
              <option value="exceeds">Exceeds Expectations</option>
              <option value="meets">Meets Expectations</option>
              <option value="needs_improvement">Needs Improvement</option>
              <option value="unsatisfactory">Unsatisfactory</option>
            </select>
          </div>

          {/* Evaluation Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strengths *
                </label>
                <textarea
                  name="strengths"
                  value={formData.strengths}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Key strengths demonstrated during this period..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Areas for Improvement *
                </label>
                <textarea
                  name="areas_for_improvement"
                  value={formData.areas_for_improvement}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Areas where the employee can improve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Achievements *
                </label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Notable achievements and contributions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goals for Next Period *
                </label>
                <textarea
                  name="goals_next_period"
                  value={formData.goals_next_period}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Goals and objectives for the next evaluation period..."
                />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promotion_recommended"
                  name="promotion_recommended"
                  checked={formData.promotion_recommended}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="promotion_recommended" className="text-sm font-medium text-gray-700">
                  Recommend for Promotion
                </label>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="salary_increase_recommended"
                    name="salary_increase_recommended"
                    checked={formData.salary_increase_recommended}
                    onChange={handleChange}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="salary_increase_recommended" className="text-sm font-medium text-gray-700">
                    Recommend Salary Increase
                  </label>
                </div>

                {formData.salary_increase_recommended && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommended Increase Percentage *
                    </label>
                    <input
                      type="number"
                      name="recommended_increase_percentage"
                      value={formData.recommended_increase_percentage}
                      onChange={handleChange}
                      required={formData.salary_increase_recommended}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 10.5"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : evaluation ? 'Update Evaluation' : 'Create Evaluation'}
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
