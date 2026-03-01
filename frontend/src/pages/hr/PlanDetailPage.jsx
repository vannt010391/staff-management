import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';

export default function PlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await plansService.getPlan(id);
        setPlan(data);
      } catch (error) {
        console.error('Error fetching plan detail:', error);
        toast.error('Failed to load plan detail');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!plan) return <div className="p-6 text-gray-600">Plan not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/hr/plans')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
          <p className="text-gray-600 mt-1">{plan.plan_type_display || plan.plan_type} • {plan.status_display || plan.status}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Calendar} label="Period" value={`${new Date(plan.period_start).toLocaleDateString()} - ${new Date(plan.period_end).toLocaleDateString()}`} />
          <Info icon={Target} label="Progress" value={`${plan.completion_percentage || 0}%`} />
          <Info icon={CheckCircle2} label="Completed Goals" value={`${plan.completed_goals || 0} / ${plan.total_goals || 0}`} />
          <Info icon={Clock} label="Active Period" value={plan.is_active_period ? 'Yes' : 'No'} />
        </div>

        <Section title="Description" content={plan.description} />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Goals</h3>
          <div className="space-y-2">
            {plan.goals?.length ? plan.goals.map((goal) => (
              <div key={goal.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="font-medium text-gray-900">{goal.title}</div>
                <div className="text-sm text-gray-600">{goal.description || '-'}</div>
              </div>
            )) : <p className="text-gray-500">No goals yet.</p>}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <div className="space-y-2">
            {plan.notes?.length ? plan.notes.map((note) => (
              <div key={note.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700 whitespace-pre-line">{note.note}</div>
                <div className="text-xs text-gray-500 mt-1">{note.created_by_name} • {new Date(note.created_at).toLocaleString()}</div>
              </div>
            )) : <p className="text-gray-500">No notes yet.</p>}
          </div>
        </div>
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
