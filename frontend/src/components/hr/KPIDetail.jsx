import { X, User, Calendar, BarChart3, Target, TrendingUp, MessageSquare } from 'lucide-react';

export default function KPIDetail({ kpi, onClose }) {
  if (!kpi) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-blue-600 bg-blue-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const scores = [
    { label: 'Quality', value: parseFloat(kpi.quality_score), icon: Target, color: 'from-blue-500 to-blue-600' },
    { label: 'Productivity', value: parseFloat(kpi.productivity_score), icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { label: 'Teamwork', value: parseFloat(kpi.teamwork_score), icon: User, color: 'from-purple-500 to-purple-600' },
    { label: 'Innovation', value: parseFloat(kpi.innovation_score), icon: BarChart3, color: 'from-orange-500 to-orange-600' }
  ];

  const completionRate = kpi.tasks_completed > 0
    ? ((kpi.tasks_on_time / kpi.tasks_completed) * 100).toFixed(1)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">KPI Performance Report</h2>
              <p className="text-blue-100 mt-2">
                Period: {formatDate(kpi.period_start)} - {formatDate(kpi.period_end)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-xl">
            <p className="text-indigo-100 text-lg mb-2">Overall Performance Score</p>
            <p className="text-7xl font-bold">{parseFloat(kpi.overall_score).toFixed(1)}</p>
            <p className="text-indigo-100 mt-2">out of 100</p>
          </div>

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">
                    {kpi.employee_details?.user_details?.full_name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p className="font-medium text-gray-900">
                    {kpi.created_by_details?.username || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Scores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scores.map((score) => (
                <div key={score.label} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${score.color} rounded-xl text-white`}>
                        <score.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{score.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{score.value.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${score.color} transition-all duration-500`}
                      style={{ width: `${score.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Tasks Completed</p>
                <p className="text-4xl font-bold text-blue-700">{kpi.tasks_completed}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <p className="text-sm text-green-600 mb-1">Tasks On Time</p>
                <p className="text-4xl font-bold text-green-700">{kpi.tasks_on_time}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <p className="text-sm text-purple-600 mb-1">Completion Rate</p>
                <p className="text-4xl font-bold text-purple-700">{completionRate}%</p>
              </div>
            </div>
          </div>

          {/* Comments */}
          {kpi.comments && (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments & Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line">{kpi.comments}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl sticky bottom-0">
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
