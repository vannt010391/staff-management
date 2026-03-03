import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Filter, TrendingUp, Target, Clock, CheckCircle2, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';
import api from '../../services/api';
import PlanForm from '../../components/hr/PlanForm';
import { PageHeader, StatCard, Button, EmptyState, Table, ViewToggle } from '../../components/ui';

export default function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [view, setView] = useState('list');
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [groupOrder, setGroupOrder] = useState('name');
  const [listViewMode, setListViewMode] = useState('flat');
  const [selectedOwnerKey, setSelectedOwnerKey] = useState(null);

  // Data for filters
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, [viewMode, selectedDepartment, selectedEmployee, filterType, filterStatus]);

  useEffect(() => {
    if (viewMode === 'all') {
      fetchFilterData();
    }
  }, [viewMode]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      let data;
      if (viewMode === 'my') {
        data = await plansService.getMyPlans();
      } else {
        // All plans with filters
        const params = {};
        if (selectedDepartment) params['user__employee_profile__department'] = selectedDepartment;
        if (selectedEmployee) params.user = selectedEmployee;
        if (filterType) params.plan_type = filterType;
        if (filterStatus) params.status = filterStatus;
        data = await plansService.getAllPlans(params);
      }
      setPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      // Fetch departments and employees for filters
      const [deptResponse, empResponse] = await Promise.all([
        api.get('/hr/departments/'),
        api.get('/hr/employees/')
      ]);

      const depts = deptResponse.data;
      const emps = empResponse.data;

      setDepartments(Array.isArray(depts) ? depts : depts.results || []);
      setEmployees(Array.isArray(emps) ? emps : emps.results || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await plansService.deletePlan(id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleView = (plan) => {
    navigate(`/hr/plans/${plan.id}`);
  };

  const filteredPlans = plans.filter(plan => {
    if (filterType && plan.plan_type !== filterType) return false;
    if (filterStatus && plan.status !== filterStatus) return false;
    return true;
  });

  const getPlanOwnerName = (plan) => {
    return (
      plan.user_name ||
      plan.user_details?.full_name ||
      plan.user_details?.username ||
      plan.employee_name ||
      'Unassigned'
    );
  };

  const groupedPlans = filteredPlans.reduce((groups, plan) => {
    const ownerName = getPlanOwnerName(plan);
    const ownerKey = String(plan.user || plan.user_id || ownerName);
    const ownerEmployee = employees.find(emp => String(emp.user) === String(plan.user || plan.user_id));
    const departmentName =
      ownerEmployee?.department_name ||
      ownerEmployee?.department_details?.name ||
      'No Department';

    if (!groups[ownerKey]) {
      groups[ownerKey] = {
        ownerKey,
        ownerName,
        departmentName,
        plans: []
      };
    }

    groups[ownerKey].plans.push(plan);
    return groups;
  }, {});

  const groupedPlanEntries = Object.values(groupedPlans).sort((a, b) => {
    if (groupOrder === 'department') {
      const byDepartment = a.departmentName.localeCompare(b.departmentName, undefined, { sensitivity: 'base' });
      if (byDepartment !== 0) return byDepartment;
      return a.ownerName.localeCompare(b.ownerName, undefined, { sensitivity: 'base' });
    }

    return a.ownerName.localeCompare(b.ownerName, undefined, { sensitivity: 'base' });
  });

  const selectedOwnerGroup = groupedPlanEntries.find(group => group.ownerKey === selectedOwnerKey);

  // Stats
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    completed: plans.filter(p => p.status === 'completed').length,
    avgCompletion: plans.length > 0
      ? Math.round(plans.reduce((sum, p) => sum + p.completion_percentage, 0) / plans.length)
      : 0
  };

  const getPlanTypeColor = (type) => {
    const colors = {
      'daily': 'bg-blue-100 text-blue-800',
      'weekly': 'bg-green-100 text-green-800',
      'monthly': 'bg-purple-100 text-purple-800',
      'yearly': 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-purple-100 text-purple-800',
      'draft': 'bg-gray-100 text-gray-800',
      'archived': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'title',
      label: 'Plan Title',
      width: '25%',
      render: (plan) => (
        <div>
          <div className="font-semibold text-gray-900">{plan.title}</div>
          {plan.user_name && (
            <div className="text-xs text-purple-600">{plan.user_name}</div>
          )}
        </div>
      )
    },
    {
      key: 'plan_type',
      label: 'Type',
      width: '12%',
      render: (plan) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
          {plan.plan_type_display}
        </span>
      )
    },
    {
      key: 'period',
      label: 'Period',
      width: '20%',
      render: (plan) => (
        <div className="text-sm">
          {new Date(plan.period_start).toLocaleDateString()} - {new Date(plan.period_end).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      width: '15%',
      render: (plan) => (
        <div>
          <div className="text-xs text-gray-600 mb-1">{plan.completion_percentage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 rounded-full"
              style={{ width: `${plan.completion_percentage}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (plan) => (
        <div className="space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
            {plan.status_display}
          </span>
          {plan.is_active_period && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Clock className="w-3 h-3" />
              <span>Active</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '16%',
      render: (plan) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(plan);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(plan);
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(plan.id);
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={Target}
          title={
            <div className="flex items-center gap-4">
              <span>Plans</span>
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'my'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Plans
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Plans
                </button>
              </div>
            </div>
          }
          subtitle={viewMode === 'my' ? 'Track your goals and progress' : 'View team plans and progress'}
          actions={
            <>
              <ViewToggle view={view} onViewChange={setView} />
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedPlan(null);
                  setShowForm(true);
                }}
              >
                New Plan
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            label="Total Plans"
            value={stats.total}
            gradient="blue"
          />
          <StatCard
            icon={Clock}
            label="Active Plans"
            value={stats.active}
            gradient="green"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.completed}
            gradient="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Progress"
            value={`${stats.avgCompletion}%`}
            gradient="yellow"
          />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />

            {viewMode === 'all' && (
              <>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>

                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.user}>
                      {emp.user_details?.full_name || emp.user_details?.username || emp.employee_id}
                    </option>
                  ))}
                </select>

                <select
                  value={groupOrder}
                  onChange={(e) => setGroupOrder(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="name">Group Order: A-Z</option>
                  <option value="department">Group Order: Department</option>
                </select>

                {view === 'list' && (
                  <select
                    value={listViewMode}
                    onChange={(e) => setListViewMode(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="flat">List Mode: Each Plan Row</option>
                    <option value="owner">List Mode: Group by Owner</option>
                  </select>
                )}
              </>
            )}

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">All Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {(filterType || filterStatus || selectedDepartment || selectedEmployee || groupOrder !== 'name' || listViewMode !== 'flat') && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setSelectedDepartment('');
                  setSelectedEmployee('');
                  setGroupOrder('name');
                  setListViewMode('flat');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Plans Grid/List */}
        {filteredPlans.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No plans found"
            description="Start by creating your first plan"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedPlan(null);
                  setShowForm(true);
                }}
              >
                Create Plan
              </Button>
            }
          />
        ) : view === 'list' ? (
          viewMode === 'all' && listViewMode === 'owner' ? (
            <div className="space-y-6">
              {groupedPlanEntries.map((group) => (
                <div
                  key={group.ownerKey}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.ownerName}&apos;s plan{group.departmentName && group.departmentName !== 'No Department' ? ` - ${group.departmentName}` : ''}
                    </h3>
                    <span className="text-sm text-gray-500">{group.plans.length} plan(s)</span>
                  </div>
                  <Table columns={columns} data={group.plans} />
                </div>
              ))}
            </div>
          ) : (
            <Table columns={columns} data={filteredPlans} />
          )
        ) : (
          viewMode === 'all' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPlanEntries.map((group) => {
                  const activeCount = group.plans.filter(plan => plan.status === 'active').length;
                  const dailyCount = group.plans.filter(plan => plan.plan_type === 'daily').length;
                  const avgProgress = group.plans.length > 0
                    ? Math.round(group.plans.reduce((sum, plan) => sum + plan.completion_percentage, 0) / group.plans.length)
                    : 0;

                  return (
                    <div
                      key={group.ownerKey}
                      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer ${
                        selectedOwnerKey === group.ownerKey ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedOwnerKey(prev => (prev === group.ownerKey ? null : group.ownerKey))}
                    >
                      <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                              {group.ownerName}&apos;s plan
                            </h3>
                            <div className="text-sm text-gray-600 truncate">
                              {group.departmentName && group.departmentName !== 'No Department' ? group.departmentName : 'No Department'}
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {group.plans.length} plan(s)
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-lg bg-blue-50 py-2">
                            <div className="text-xs text-gray-500">Daily</div>
                            <div className="text-sm font-semibold text-blue-700">{dailyCount}</div>
                          </div>
                          <div className="rounded-lg bg-green-50 py-2">
                            <div className="text-xs text-gray-500">Active</div>
                            <div className="text-sm font-semibold text-green-700">{activeCount}</div>
                          </div>
                          <div className="rounded-lg bg-purple-50 py-2">
                            <div className="text-xs text-gray-500">Avg</div>
                            <div className="text-sm font-semibold text-purple-700">{avgProgress}%</div>
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                          {selectedOwnerKey === group.ownerKey ? 'Hide plan details' : 'View plan details'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedOwnerGroup && (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedOwnerGroup.ownerName}&apos;s plan details
                    </h3>
                    <span className="text-sm text-gray-500">{selectedOwnerGroup.plans.length} plan(s)</span>
                  </div>
                  <Table columns={columns} data={selectedOwnerGroup.plans} />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map(plan => (
              <div
                key={plan.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
              {/* Plan Type Badge */}
              <div className={`h-2 ${
                plan.plan_type === 'daily' ? 'bg-blue-500' :
                plan.plan_type === 'weekly' ? 'bg-green-500' :
                plan.plan_type === 'monthly' ? 'bg-purple-500' :
                'bg-orange-500'
              }`} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {plan.title}
                    </h3>
                    {plan.user_name && (
                      <div className="text-sm text-purple-600 font-medium mb-1">
                        {plan.user_name}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="capitalize">{plan.plan_type_display}</span>
                      <span>•</span>
                      <span>
                        {new Date(plan.period_start).toLocaleDateString()} - {new Date(plan.period_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-green-100 text-green-800' :
                    plan.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                    plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {plan.status_display}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{plan.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${plan.completion_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Active Period Indicator */}
                {plan.is_active_period && (
                  <div className="flex items-center space-x-2 text-sm text-green-600 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>Currently active</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleView(plan)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
              ))}
            </div>
          )
        )}

        {/* Modals */}
        {showForm && (
          <PlanForm
            plan={selectedPlan}
            onClose={() => {
              setShowForm(false);
              setSelectedPlan(null);
            }}
            onSuccess={async () => {
              await fetchPlans();
              setShowForm(false);
              setSelectedPlan(null);
            }}
          />
        )}

      </div>
    </div>
  );
}
