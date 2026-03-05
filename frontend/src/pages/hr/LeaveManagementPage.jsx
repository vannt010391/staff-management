import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Users, Calendar } from 'lucide-react';
import leaveService from '../../services/leaveService';

export default function LeaveManagementPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all] = await Promise.all([
        leaveService.getPendingApprovals(),
        leaveService.getAllRequests()
      ]);
      // Handle paginated responses (API returns {results: [...]} or direct array)
      setPendingRequests(Array.isArray(pending) ? pending : pending.results || []);
      setAllRequests(Array.isArray(all) ? all : all.results || []);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this leave request?')) return;

    try {
      await leaveService.processRequest(requestId, 'approve');
      alert('Leave request approved successfully!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve leave request');
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await leaveService.processRequest(selectedRequest.id, 'reject', rejectionReason);
      alert('Leave request rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject leave request');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const c = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const displayRequests = activeTab === 'pending' ? pendingRequests : allRequests;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
          <p className="text-gray-600">Review and manage team leave requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-800">{allRequests.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {allRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex space-x-4 px-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Pending Approvals ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              All Requests ({allRequests.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : displayRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    No {activeTab === 'pending' ? 'pending' : ''} leave requests
                  </td>
                </tr>
              ) : (
                displayRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {req.user_details.full_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {req.leave_type_details.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(req.start_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(req.end_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{req.days_count}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{req.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {req.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectClick(req)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Reject Leave Request</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Employee: <span className="font-medium">{selectedRequest.user_details.full_name}</span>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Leave Type: <span className="font-medium">{selectedRequest.leave_type_details.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Duration: <span className="font-medium">{formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="4"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
