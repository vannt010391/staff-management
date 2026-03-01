import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Users, Calendar, BarChart, Plus, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import KPIForm from '../../components/hr/KPIForm';
import KPIDetail from '../../components/hr/KPIDetail';
import { PageHeader, StatCard, Button, EmptyState, Table, ViewToggle } from '../../components/ui';

export default function KPIPage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [kpiForDetail, setKpiForDetail] = useState(null);
  const [view, setView] = useState('list');

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchKPIs();
    }
    fetchEmployees();
  }, [selectedMonth, filterEmployee]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      let url = `${API_BASE_URL}/hr/kpis/`;

      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (filterEmployee) params.append('employee', filterEmployee);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setKpis(data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast.error('Failed to fetch KPIs');
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/employees/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const calculateAverages = () => {
    if (kpis.length === 0) return null;

    const totalTasks = kpis.reduce((sum, kpi) => sum + kpi.tasks_completed, 0);
    const totalOnTime = kpis.reduce((sum, kpi) => sum + kpi.tasks_on_time, 0);
    const avgQuality = kpis.reduce((sum, kpi) => sum + parseFloat(kpi.quality_score), 0) / kpis.length;
    const avgCollaboration = kpis.reduce((sum, kpi) => sum + parseFloat(kpi.collaboration_score), 0) / kpis.length;
    const avgInnovation = kpis.reduce((sum, kpi) => sum + parseFloat(kpi.innovation_score), 0) / kpis.length;
    const avgOverall = kpis.reduce((sum, kpi) => sum + parseFloat(kpi.overall_score), 0) / kpis.length;

    return {
      totalTasks,
      totalOnTime,
      onTimePercentage: totalTasks > 0 ? ((totalOnTime / totalTasks) * 100).toFixed(1) : 0,
      avgQuality: avgQuality.toFixed(2),
      avgCollaboration: avgCollaboration.toFixed(2),
      avgInnovation: avgInnovation.toFixed(2),
      avgOverall: avgOverall.toFixed(2)
    };
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const handleEdit = (kpi) => {
    setSelectedKpi(kpi);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!kpiToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/kpis/${kpiToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('KPI deleted successfully');
      fetchKPIs();
      setShowDeleteConfirm(false);
      setKpiToDelete(null);
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete KPI');
    }
  };

  const handleFormSuccess = async () => {
    await fetchKPIs();
  };

  const averages = calculateAverages();

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      width: '20%',
      render: (kpi) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
            {kpi.employee_details?.user_details?.full_name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {kpi.employee_details?.user_details?.full_name || kpi.employee_details?.user_details?.username}
            </div>
            <div className="text-xs text-gray-500">{kpi.employee_details?.position}</div>
          </div>
        </div>
      )
    },
    {
      key: 'month',
      label: 'Period',
      width: '12%',
      render: (kpi) => new Date(kpi.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    },
    {
      key: 'tasks',
      label: 'Tasks',
      width: '12%',
      render: (kpi) => (
        <div className="text-sm">
          <div className="font-semibold text-gray-900">{kpi.tasks_completed} completed</div>
          <div className="text-xs text-gray-600">{kpi.tasks_on_time} on time ({kpi.on_time_percentage}%)</div>
        </div>
      )
    },
    {
      key: 'quality_score',
      label: 'Quality',
      width: '10%',
      render: (kpi) => (
        <div className={`text-center px-2 py-1 rounded ${getScoreColor(kpi.quality_score)}`}>
          <div className="font-bold">{kpi.quality_score}</div>
        </div>
      )
    },
    {
      key: 'collaboration_score',
      label: 'Collaboration',
      width: '10%',
      render: (kpi) => (
        <div className={`text-center px-2 py-1 rounded ${getScoreColor(kpi.collaboration_score)}`}>
          <div className="font-bold">{kpi.collaboration_score}</div>
        </div>
      )
    },
    {
      key: 'innovation_score',
      label: 'Innovation',
      width: '10%',
      render: (kpi) => (
        <div className={`text-center px-2 py-1 rounded ${getScoreColor(kpi.innovation_score)}`}>
          <div className="font-bold">{kpi.innovation_score}</div>
        </div>
      )
    },
    {
      key: 'overall_score',
      label: 'Overall',
      width: '10%',
      render: (kpi) => (
        <div className={`text-center px-3 py-2 rounded-xl border-2 ${getScoreColor(kpi.overall_score)}`}>
          <div className="text-xl font-bold">{kpi.overall_score}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '16%',
      render: (kpi) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setKpiForDetail(kpi);
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
              handleEdit(kpi);
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setKpiToDelete(kpi);
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
          icon={TrendingUp}
          title="KPI Dashboard"
          subtitle="Performance metrics and tracking"
          actions={
            <>
              <ViewToggle view={view} onViewChange={setView} />
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedKpi(null);
                  setShowForm(true);
                }}
              >
                New KPI
              </Button>
            </>
          }
        />

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Selector */}
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth ? selectedMonth.substring(0, 7) : ''}
                onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Employee Filter */}
            <div className="relative">
              <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user_details?.full_name || emp.user_details?.username} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {averages && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={Target}
              label="Total Tasks"
              value={averages.totalTasks}
              gradient="blue"
            />
            <StatCard
              icon={Award}
              label="On-Time Rate"
              value={`${averages.onTimePercentage}%`}
              gradient="green"
            />
            <StatCard
              icon={BarChart}
              label="Avg Quality"
              value={averages.avgQuality}
              gradient="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Overall Score"
              value={averages.avgOverall}
              gradient="yellow"
            />
          </div>
        )}

        {/* KPI Cards/List */}
        {kpis.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No KPI data for selected period"
            description="Start by adding KPI records for your team"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedKpi(null);
                  setShowForm(true);
                }}
              >
                New KPI
              </Button>
            }
          />
        ) : view === 'list' ? (
          <Table columns={columns} data={kpis} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
            >
              {/* KPI Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {kpi.employee_details?.user_details?.full_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {kpi.employee_details?.user_details?.full_name || kpi.employee_details?.user_details?.username}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {kpi.employee_details?.position} • {new Date(kpi.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border-2 ${getScoreColor(kpi.overall_score)}`}>
                  <div className="text-2xl font-bold">{kpi.overall_score}</div>
                  <div className="text-xs">Overall Score</div>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Tasks Completed */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{kpi.tasks_completed}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {kpi.tasks_on_time} on time ({kpi.on_time_percentage}%)
                  </div>
                </div>

                {/* Quality Score */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{kpi.quality_score}</div>
                  <div className="text-xs text-gray-500 mt-1">out of 10</div>
                </div>

                {/* Collaboration Score */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-600">Collaboration</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{kpi.collaboration_score}</div>
                  <div className="text-xs text-gray-500 mt-1">out of 10</div>
                </div>

                {/* Innovation Score */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-gray-600">Innovation</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{kpi.innovation_score}</div>
                  <div className="text-xs text-gray-500 mt-1">out of 10</div>
                </div>

                {/* Overall Score */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs text-gray-600">Overall</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">{kpi.overall_score}</div>
                  <div className="text-xs text-gray-500 mt-1">out of 10</div>
                </div>
              </div>

              {/* Notes */}
              {kpi.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {kpi.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => {
                    setKpiForDetail(kpi);
                    setShowDetail(true);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Eye className="h-5 w-5" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(kpi)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setKpiToDelete(kpi);
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

        {/* KPI Detail Modal */}
      {showDetail && kpiForDetail && (
        <KPIDetail
          kpi={kpiForDetail}
          onClose={() => {
            setShowDetail(false);
            setKpiForDetail(null);
          }}
        />
      )}

      {/* KPI Form Modal */}
      {showForm && (
        <KPIForm
          kpi={selectedKpi}
          onClose={() => {
            setShowForm(false);
            setSelectedKpi(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && kpiToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the KPI record for <span className="font-semibold">{kpiToDelete.employee_details?.user_details?.full_name}</span> for {new Date(kpiToDelete.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?
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
                  setKpiToDelete(null);
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
    </div>
  );
}
