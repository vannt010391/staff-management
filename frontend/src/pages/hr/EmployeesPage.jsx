import { useState, useEffect } from 'react';
import { Users, Search, Plus, Briefcase, Calendar, DollarSign, Award, Filter, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import EmployeeForm from '../../components/hr/EmployeeForm';
import EmployeeDetail from '../../components/hr/EmployeeDetail';
import { PageHeader, StatCard, Button, EmptyState, Table, ViewToggle } from '../../components/ui';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [filterCareerLevel, setFilterCareerLevel] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [filterDepartment, filterCareerLevel]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let url = `${API_BASE_URL}/hr/employees/`;

      const params = new URLSearchParams();
      if (filterDepartment) params.append('department', filterDepartment);
      if (filterCareerLevel) params.append('career_level', filterCareerLevel);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/departments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/employees/${employeeToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee deleted successfully');
      fetchEmployees();
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const handleFormSuccess = async () => {
    await fetchEmployees();
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.employee_id?.toLowerCase().includes(searchLower) ||
      emp.user_details?.username?.toLowerCase().includes(searchLower) ||
      emp.user_details?.full_name?.toLowerCase().includes(searchLower) ||
      emp.position?.toLowerCase().includes(searchLower)
    );
  });

  const getCareerLevelColor = (level) => {
    const colors = {
      'Junior': 'bg-blue-100 text-blue-800',
      'Mid-Level': 'bg-green-100 text-green-800',
      'Senior': 'bg-purple-100 text-purple-800',
      'Team Lead': 'bg-orange-100 text-orange-800',
      'Manager': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      width: '25%',
      render: (employee) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {employee.user_details?.full_name?.charAt(0) || employee.user_details?.username?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {employee.user_details?.full_name || employee.user_details?.username}
            </div>
            <div className="text-xs text-gray-500">{employee.employee_id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'position',
      label: 'Position',
      width: '18%',
      render: (employee) => (
        <div className="flex items-center gap-2 text-sm">
          <Briefcase className="h-3 w-3 text-gray-400" />
          <span>{employee.position}</span>
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      width: '15%',
      render: (employee) => employee.department_name || '-'
    },
    {
      key: 'career_level',
      label: 'Level',
      width: '12%',
      render: (employee) => employee.career_level_display ? (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCareerLevelColor(employee.career_level_display)}`}>
          {employee.career_level_display}
        </span>
      ) : '-'
    },
    {
      key: 'join_date',
      label: 'Join Date',
      width: '12%',
      render: (employee) => new Date(employee.join_date).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (employee) => employee.is_active ? (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">Active</span>
      ) : (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-semibold">Inactive</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '8%',
      render: (employee) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEmployeeId(employee.id);
              setShowDetail(true);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(employee);
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEmployeeToDelete(employee);
              setShowDeleteConfirm(true);
            }}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      )
    },
  ];

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
          icon={Users}
          title="Employees"
          subtitle="Manage internal team members"
          actions={
            <>
              <ViewToggle view={view} onViewChange={setView} />
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedEmployee(null);
                  setShowForm(true);
                }}
              >
                Add Employee
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={employees.length}
            gradient="blue"
          />
          <StatCard
            icon={Briefcase}
            label="Active"
            value={employees.filter(e => e.is_active).length}
            gradient="green"
          />
          <StatCard
            icon={Award}
            label="Departments"
            value={departments.length}
            gradient="purple"
          />
          <StatCard
            icon={DollarSign}
            label="Senior+"
            value={employees.filter(e => ['Senior', 'Team Lead', 'Manager'].includes(e.career_level_display)).length}
            gradient="yellow"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Career Level Filter */}
            <div className="relative">
              <Award className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterCareerLevel}
                onChange={(e) => setFilterCareerLevel(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Levels</option>
                <option value="1">Junior</option>
                <option value="2">Mid-Level</option>
                <option value="3">Senior</option>
                <option value="4">Team Lead</option>
                <option value="5">Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Cards/List */}
        {filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Start by adding your first employee"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedEmployee(null);
                  setShowForm(true);
                }}
              >
                Add Employee
              </Button>
            }
          />
        ) : view === 'list' ? (
          <Table columns={columns} data={filteredEmployees} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {/* Employee Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {employee.user_details?.full_name?.charAt(0) || employee.user_details?.username?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{employee.user_details?.full_name || employee.user_details?.username}</h3>
                    <p className="text-sm text-gray-600">{employee.employee_id}</p>
                  </div>
                  {employee.is_active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                  )}
                </div>

                {/* Employee Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{employee.position}</span>
                  </div>

                  {employee.department_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{employee.department_name}</span>
                    </div>
                  )}

                  {employee.career_level_display && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCareerLevelColor(employee.career_level_display)}`}>
                        {employee.career_level_display}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Joined {new Date(employee.join_date).toLocaleDateString()}
                    </span>
                  </div>

                  {employee.years_of_service && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {employee.years_of_service.toFixed(1)} years of service
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(employee.id);
                      setShowDetail(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Eye className="h-5 w-5" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(employee)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-5 w-5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setEmployeeToDelete(employee);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employee Detail Modal */}
        {showDetail && selectedEmployeeId && (
          <EmployeeDetail
            employeeId={selectedEmployeeId}
            onClose={() => {
              setShowDetail(false);
              setSelectedEmployeeId(null);
            }}
          />
        )}

        {/* Employee Form Modal */}
        {showForm && (
          <EmployeeForm
            employee={selectedEmployee}
            onClose={() => {
              setShowForm(false);
              setSelectedEmployee(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && employeeToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete employee <span className="font-semibold">{employeeToDelete.employee_id}</span>?
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
                    setEmployeeToDelete(null);
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
