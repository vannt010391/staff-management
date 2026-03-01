import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, Plus, Search, TrendingUp, Users, DollarSign, Target, Edit, Trash2, Eye } from 'lucide-react';
import { getCustomers, deleteCustomer, getPipelineStats } from '../../services/crm';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import CustomerForm from '../../components/crm/CustomerForm';
import CustomerDetail from '../../components/crm/CustomerDetail';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailCustomerId, setDetailCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getPipelineStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id);
      toast.success('Customer deleted successfully');
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      await fetchCustomers();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <PageHeader
        icon={Building2}
        title="Customer Relationship Management"
        subtitle="Manage customers, interactions, and sales pipeline"
        actions={
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5" />
            Add Customer
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats?.total_customers || 0}
          gradient="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Total Value"
          value={`${((stats?.total_value || 0) / 1000000).toFixed(1)}M`}
          gradient="green"
        />
        <StatCard
          icon={Target}
          label="Active Pipeline"
          value={stats?.pipeline?.length || 0}
          gradient="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value="67%"
          gradient="yellow"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Search className="h-5 w-5" />
          <input
            type="text"
            placeholder="Search customers by company name, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-900"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Customers Found</h3>
            <p className="text-gray-500 mb-4">Start by adding your first customer</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-gray-200 hover:bg-blue-50/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{customer.company_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{customer.contact_person}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4">
                      {customer.current_stage_detail && (
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${customer.current_stage_detail.color}-100 text-${customer.current_stage_detail.color}-800`}>
                          <span>{customer.current_stage_detail.icon}</span>
                          {customer.current_stage_detail.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {(customer.estimated_value / 1000000).toFixed(1)}M VND
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        customer.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        customer.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {customer.priority_display || customer.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setDetailCustomerId(customer.id);
                            setShowDetail(true);
                          }}
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(customer);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          onClose={() => {
            setShowForm(false);
            setSelectedCustomer(null);
          }}
          onSuccess={async () => {
            await fetchCustomers();
            await fetchStats();
          }}
        />
      )}

      {/* Customer Detail Modal */}
      {showDetail && detailCustomerId && (
        <CustomerDetail
          customerId={detailCustomerId}
          onClose={() => {
            setShowDetail(false);
            setDetailCustomerId(null);
          }}
          onUpdate={async () => {
            await fetchCustomers();
            await fetchStats();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Customer</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{customerToDelete.company_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCustomerToDelete(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
