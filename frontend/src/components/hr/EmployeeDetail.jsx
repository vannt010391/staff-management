import { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, DollarSign, Award, TrendingUp, FileText, BarChart3, Users } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';

export default function EmployeeDetail({ employeeId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [salaryReviews, setSalaryReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employeeId]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch employee details
      const empResponse = await axios.get(`${API_BASE_URL}/hr/employees/${employeeId}/`, { headers });
      setEmployee(empResponse.data);

      // Fetch related data
      const [kpiRes, evalRes, salaryRes, reportRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/hr/kpis/?employee=${employeeId}`, { headers }),
        axios.get(`${API_BASE_URL}/hr/evaluations/?employee=${employeeId}`, { headers }),
        axios.get(`${API_BASE_URL}/hr/salary-reviews/?employee=${employeeId}`, { headers }),
        axios.get(`${API_BASE_URL}/hr/reports/?employee=${employeeId}`, { headers })
      ]);

      setKpis(Array.isArray(kpiRes.data) ? kpiRes.data : []);
      setEvaluations(Array.isArray(evalRes.data) ? evalRes.data : []);
      setSalaryReviews(Array.isArray(salaryRes.data) ? salaryRes.data : []);
      setReports(Array.isArray(reportRes.data) ? reportRes.data : []);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRatingColor = (rating) => {
    const colors = {
      outstanding: 'bg-purple-100 text-purple-800',
      exceeds: 'bg-blue-100 text-blue-800',
      meets: 'bg-green-100 text-green-800',
      needs_improvement: 'bg-yellow-100 text-yellow-800',
      unsatisfactory: 'bg-red-100 text-red-800'
    };
    return colors[rating] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {employee.user_details?.first_name?.[0]}{employee.user_details?.last_name?.[0]}
              </div>
              <div className="text-white">
                <h2 className="text-3xl font-bold">{employee.user_details?.full_name}</h2>
                <p className="text-blue-100 text-lg">{employee.position}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-blue-100">{employee.employee_id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Users },
              { id: 'kpis', label: 'KPIs', icon: BarChart3 },
              { id: 'evaluations', label: 'Evaluations', icon: Award },
              { id: 'salary', label: 'Salary Reviews', icon: DollarSign },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">{employee.user_details?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">{employee.user_details?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Hire Date</p>
                        <p className="font-medium">{formatDate(employee.hire_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{employee.department_details?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career & Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Path</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="text-2xl font-bold text-purple-600">
                        Level {employee.career_path_details?.level}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium">{employee.career_path_details?.title}</p>
                    <p className="text-sm text-gray-600">
                      Salary Range: ${parseFloat(employee.career_path_details?.min_salary).toLocaleString()} -
                      ${parseFloat(employee.career_path_details?.max_salary).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Salary</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                      <span className="text-3xl font-bold text-yellow-600">
                        ${parseFloat(employee.current_salary).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Annual compensation</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{kpis.length}</p>
                  <p className="text-sm text-gray-600 mt-1">KPI Records</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{evaluations.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Evaluations</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{salaryReviews.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Salary Reviews</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{reports.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Reports</p>
                </div>
              </div>
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Performance KPIs</h3>
              {kpis.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No KPI records found</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {kpis.slice(0, 6).map((kpi) => (
                    <div key={kpi.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDate(kpi.period_start)} - {formatDate(kpi.period_end)}
                          </p>
                          <p className="text-sm text-gray-600">Created by: {kpi.created_by_details?.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">{parseFloat(kpi.overall_score).toFixed(1)}</p>
                          <p className="text-sm text-gray-600">Overall Score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Quality</p>
                          <p className="text-lg font-semibold text-gray-900">{parseFloat(kpi.quality_score).toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Productivity</p>
                          <p className="text-lg font-semibold text-gray-900">{parseFloat(kpi.productivity_score).toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teamwork</p>
                          <p className="text-lg font-semibold text-gray-900">{parseFloat(kpi.teamwork_score).toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Innovation</p>
                          <p className="text-lg font-semibold text-gray-900">{parseFloat(kpi.innovation_score).toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-700">Tasks: {kpi.tasks_completed} completed, {kpi.tasks_on_time} on time</p>
                        {kpi.comments && <p className="text-sm text-gray-600 mt-1">{kpi.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Performance Evaluations</h3>
              {evaluations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No evaluations found</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {evaluations.map((eval) => (
                    <div key={eval.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDate(eval.period_start)} - {formatDate(eval.period_end)}
                          </p>
                          <p className="text-sm text-gray-600">{eval.period_type} Evaluation</p>
                          <p className="text-sm text-gray-600">Evaluator: {eval.evaluator_details?.username}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getRatingColor(eval.overall_rating)}`}>
                          {eval.overall_rating}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Strengths:</p>
                          <p className="text-sm text-gray-600">{eval.strengths}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Areas for Improvement:</p>
                          <p className="text-sm text-gray-600">{eval.areas_for_improvement}</p>
                        </div>
                        {(eval.promotion_recommended || eval.salary_increase_recommended) && (
                          <div className="flex gap-2 pt-3 border-t border-gray-200">
                            {eval.promotion_recommended && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                Promotion Recommended
                              </span>
                            )}
                            {eval.salary_increase_recommended && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Salary Increase: {eval.recommended_increase_percentage}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Salary Reviews Tab */}
          {activeTab === 'salary' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Salary Review History</h3>
              {salaryReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No salary reviews found</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {salaryReviews.map((review) => (
                    <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">Review Date: {formatDate(review.review_date)}</p>
                          <p className="text-sm text-gray-600">Requested by: {review.requested_by_details?.username}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          review.status === 'implemented' ? 'bg-green-100 text-green-800' :
                          review.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Salary</p>
                          <p className="text-lg font-semibold text-gray-900">${parseFloat(review.current_salary).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Proposed Salary</p>
                          <p className="text-lg font-semibold text-green-600">${parseFloat(review.proposed_salary).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Increase</p>
                          <p className="text-lg font-semibold text-blue-600">{review.increase_percentage}%</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Justification:</p>
                          <p className="text-sm text-gray-600">{review.justification}</p>
                        </div>
                        {review.notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Notes:</p>
                            <p className="text-sm text-gray-600">{review.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Personal Reports</h3>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No reports found</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reports.slice(0, 10).map((report) => (
                    <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatDate(report.period_start)} - {formatDate(report.period_end)}
                          </p>
                          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                            {report.report_type}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Tasks: {report.tasks_completed}</p>
                          <p className="text-sm text-gray-600">Hours: {parseFloat(report.hours_worked).toFixed(1)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Summary:</p>
                          <p className="text-sm text-gray-600">{report.summary}</p>
                        </div>
                        {report.achievements && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Achievements:</p>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{report.achievements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
