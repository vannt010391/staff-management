import { useState, useEffect } from 'react';
import { Award, Star, CheckCircle, XCircle, TrendingUp, Calendar, User, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import EvaluationForm from '../../components/hr/EvaluationForm';

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [acknowledgeComments, setAcknowledgeComments] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/evaluations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setEvaluations(data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast.error('Failed to fetch evaluations');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (evalId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_BASE_URL}/hr/evaluations/${evalId}/acknowledge/`,
        { comments: acknowledgeComments },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Evaluation acknowledged successfully');
      setShowModal(false);
      setSelectedEval(null);
      setAcknowledgeComments('');
      fetchEvaluations();
    } catch (error) {
      console.error('Error acknowledging evaluation:', error);
      toast.error('Failed to acknowledge evaluation');
    }
  };

  const getRatingColor = (rating) => {
    const colors = {
      'outstanding': 'bg-green-100 text-green-800 border-green-300',
      'exceeds': 'bg-blue-100 text-blue-800 border-blue-300',
      'meets': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'needs_improvement': 'bg-orange-100 text-orange-800 border-orange-300',
      'unsatisfactory': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[rating] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRatingIcon = (rating) => {
    if (rating === 'outstanding' || rating === 'exceeds') {
      return <Star className="h-5 w-5" />;
    }
    if (rating === 'needs_improvement' || rating === 'unsatisfactory') {
      return <XCircle className="h-5 w-5" />;
    }
    return <CheckCircle className="h-5 w-5" />;
  };

  const handleEdit = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!evaluationToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/evaluations/${evaluationToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Evaluation deleted successfully');
      fetchEvaluations();
      setShowDeleteConfirm(false);
      setEvaluationToDelete(null);
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error('Failed to delete evaluation');
    }
  };

  const handleFormSuccess = () => {
    fetchEvaluations();
  };

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
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Award className="h-8 w-8 text-white" />
            </div>
            Performance Evaluations
          </h1>
          <p className="text-gray-600 mt-1">Employee performance reviews and assessments</p>
        </div>
        <button
          onClick={() => {
            setSelectedEvaluation(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          New Evaluation
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Outstanding</p>
              <p className="text-3xl font-bold mt-1">
                {evaluations.filter(e => e.overall_rating === 'outstanding').length}
              </p>
            </div>
            <Star className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Exceeds</p>
              <p className="text-3xl font-bold mt-1">
                {evaluations.filter(e => e.overall_rating === 'exceeds').length}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Meets</p>
              <p className="text-3xl font-bold mt-1">
                {evaluations.filter(e => e.overall_rating === 'meets').length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Acknowledged</p>
              <p className="text-3xl font-bold mt-1">
                {evaluations.filter(e => e.employee_acknowledged).length}
              </p>
            </div>
            <Award className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No evaluations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
            >
              {/* Evaluation Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                    {evaluation.employee_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{evaluation.employee_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {evaluation.period_type_display}
                      </span>
                      <span>
                        {new Date(evaluation.period_start).toLocaleDateString()} - {new Date(evaluation.period_end).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 ${getRatingColor(evaluation.overall_rating)}`}>
                    {getRatingIcon(evaluation.overall_rating)}
                    <span className="font-bold">{evaluation.overall_rating_display}</span>
                  </div>
                  {evaluation.employee_acknowledged ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Acknowledged
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Pending Acknowledgment
                    </span>
                  )}
                </div>
              </div>

              {/* Evaluation Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Strengths */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Strengths
                  </h4>
                  <p className="text-sm text-gray-700">{evaluation.strengths}</p>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Areas for Improvement
                  </h4>
                  <p className="text-sm text-gray-700">{evaluation.areas_for_improvement}</p>
                </div>

                {/* Achievements */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Achievements
                  </h4>
                  <p className="text-sm text-gray-700">{evaluation.achievements}</p>
                </div>

                {/* Goals Next Period */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Goals Next Period
                  </h4>
                  <p className="text-sm text-gray-700">{evaluation.goals_next_period}</p>
                </div>
              </div>

              {/* Recommendations */}
              {(evaluation.promotion_recommended || evaluation.salary_increase_recommended) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Recommendations</h4>
                  <div className="flex gap-3">
                    {evaluation.promotion_recommended && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        ⭐ Promotion Recommended
                      </span>
                    )}
                    {evaluation.salary_increase_recommended && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                        💰 Salary Increase: {evaluation.recommended_increase_percentage}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Evaluator Info */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Evaluated by: {evaluation.evaluator_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!evaluation.employee_acknowledged && (
                    <button
                      onClick={() => {
                        setSelectedEval(evaluation);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Acknowledge
                    </button>
                  )}
                  {evaluation.employee_acknowledged && evaluation.employee_comments && (
                    <button
                      onClick={() => {
                        setSelectedEval(evaluation);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Comments
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleEdit(evaluation)}
                  className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setEvaluationToDelete(evaluation);
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

      {/* Acknowledge Modal */}
      {showModal && selectedEval && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedEval.employee_acknowledged ? 'Employee Comments' : 'Acknowledge Evaluation'}
            </h3>

            {selectedEval.employee_acknowledged ? (
              <div className="mb-4">
                <p className="text-gray-700">{selectedEval.employee_comments || 'No comments provided'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Acknowledged on {new Date(selectedEval.employee_acknowledged_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Please add your comments on this evaluation (optional):
                </p>
                <textarea
                  value={acknowledgeComments}
                  onChange={(e) => setAcknowledgeComments(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="4"
                  placeholder="Your comments..."
                />
              </>
            )}

            <div className="flex gap-3 mt-6">
              {!selectedEval.employee_acknowledged && (
                <button
                  onClick={() => handleAcknowledge(selectedEval.id)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Acknowledge
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedEval(null);
                  setAcknowledgeComments('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Form Modal */}
      {showForm && (
        <EvaluationForm
          evaluation={selectedEvaluation}
          onClose={() => {
            setShowForm(false);
            setSelectedEvaluation(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && evaluationToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the evaluation for <span className="font-semibold">{evaluationToDelete.employee_name}</span>?
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
                  setEvaluationToDelete(null);
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
