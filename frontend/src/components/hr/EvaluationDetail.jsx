import { X, User, Calendar, Award, TrendingUp, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

export default function EvaluationDetail({ evaluation, onClose }) {
  if (!evaluation) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingInfo = (rating) => {
    const ratings = {
      outstanding: { label: 'Outstanding', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-800', icon: '🌟' },
      exceeds: { label: 'Exceeds Expectations', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-800', icon: '⭐' },
      meets: { label: 'Meets Expectations', color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      needs_improvement: { label: 'Needs Improvement', color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️' },
      unsatisfactory: { label: 'Unsatisfactory', color: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
    };
    return ratings[rating] || ratings.meets;
  };

  const ratingInfo = getRatingInfo(evaluation.overall_rating);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${ratingInfo.color} p-6 rounded-t-2xl sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Performance Evaluation</h2>
              <p className="text-white/90 mt-2">
                {formatDate(evaluation.period_start)} - {formatDate(evaluation.period_end)}
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
          {/* Overall Rating Card */}
          <div className={`bg-gradient-to-br ${ratingInfo.color} rounded-2xl p-8 text-white text-center shadow-xl`}>
            <p className="text-white/90 text-lg mb-2">Overall Rating</p>
            <p className="text-6xl mb-3">{ratingInfo.icon}</p>
            <p className="text-4xl font-bold">{ratingInfo.label}</p>
          </div>

          {/* Employee Info */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">
                    {evaluation.employee_details?.user_details?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">{evaluation.employee_details?.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Evaluator</p>
                  <p className="font-medium text-gray-900">
                    {evaluation.evaluator_details?.username || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Period Type</p>
                  <p className="font-medium text-gray-900 capitalize">{evaluation.period_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${ratingInfo.bg} ${ratingInfo.text}`}>
                    {ratingInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Strengths</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{evaluation.strengths}</p>
              </div>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{evaluation.areas_for_improvement}</p>
              </div>
            </div>
          </div>

          {/* Key Achievements */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <Award className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Achievements</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{evaluation.achievements}</p>
              </div>
            </div>
          </div>

          {/* Goals for Next Period */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals for Next Period</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{evaluation.goals_next_period}</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {(evaluation.promotion_recommended || evaluation.salary_increase_recommended) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {evaluation.promotion_recommended && (
                  <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-indigo-200">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">Promotion Recommended</p>
                      <p className="text-sm text-gray-600">This employee is recommended for promotion</p>
                    </div>
                  </div>
                )}
                {evaluation.salary_increase_recommended && (
                  <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Salary Increase Recommended</p>
                      <p className="text-sm text-gray-600">
                        Recommended increase: <span className="font-semibold">{evaluation.recommended_increase_percentage}%</span>
                      </p>
                    </div>
                  </div>
                )}
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
