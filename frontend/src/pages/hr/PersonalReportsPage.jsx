import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Plus, Edit, Trash2, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import PersonalReportForm from '../../components/hr/PersonalReportForm';
import { PageHeader, StatCard, Button, EmptyState } from '../../components/ui';

export default function PersonalReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/reports/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setSelectedReport(report);
    setShowForm(true);
  };

  const handleView = (report) => {
    navigate(`/hr/reports/${report.id}`);
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/reports/${reportToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Report deleted successfully');
      fetchReports();
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleFormSuccess = async () => {
    await fetchReports();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <PageHeader
          icon={FileText}
          title="Personal Reports"
          subtitle="Work summaries and achievements"
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedReport(null);
                setShowForm(true);
              }}
            >
              New Report
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={FileText}
            label="Total Reports"
            value={reports.length}
            gradient="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports found"
              description="Start by creating your first report"
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedReport(null);
                    setShowForm(true);
                  }}
                >
                  New Report
                </Button>
              }
            />
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{report.report_type_display} Report</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  {report.is_reviewed ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Reviewed</span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
                  )}
                </div>
                <p className="text-gray-700 mb-4">{report.summary?.substring(0, 200)}...</p>
                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <span>Tasks: {report.tasks_completed}</span>
                  <span>Hours: {report.hours_worked}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleView(report)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleEdit(report)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => {
                      setReportToDelete(report);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Personal Report Form Modal */}
        {showForm && (
          <PersonalReportForm
            report={selectedReport}
            onClose={() => {
              setShowForm(false);
              setSelectedReport(null);
            }}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && reportToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this {reportToDelete.report_type_display} report?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setReportToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
