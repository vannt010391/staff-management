import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';

export default function SalaryReviewForm({ review = null, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    employee: review?.employee || '',
    current_salary: review?.current_salary || 0,
    proposed_salary: review?.proposed_salary || 0,
    reason: review?.reason || '',
    justification: review?.justification || '',
    effective_date: review?.effective_date || '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Update current salary when employee is selected
    if (formData.employee && employees.length > 0) {
      const emp = employees.find(e => e.id == formData.employee);
      if (emp) {
        setSelectedEmployee(emp);
        setFormData(prev => ({
          ...prev,
          current_salary: emp.current_salary
        }));
      }
    }
  }, [formData.employee, employees]);

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

  const calculateIncreasePercentage = () => {
    if (formData.current_salary && formData.proposed_salary) {
      const increase = ((parseFloat(formData.proposed_salary) - parseFloat(formData.current_salary)) / parseFloat(formData.current_salary)) * 100;
      return increase.toFixed(2);
    }
    return '0.00';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate proposed salary is greater than current salary
    if (parseFloat(formData.proposed_salary) <= parseFloat(formData.current_salary)) {
      toast.error('Proposed salary must be greater than current salary');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = review
        ? `${API_BASE_URL}/hr/salary-reviews/${review.id}/`
        : `${API_BASE_URL}/hr/salary-reviews/`;

      const method = review ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Salary review ${review ? 'updated' : 'created'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving salary review:', error);
      toast.error(error.response?.data?.detail || 'Failed to save salary review');
    } finally {
      setLoading(false);
    }
  };

  const increasePercentage = calculateIncreasePercentage();
  const increaseAmount = formData.proposed_salary && formData.current_salary
    ? parseFloat(formData.proposed_salary) - parseFloat(formData.current_salary)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {review ? 'Edit Salary Review' : 'New Salary Review Request'}
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
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee *
            </label>
            <select
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              required
              disabled={!!review}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.user_details?.full_name || emp.user_details?.username} ({emp.employee_id}) - Current: ${parseFloat(emp.current_salary).toLocaleString()}
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <p className="text-sm text-gray-600 mt-1">
                Position: {selectedEmployee.position} | Department: {selectedEmployee.department_name}
              </p>
            )}
          </div>

          {/* Salary Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Salary
                </label>
                <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                  ${parseFloat(formData.current_salary || 0).toLocaleString()}
                </div>
              </div>

              {/* Proposed Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Salary *
                </label>
                <input
                  type="number"
                  name="proposed_salary"
                  value={formData.proposed_salary}
                  onChange={handleChange}
                  required
                  min={parseFloat(formData.current_salary) + 1}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter proposed salary"
                />
              </div>
            </div>

            {/* Increase Summary */}
            {formData.proposed_salary > 0 && formData.current_salary > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Increase Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      +${increaseAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Increase Percentage</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{increasePercentage}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date *
            </label>
            <input
              type="date"
              name="effective_date"
              value={formData.effective_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Salary Review *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Primary reason for this salary review (e.g., Performance-based, Promotion, Market adjustment)..."
            />
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Justification
            </label>
            <textarea
              name="justification"
              value={formData.justification}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Detailed justification including achievements, contributions, market data, etc..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : review ? 'Update Review' : 'Submit Review'}
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
