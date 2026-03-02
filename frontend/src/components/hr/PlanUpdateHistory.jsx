import { useState, useEffect } from 'react';
import { History, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';

export default function PlanUpdateHistory({ planId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [planId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await plansService.getUpdateHistory(planId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load update history');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      status_changed: 'bg-purple-100 text-purple-800',
      goal_added: 'bg-yellow-100 text-yellow-800',
      goal_completed: 'bg-indigo-100 text-indigo-800',
      reviewed: 'bg-pink-100 text-pink-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <History className="w-6 h-6 text-indigo-600" />
        Update History
      </h3>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No update history yet
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative pl-8 pb-4">
              {/* Timeline line */}
              {index < history.length - 1 && (
                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              )}

              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white"></div>

              {/* Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                    {entry.action_display}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.changed_at).toLocaleString()}
                  </div>
                </div>

                {entry.changed_by_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>{entry.changed_by_name}</span>
                  </div>
                )}

                {entry.change_description && (
                  <p className="text-sm text-gray-700 font-medium">{entry.change_description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
