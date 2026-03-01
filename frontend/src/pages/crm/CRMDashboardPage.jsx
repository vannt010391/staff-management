import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TrendingUp, Users, DollarSign, Target, TrendingDown, Calendar, Building2 } from 'lucide-react';
import { getPipelineStats, getCustomers, getInteractions } from '../../services/crm';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

export default function CRMDashboardPage() {
  const [pipelineData, setPipelineData] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [pipeline, customers, interactions] = await Promise.all([
        getPipelineStats(),
        getCustomers({ ordering: '-created_at' }),
        getInteractions({ ordering: '-interaction_date' })
      ]);

      setPipelineData(pipeline);

      const customersList = Array.isArray(customers) ? customers : customers.results || [];
      setRecentCustomers(customersList.slice(0, 5));

      const interactionsList = Array.isArray(interactions) ? interactions : interactions.results || [];
      setRecentInteractions(interactionsList.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  const totalWeightedValue = pipelineData?.pipeline?.reduce((sum, stage) => sum + (stage.weighted_value || 0), 0) || 0;
  const avgProbability = pipelineData?.pipeline?.length > 0
    ? pipelineData.pipeline.reduce((sum, stage) => sum + (stage.stage.success_probability || 0), 0) / pipelineData.pipeline.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PageHeader
        icon={TrendingUp}
        title="CRM Dashboard"
        subtitle="Customer relationship management overview"
      />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={pipelineData?.total_customers || 0}
          gradient="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Total Pipeline Value"
          value={`${((pipelineData?.total_value || 0) / 1000000).toFixed(1)}M`}
          gradient="green"
        />
        <StatCard
          icon={Target}
          label="Weighted Value"
          value={`${(totalWeightedValue / 1000000).toFixed(1)}M`}
          gradient="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Probability"
          value={`${avgProbability.toFixed(0)}%`}
          gradient="yellow"
        />
      </div>

      {/* Sales Pipeline */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Sales Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineData?.pipeline?.map((stageData) => (
            <div
              key={stageData.stage.id}
              className={`border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-${stageData.stage.color}-50 to-white`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{stageData.stage.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{stageData.stage.name}</h3>
                    <p className="text-xs text-gray-600">{stageData.stage.success_probability}% probability</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customers:</span>
                  <span className="font-bold text-gray-900">{stageData.customer_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Value:</span>
                  <span className="font-bold text-green-600">
                    {(stageData.total_value / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Weighted:</span>
                  <span className="font-semibold text-blue-600">
                    {(stageData.weighted_value / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${stageData.stage.color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${stageData.stage.success_probability}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Customers */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Customers</h3>
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>

          {recentCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No customers yet</div>
          ) : (
            <div className="space-y-3">
              {recentCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{customer.company_name}</h4>
                      <p className="text-sm text-gray-600">{customer.contact_person}</p>
                    </div>
                    {customer.current_stage_detail && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${customer.current_stage_detail.color}-100 text-${customer.current_stage_detail.color}-800`}>
                        {customer.current_stage_detail.icon} {customer.current_stage_detail.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span className="font-medium text-green-600">
                      {(customer.estimated_value / 1000000).toFixed(1)}M VND
                    </span>
                    <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Interactions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Interactions</h3>
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>

          {recentInteractions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No interactions yet</div>
          ) : (
            <div className="space-y-3">
              {recentInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{interaction.title}</h4>
                      <p className="text-sm text-gray-600">
                        {interaction.customer_detail?.company_name || 'Unknown Customer'}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {interaction.interaction_type_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{new Date(interaction.interaction_date).toLocaleDateString()}</span>
                    {interaction.duration && <span>{interaction.duration} min</span>}
                    <span className={`px-2 py-1 rounded text-xs ${
                      interaction.outcome === 'positive' ? 'bg-green-100 text-green-800' :
                      interaction.outcome === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {interaction.outcome_display}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
