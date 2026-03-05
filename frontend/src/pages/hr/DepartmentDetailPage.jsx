import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Users, FileText, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: ''
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hr/departments/${id}/`);
        setDepartment(response.data);
      } catch (error) {
        console.error('Error fetching department detail:', error);
        toast.error('Failed to load department detail');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Users response:', response.data);
      const userData = Array.isArray(response.data) ? response.data : response.data.results || [];
      console.log('Processed users:', userData);
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/hr/employees/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Employees response:', response.data);
      const allEmployees = Array.isArray(response.data) ? response.data : response.data.results || [];
      console.log('All employees:', allEmployees);
      setEmployees(allEmployees);

      // Pre-select employees already in this department
      const deptEmployees = allEmployees.filter(emp => emp.department === parseInt(id));
      console.log('Department employees:', deptEmployees);
      setSelectedEmployees(deptEmployees.map(emp => emp.id));
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  };

  const handleEditClick = async () => {
    setFormData({
      name: department.name,
      description: department.description || '',
      manager: department.manager || ''
    });
    setShowEditModal(true);
    // Load data after opening modal so user sees loading state
    await Promise.all([loadUsers(), loadEmployees()]);
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');

      // Update department info
      await axios.patch(
        `${API_URL}/hr/departments/${id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update employees: assign selected employees to this department, unassign others
      const updatePromises = employees.map(async (employee) => {
        const shouldBeInDept = selectedEmployees.includes(employee.id);
        const currentlyInDept = employee.department === parseInt(id);

        if (shouldBeInDept && !currentlyInDept) {
          // Add employee to department
          return axios.patch(
            `${API_URL}/hr/employees/${employee.id}/`,
            { department: parseInt(id) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else if (!shouldBeInDept && currentlyInDept) {
          // Remove employee from department
          return axios.patch(
            `${API_URL}/hr/employees/${employee.id}/`,
            { department: null },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      });

      await Promise.all(updatePromises.filter(Boolean));

      toast.success('Department updated successfully!');
      setShowEditModal(false);
      // Reload department data
      const response = await api.get(`/hr/departments/${id}/`);
      setDepartment(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update department');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!department) return <div className="p-6 text-gray-600">Department not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/hr/departments')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Departments
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Department</span>
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Building2} label="Department" value={department.name} />
          <Info icon={Users} label="Employee Count" value={department.employee_count || 0} />
          <Info icon={Users} label="Manager" value={department.manager_details?.full_name || department.manager_details?.username || 'Not assigned'} />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-gray-900 whitespace-pre-line">{department.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Department</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                <select
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No manager assigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="4"
                  placeholder="Department description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employees ({selectedEmployees.length} selected)
                </label>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto p-2">
                  {employees.length === 0 ? (
                    <p className="text-gray-500 text-sm p-2">Loading employees...</p>
                  ) : (
                    employees.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, employee.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {employee.user_details?.full_name || employee.user_details?.username || 'Unknown'}
                          {employee.department === parseInt(id) && (
                            <span className="ml-2 text-xs text-blue-600">(Current)</span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select employees to assign to this department</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
