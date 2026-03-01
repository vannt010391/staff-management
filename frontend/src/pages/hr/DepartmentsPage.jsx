import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit, Trash2, Users, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import DepartmentForm from '../../components/hr/DepartmentForm';
import { PageHeader, StatCard, Button, EmptyState, Table, ViewToggle } from '../../components/ui';

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [view, setView] = useState('list');

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
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
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

  const handleView = (department) => {
    navigate(`/hr/departments/${department.id}`);
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

  const handleFormSuccess = async () => {
    await fetchDepartments();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={Building2}
          title="Departments"
          subtitle="Manage organizational departments"
          actions={
            <>
              <ViewToggle view={view} onViewChange={setView} />
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedDepartment(null);
                  setShowForm(true);
                }}
              >
                New Department
              </Button>
            </>
          }
        />

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            label="Total Departments"
            value={departments.length}
            gradient="blue"
          />
        </div>

        {/* Departments Display */}
        {departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments found"
            description="Start by creating your first department"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedDepartment(null);
                  setShowForm(true);
                }}
              >
                New Department
              </Button>
            }
          />
        ) : view === 'list' ? (
          <Table
            columns={[
              { key: 'name', label: 'Department Name', width: '25%' },
              { key: 'description', label: 'Description', width: '30%' },
              {
                key: 'manager',
                label: 'Manager',
                width: '20%',
                render: (dept) => dept.manager_details?.full_name || dept.manager_details?.username || '-'
              },
              {
                key: 'employee_count',
                label: 'Employees',
                width: '15%',
                render: (dept) => dept.employee_count || 0
              },
              {
                key: 'actions',
                label: 'Actions',
                width: '10%',
                render: (dept) => (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(dept);
                      }}
                      className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(dept);
                      }}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDepartmentToDelete(dept);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )
              }
            ]}
            data={departments}
          />
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
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => handleView(department)}
                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="View"
                >
                  <Eye className="h-4 w-4 text-indigo-600" />
                </button>
                <button
                  onClick={() => handleEdit(department)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </button>
                <button
                  onClick={() => {
                    setDepartmentToDelete(department);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDepartmentToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
