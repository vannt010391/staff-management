import { X, FileText, Calendar, CheckCircle2, Clock, MessageSquare } from 'lucide-react';

export default function PersonalReportDetail({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Personal Report Details</h2>
              <p className="text-white/90 mt-2">{report.report_type_display || report.report_type} report</p>
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
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-medium text-gray-900">
                    {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {report.is_reviewed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm text-gray-600">Review Status</p>
                  <p className="font-medium text-gray-900">{report.is_reviewed ? 'Reviewed' : 'Pending'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="font-medium text-gray-900">{report.tasks_completed || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Hours Worked</p>
                  <p className="font-medium text-gray-900">{report.hours_worked || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <Section title="Summary" content={report.summary} color="blue" />
          <Section title="Achievements" content={report.achievements} color="green" />
          <Section title="Challenges" content={report.challenges} color="yellow" />
          <Section title="Plan Next Period" content={report.plan_next_period || report.plans_next_period} color="purple" />

          {report.manager_feedback && (
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Manager Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{report.manager_feedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>

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

function Section({ title, content, color }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorMap[color]}`}>
      <div className="flex items-start gap-3">
        <FileText className="h-6 w-6 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{content || 'No content provided.'}</p>
        </div>
      </div>
    </div>
  );
}
