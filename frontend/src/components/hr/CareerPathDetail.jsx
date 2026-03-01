import { X, Award, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

export default function CareerPathDetail({ careerPath, onClose }) {
  if (!careerPath) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Career Path Details</h2>
              <p className="text-white/90 mt-2">{careerPath.title || careerPath.level_display}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Level</p>
                  <p className="font-medium text-gray-900">
                    {careerPath.level_display || careerPath.level || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Min Experience</p>
                  <p className="font-medium text-gray-900">
                    {careerPath.min_years_experience ?? '-'} years
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="font-medium text-gray-900">{careerPath.employee_count || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-700">Minimum Salary</p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(Number(careerPath.min_salary || 0))}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-700">Maximum Salary</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(Number(careerPath.max_salary || 0))}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {careerPath.requirements || 'No requirements specified.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
            <div className="flex items-start gap-3">
              <FileText className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {careerPath.benefits || 'No benefits specified.'}
                </p>
              </div>
            </div>
          </div>
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
