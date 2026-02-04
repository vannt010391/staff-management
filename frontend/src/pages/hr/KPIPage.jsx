import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Users, Calendar, BarChart, Plus, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import KPIForm from '../../components/hr/KPIForm';
import KPIDetail from '../../components/hr/KPIDetail';

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
      const data = Array.isArray(response.data) ? response.data : [];
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
      const data = Array.isArray(response.data) ? response.data : [];
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

  const handleFormSuccess = () => {
    fetchKPIs();
  };

  const averages = calculateAverages();

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
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            KPI Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Performance metrics and tracking</p>
        </div>
        <button
          onClick={() => {
            setSelectedKpi(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          New KPI
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Month Selector */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth ? selectedMonth.substring(0, 7) : ''}
              onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Employee Filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold mt-1">{averages.totalTasks}</p>
              </div>
              <Target className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">On-Time Rate</p>
                <p className="text-3xl font-bold mt-1">{averages.onTimePercentage}%</p>
              </div>
              <Award className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Quality</p>
                <p className="text-3xl font-bold mt-1">{averages.avgQuality}</p>
              </div>
              <BarChart className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Overall Score</p>
                <p className="text-3xl font-bold mt-1">{averages.avgOverall}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-200" />
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {kpis.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No KPI data for selected period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
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
                  className="flex-1 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(kpi)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setKpiToDelete(kpi);
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
  );
}
