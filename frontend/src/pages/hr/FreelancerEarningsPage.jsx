import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import usersService from '../../services/users';
import tasksService from '../../services/tasks';
import { formatCurrency } from '../../utils/helpers';

export default function FreelancerEarningsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);

  const canManageMoney = ['admin', 'manager'].includes(user?.role);

  useEffect(() => {
    if (canManageMoney) {
      fetchData();
    }
  }, [canManageMoney]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const freelancers = await usersService.getUsersByRole('freelancer');

      const summaries = await Promise.all(
        freelancers.map(async (freelancer) => {
          try {
            const summary = await tasksService.getEarningsSummary({ freelancer_id: freelancer.id });
            return {
              id: freelancer.id,
              username: freelancer.username,
              fullName: `${freelancer.first_name || ''} ${freelancer.last_name || ''}`.trim() || freelancer.username,
              totalEarned: Number(summary.total_earned || 0),
              pendingReviewAmount: Number(summary.pending_review_amount || 0),
              approvedOrCompletedTasks: Number(summary.approved_or_completed_tasks || 0),
              totalTasks: Number(summary.total_tasks || 0),
            };
          } catch (_error) {
            return {
              id: freelancer.id,
              username: freelancer.username,
              fullName: `${freelancer.first_name || ''} ${freelancer.last_name || ''}`.trim() || freelancer.username,
              totalEarned: 0,
              pendingReviewAmount: 0,
              approvedOrCompletedTasks: 0,
              totalTasks: 0,
            };
          }
        })
      );

      setRows(summaries);
    } catch (error) {
      console.error('Error fetching freelancer earnings:', error);
      toast.error('Failed to load freelancer earnings');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (item) =>
        item.fullName.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, item) => {
        acc.totalEarned += item.totalEarned;
        acc.pendingReviewAmount += item.pendingReviewAmount;
        acc.totalTasks += item.totalTasks;
        return acc;
      },
      { totalEarned: 0, pendingReviewAmount: 0, totalTasks: 0 }
    );
  }, [filteredRows]);

  if (!canManageMoney) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Money Management</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Money Management</h1>
        </div>
        <p className="text-gray-600">Earnings summary by freelancer from approved/completed tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total Earned" value={formatCurrency(totals.totalEarned)} color="text-emerald-600" />
        <SummaryCard title="Pending Review Amount" value={formatCurrency(totals.pendingReviewAmount)} color="text-purple-600" />
        <SummaryCard title="Total Tasks" value={totals.totalTasks} color="text-blue-600" />
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
        <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Freelancer Earnings</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search freelancer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={fetchData}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Freelancer</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Total Tasks</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Approved/Completed</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Total Earned</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">Pending Review Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No freelancers found</td>
                </tr>
              ) : (
                filteredRows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.fullName}</div>
                      <div className="text-xs text-gray-500">@{item.username}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.totalTasks}</td>
                    <td className="px-6 py-4 text-gray-700">{item.approvedOrCompletedTasks}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">{formatCurrency(item.totalEarned)}</td>
                    <td className="px-6 py-4 font-semibold text-purple-600">{formatCurrency(item.pendingReviewAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
