import { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, Globe, MapPin, TrendingUp, DollarSign, FolderKanban, Receipt, Calendar, User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getCustomer, getCustomerTimeline, getCustomerProjects, approveExpense, rejectExpense } from '../../services/crm';
import InteractionForm from './InteractionForm';
import ExpenseForm from './ExpenseForm';

export default function CustomerDetail({ customerId, onClose, onUpdate }) {
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerData, timelineData, projectsData] = await Promise.all([
        getCustomer(customerId),
        getCustomerTimeline(customerId),
        getCustomerProjects(customerId)
      ]);
      setCustomer(customerData);
      setTimeline(timelineData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      await approveExpense(expenseId);
      toast.success('Expense approved');
      await fetchCustomerData();
    } catch (error) {
      console.error('Error approving expense:', error);
      toast.error('Failed to approve expense');
    }
  };

  const handleRejectExpense = async (expenseId) => {
    try {
      const reason = prompt('Rejection reason:');
      if (reason) {
        await rejectExpense(expenseId, reason);
        toast.success('Expense rejected');
        await fetchCustomerData();
      }
    } catch (error) {
      console.error('Error rejecting expense:', error);
      toast.error('Failed to reject expense');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
  ];

  const expenses = timeline.filter(item => item.type === 'expense').map(item => item.data);
  const _interactions = timeline.filter(item => item.type === 'interaction').map(item => item.data);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-8 w-8" />
                <h2 className="text-3xl font-bold">{customer.company_name}</h2>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{customer.contact_person}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white/70 text-sm mb-1">Stage</div>
              <div className="flex items-center gap-2">
                {customer.current_stage_detail && (
                  <>
                    <span className="text-2xl">{customer.current_stage_detail.icon}</span>
                    <span className="font-semibold">{customer.current_stage_detail.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white/70 text-sm mb-1">Projects</div>
              <div className="text-2xl font-bold">{customer.total_projects || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white/70 text-sm mb-1">Revenue</div>
              <div className="text-2xl font-bold">{((customer.total_revenue || 0) / 1000000).toFixed(1)}M</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white/70 text-sm mb-1">Expenses</div>
              <div className="text-2xl font-bold">{((customer.total_expenses || 0) / 1000000).toFixed(1)}M</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-2 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Industry</label>
                      <p className="font-medium">{customer.industry_display}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Company Size</label>
                      <p className="font-medium">{customer.company_size_display}</p>
                    </div>
                    {customer.website && (
                      <div>
                        <label className="text-sm text-gray-600">Website</label>
                        <a href={customer.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                          <Globe className="h-4 w-4" />
                          {customer.website}
                        </a>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <label className="text-sm text-gray-600">Address</label>
                        <p className="font-medium flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1" />
                          {customer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CRM Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Assigned To</label>
                      <p className="font-medium">
                        {customer.assigned_to_detail?.first_name || customer.assigned_to_detail?.username || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Source</label>
                      <p className="font-medium">{customer.source_display}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Priority</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        customer.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        customer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        customer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.priority_display}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Estimated Value</label>
                      <p className="font-medium text-green-600">
                        {(customer.estimated_value / 1000000).toFixed(1)}M VND
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Days in Current Stage</label>
                      <p className="font-medium">{customer.days_in_current_stage} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInteractionForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Interaction
                  </button>
                  <button
                    onClick={() => setShowExpenseForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Add Expense
                  </button>
                </div>
              </div>

              {timeline.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No timeline events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4 pb-4">
                      {item.type === 'interaction' ? (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-gray-900">{item.data.title}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {item.data.interaction_type_display}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(item.data.interaction_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{item.data.description}</p>
                          {item.data.is_stage_change && (
                            <div className="text-sm text-blue-600">
                              Stage changed: {item.data.stage_before_detail?.name} → {item.data.stage_after_detail?.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-5 w-5 text-green-600" />
                              <span className="font-semibold text-gray-900">{item.data.title}</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {item.data.expense_type_detail?.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {new Date(item.data.expense_date).toLocaleDateString()}
                              </div>
                              <div className="font-semibold text-green-600">
                                {(item.data.amount / 1000000).toFixed(2)}M VND
                              </div>
                            </div>
                          </div>
                          {item.data.description && (
                            <p className="text-gray-700 text-sm">{item.data.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderKanban className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No projects yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-3 text-sm text-gray-600">
                        {project.start_date && (
                          <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                        )}
                        {project.end_date && (
                          <span>End: {new Date(project.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Add Expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No expenses yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map(expense => (
                    <div key={expense.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{expense.expense_type_detail?.icon}</span>
                            <h4 className="font-semibold text-gray-900">{expense.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600">{expense.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-lg">
                            {(expense.amount / 1000000).toFixed(2)}M VND
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {expense.status_display}
                        </span>

                        {expense.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveExpense(expense.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectExpense(expense.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Forms */}
      {showInteractionForm && (
        <InteractionForm
          customerId={customerId}
          onClose={() => setShowInteractionForm(false)}
          onSuccess={async () => {
            await fetchCustomerData();
            await onUpdate();
          }}
        />
      )}

      {showExpenseForm && (
        <ExpenseForm
          customerId={customerId}
          onClose={() => setShowExpenseForm(false)}
          onSuccess={async () => {
            await fetchCustomerData();
            await onUpdate();
          }}
        />
      )}
    </div>
  );
}
