import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import DepartmentForm from '../../components/hr/DepartmentForm';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/departments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/departments/${departmentToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department deleted successfully');
      fetchDepartments();
      setShowDeleteConfirm(false);
      setDepartmentToDelete(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete department');
    }
  };

  const handleFormSuccess = () => {
    fetchDepartments();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            Departments
          </h1>
          <p className="text-gray-600 mt-1">Manage organizational departments</p>
        </div>
        <button
          onClick={() => {
            setSelectedDepartment(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          New Department
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Departments</p>
            <p className="text-4xl font-bold mt-1">{departments.length}</p>
          </div>
          <Building2 className="h-16 w-16 text-blue-200" />
        </div>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div
              key={department.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {/* Department Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{department.name}</h3>
                  </div>
                  {department.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{department.description}</p>
                  )}
                </div>
              </div>

              {/* Department Info */}
              <div className="space-y-3 mt-4">
                {department.manager_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Manager: {department.manager_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{department.employee_count || 0} employees</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(department)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDepartmentToDelete(department);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Department Form Modal */}
      {showForm && (
        <DepartmentForm
          department={selectedDepartment}
          onClose={() => {
            setShowForm(false);
            setSelectedDepartment(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && departmentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the <span className="font-semibold">{departmentToDelete.name}</span> department?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDepartmentToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
