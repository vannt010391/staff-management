import { useState, useEffect } from 'react';
import { Clock, Users, TrendingUp, Download, Calendar, Filter, Search } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function AttendanceManagementPage() {
  const { user: currentUser } = useAuthStore();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    user_id: '',
    status: ''
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
    loadAttendances();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.results || response.data || [];
      console.log('Loaded users:', userData);
      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();

      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.status) params.append('status', filters.status);

      const url = `${API_BASE_URL}/hr/attendances/team_attendance/?${params.toString()}`;
      console.log('Loading attendances from:', url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Attendance response:', response.data);

      // Handle paginated response
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      console.log('Processed attendance data:', data);

      setAttendances(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to load attendances:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Show error message to user
      if (error.response?.status === 403) {
        alert('You do not have permission to view team attendance');
      } else if (error.response?.status === 401) {
        alert('Please login again');
      } else {
        alert(`Failed to load attendance: ${error.response?.data?.detail || error.message}`);
      }

      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const present = data.filter(a => a.status === 'present' || a.status === 'late').length;
    const late = data.filter(a => a.is_late).length;
    const wfh = data.filter(a => a.status === 'wfh').length;

    // Ensure total_hours is converted to number before summing
    const totalHours = data.reduce((sum, a) => {
      const hours = parseFloat(a.total_hours) || 0;
      return sum + hours;
    }, 0);

    setStats({
      total_records: total,
      present_count: present,
      late_count: late,
      wfh_count: wfh,
      total_hours: totalHours.toFixed(2)
    });
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();

      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.user_id) params.append('user_id', filters.user_id);

      const response = await axios.get(
        `${API_BASE_URL}/hr/attendances/export_attendance/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export attendance data');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status, isLate) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', label: 'Present' },
      late: { color: 'bg-yellow-100 text-yellow-800', label: 'Late' },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      wfh: { color: 'bg-blue-100 text-blue-800', label: 'WFH' },
      half_day: { color: 'bg-purple-100 text-purple-800', label: 'Half Day' }
    };

    const config = statusConfig[status] || statusConfig.present;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {isLate ? 'Late' : config.label}
      </span>
    );
  };

  // Group attendances by date
  const groupedAttendances = attendances.reduce((groups, attendance) => {
    const date = attendance.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(attendance);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedAttendances).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
          <p className="text-gray-600">View and manage team attendance records</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_records}</p>
              </div>
              <Users className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present_count}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late_count}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">WFH</p>
                <p className="text-2xl font-bold text-blue-600">{stats.wfh_count}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_hours}h</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="wfh">Work From Home</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                sortedDates.map((date) => (
                  <>
                    {/* Date Header Row */}
                    <tr key={`date-${date}`} className="bg-gray-100">
                      <td colSpan="8" className="px-4 py-2 text-sm font-semibold text-gray-700">
                        {formatDate(date)} ({groupedAttendances[date].length} records)
                      </td>
                    </tr>
                    {/* Attendance Records for this Date */}
                    {groupedAttendances[date].map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">↳</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {attendance.user_details?.full_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatTime(attendance.check_in_time)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={attendance.check_in_address || attendance.check_in_location}>
                          {attendance.check_in_address || attendance.check_in_location || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatTime(attendance.check_out_time)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={attendance.check_out_address || attendance.check_out_location}>
                          {attendance.check_out_address || attendance.check_out_location || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{attendance.total_hours ? `${attendance.total_hours}h` : '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(attendance.status, attendance.is_late)}</td>
                      </tr>
                    ))}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
