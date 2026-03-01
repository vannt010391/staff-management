import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';

export default function CareerPathDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/hr/career-paths/${id}/`);
        setPath(response.data);
      } catch (error) {
        console.error('Error fetching career path detail:', error);
        toast.error('Failed to load career path detail');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!path) return <div className="p-6 text-gray-600">Career path not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/hr/career-paths')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Career Paths
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900">{path.title || path.level_display}</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Award} label="Level" value={path.level_display || path.level || '-'} />
          <Info icon={TrendingUp} label="Min Experience" value={`${path.min_years_experience ?? '-'} years`} />
          <Info icon={DollarSign} label="Min Salary" value={formatCurrency(Number(path.min_salary || 0))} />
          <Info icon={DollarSign} label="Max Salary" value={formatCurrency(Number(path.max_salary || 0))} />
        </div>

        <Section title="Requirements" content={path.requirements} />
        <Section title="Benefits" content={path.benefits} />
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
