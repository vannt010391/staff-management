import { X, User, Calendar, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function SalaryReviewDetail({ review, onClose }) {
  if (!review) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: {
        label: 'Pending Review',
        color: 'from-yellow-500 to-orange-600',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="h-12 w-12" />
      },
      approved: {
        label: 'Approved',
        color: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <CheckCircle className="h-12 w-12" />
      },
      rejected: {
        label: 'Rejected',
        color: 'from-red-500 to-red-600',
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="h-12 w-12" />
      },
      implemented: {
        label: 'Implemented',
        color: 'from-green-500 to-emerald-600',
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="h-12 w-12" />
      }
    };
    return statuses[status] || statuses.pending;
  };

  const statusInfo = getStatusInfo(review.status);
  const salaryIncrease = parseFloat(review.proposed_salary) - parseFloat(review.current_salary);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${statusInfo.color} p-6 rounded-t-2xl sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Salary Review Details</h2>
              <p className="text-white/90 mt-2">Review Date: {formatDate(review.review_date)}</p>
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
          {/* Status Card */}
          <div className={`bg-gradient-to-br ${statusInfo.color} rounded-2xl p-8 text-white text-center shadow-xl`}>
            <div className="flex flex-col items-center gap-3">
              {statusInfo.icon}
              <p className="text-4xl font-bold">{statusInfo.label}</p>
            </div>
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
                    {review.employee_details?.user_details?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {review.employee_details?.employee_id} • {review.employee_details?.position}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-medium text-gray-900">
                    {review.requested_by_details?.username || 'N/A'}
                  </p>
                </div>
              </div>
              {review.approved_by_details && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Approved/Rejected By</p>
                    <p className="font-medium text-gray-900">{review.approved_by_details.username}</p>
                    {review.approved_at && (
                      <p className="text-sm text-gray-500">{formatDate(review.approved_at)}</p>
                    )}
                  </div>
                </div>
              )}
              {review.implemented_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Implemented Date</p>
                    <p className="font-medium text-gray-900">{formatDate(review.implemented_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Salary Comparison */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Salary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <p className="text-sm text-gray-600">Current Salary</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(review.current_salary).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Annual</p>
              </div>

              {/* Proposed Salary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-600">Proposed Salary</p>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  ${parseFloat(review.proposed_salary).toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  +${salaryIncrease.toLocaleString()}
                </p>
              </div>

              {/* Increase Percentage */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-600">Increase</p>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  {review.increase_percentage}%
                </p>
                <p className="text-xs text-blue-600 mt-1">Percentage</p>
              </div>
            </div>
          </div>

          {/* Visual Comparison */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Salary Comparison</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Current</span>
                  <span className="font-medium">${parseFloat(review.current_salary).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gray-400 h-3 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">Proposed</span>
                  <span className="font-medium text-green-600">${parseFloat(review.proposed_salary).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${((parseFloat(review.proposed_salary) / parseFloat(review.current_salary)) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Justification</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{review.justification}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {review.notes && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Notes</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{review.notes}</p>
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
