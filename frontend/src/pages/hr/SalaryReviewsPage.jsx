import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import SalaryReviewForm from '../../components/hr/SalaryReviewForm';

export default function SalaryReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'implement', 'view'
  const [comments, setComments] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/salary-reviews/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setReviews(data);
    } catch (error) {
      console.error('Error fetching salary reviews:', error);
      toast.error('Failed to fetch salary reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReview) return;

    try {
      const token = localStorage.getItem('access_token');
      const endpoint = `${API_BASE_URL}/hr/salary-reviews/${selectedReview.id}/${actionType}/`;

      await axios.post(
        endpoint,
        { comments },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Salary review ${actionType}d successfully`);
      setShowModal(false);
      setSelectedReview(null);
      setComments('');
      setActionType('');
      fetchReviews();
    } catch (error) {
      console.error(`Error ${actionType}ing salary review:`, error);
      toast.error(`Failed to ${actionType} salary review`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'approved': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
      'implemented': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <Clock className="h-5 w-5" />,
      'approved': <CheckCircle className="h-5 w-5" />,
      'rejected': <XCircle className="h-5 w-5" />,
      'implemented': <TrendingUp className="h-5 w-5" />
    };
    return icons[status] || <Clock className="h-5 w-5" />;
  };

  const handleEdit = (review) => {
    setSelectedReviewForEdit(review);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/salary-reviews/${reviewToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Salary review deleted successfully');
      fetchReviews();
      setShowDeleteConfirm(false);
      setReviewToDelete(null);
    } catch (error) {
      console.error('Error deleting salary review:', error);
      toast.error('Failed to delete salary review');
    }
  };

  const handleFormSuccess = () => {
    fetchReviews();
  };

  const canApproveReject = currentUser?.role === 'admin';

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
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            Salary Reviews
          </h1>
          <p className="text-gray-600 mt-1">Salary increase requests and approvals</p>
        </div>
        <button
          onClick={() => {
            setSelectedReviewForEdit(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          New Salary Review
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold mt-1">
                {reviews.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved</p>
              <p className="text-3xl font-bold mt-1">
                {reviews.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Rejected</p>
              <p className="text-3xl font-bold mt-1">
                {reviews.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Implemented</p>
              <p className="text-3xl font-bold mt-1">
                {reviews.filter(r => r.status === 'implemented').length}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No salary reviews found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                    {review.employee_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{review.employee_name}</h3>
                    <p className="text-sm text-gray-600">Requested by {review.requested_by_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 ${getStatusColor(review.status)}`}>
                  {getStatusIcon(review.status)}
                  <span className="font-bold">{review.status_display}</span>
                </div>
              </div>

              {/* Salary Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Current Salary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Current Salary</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${parseFloat(review.current_salary).toLocaleString()}
                  </p>
                </div>

                {/* Proposed Salary */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Proposed Salary</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${parseFloat(review.proposed_salary).toLocaleString()}
                  </p>
                </div>

                {/* Increase */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Increase</p>
                  <p className="text-2xl font-bold text-blue-700">
                    +{parseFloat(review.increase_percentage).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ${(parseFloat(review.proposed_salary) - parseFloat(review.current_salary)).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reason and Justification */}
              <div className="space-y-3 mb-4">
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Reason</h4>
                  <p className="text-sm text-gray-700">{review.reason}</p>
                </div>

                {review.justification && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Justification</h4>
                    <p className="text-sm text-gray-700">{review.justification}</p>
                  </div>
                )}
              </div>

              {/* Effective Date */}
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200 mb-4">
                <p className="text-sm">
                  <span className="font-semibold text-indigo-900">Effective Date: </span>
                  <span className="text-gray-700">{new Date(review.effective_date).toLocaleDateString()}</span>
                </p>
              </div>

              {/* Review Comments (if any) */}
              {review.review_comments && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Review Comments</h4>
                  <p className="text-sm text-gray-700">{review.review_comments}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    By {review.reviewed_by_details?.username} on {new Date(review.reviewed_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {review.status === 'pending' && canApproveReject && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setActionType('approve');
                        setShowModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setActionType('reject');
                        setShowModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}

                {review.status === 'approved' && canApproveReject && (
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setActionType('implement');
                      setShowModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Implement
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedReview(review);
                    setActionType('view');
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
              </div>

              {/* Edit & Delete Buttons (only for pending reviews) */}
              {review.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(review)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setReviewToDelete(review);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
              {actionType === 'view' ? 'Review Details' : `${actionType} Salary Review`}
            </h3>

            {actionType === 'view' ? (
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-semibold">{selectedReview.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current → Proposed</p>
                  <p className="font-semibold">
                    ${parseFloat(selectedReview.current_salary).toLocaleString()} → ${parseFloat(selectedReview.proposed_salary).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Increase</p>
                  <p className="font-semibold text-green-600">
                    +{parseFloat(selectedReview.increase_percentage).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-semibold capitalize">{selectedReview.status_display}</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  {actionType === 'implement'
                    ? 'This will update the employee\'s salary to the proposed amount.'
                    : 'Please add comments for this action:'}
                </p>
                {actionType !== 'implement' && (
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="4"
                    placeholder="Your comments..."
                  />
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              {actionType !== 'view' && (
                <button
                  onClick={handleAction}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm {actionType}
                </button>
              )}
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReview(null);
                  setComments('');
                  setActionType('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Review Form Modal */}
      {showForm && (
        <SalaryReviewForm
          review={selectedReviewForEdit}
          onClose={() => {
            setShowForm(false);
            setSelectedReviewForEdit(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && reviewToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the salary review for <span className="font-semibold">{reviewToDelete.employee_name}</span>?
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
                  setReviewToDelete(null);
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
