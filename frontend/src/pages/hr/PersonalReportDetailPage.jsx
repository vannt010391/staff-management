import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export default function PersonalReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hr/reports/${id}/`);
        setReport(response.data);
      } catch (error) {
        console.error('Error fetching report detail:', error);
        toast.error('Failed to load report detail');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!report) return <div className="p-6 text-gray-600">Report not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/hr/reports')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">{report.report_type_display || report.report_type} Report</h1>
          <p className="text-gray-600 mt-1">{new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Calendar} label="Period" value={`${new Date(report.period_start).toLocaleDateString()} - ${new Date(report.period_end).toLocaleDateString()}`} />
          <div className="flex items-center gap-3">
            {report.is_reviewed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-yellow-500" />}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium text-gray-900">{report.is_reviewed ? 'Reviewed' : 'Pending'}</p>
            </div>
          </div>
          <Info icon={CheckCircle2} label="Tasks Completed" value={report.tasks_completed || 0} />
          <Info icon={Clock} label="Hours Worked" value={report.hours_worked || 0} />
        </div>

        <Section title="Summary" content={report.summary} />
        <Section title="Achievements" content={report.achievements} />
        <Section title="Challenges" content={report.challenges} />
        <Section title="Plan Next Period" content={report.plan_next_period || report.plans_next_period} />
        {report.manager_feedback && <Section title="Manager Feedback" content={report.manager_feedback} />}
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-gray-900 whitespace-pre-line">{content || 'No content provided.'}</p>
        </div>
      </div>
    </div>
  );
}
