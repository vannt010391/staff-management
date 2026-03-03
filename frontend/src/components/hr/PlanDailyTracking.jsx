import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';

export default function PlanDailyTracking({ planId }) {
  const [dailyProgress, setDailyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayEntry, setTodayEntry] = useState({
    hours_worked: 0,
    blockers: '',
    next_plan: ''
  });

  useEffect(() => {
    fetchDailyProgress();
  }, [planId]);

  const fetchDailyProgress = async () => {
    try {
      setLoading(true);
      const data = await plansService.getDailyProgress(planId);
      setDailyProgress(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching daily progress:', error);
      toast.error('Failed to load daily progress');
    } finally {
      setLoading(false);
    }
  };

  const handleLogToday = async () => {
    try {
      await plansService.logTodayProgress(planId, todayEntry);
      toast.success('Daily progress logged successfully');
      fetchDailyProgress();
      setTodayEntry({
        hours_worked: 0,
        blockers: '',
        next_plan: ''
      });
    } catch (error) {
      console.error('Error logging progress:', error);
      toast.error('Failed to log progress');
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Progress Entry */}
      <div className="bg-white rounded-2xl p-6 border shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" />
          Log Today's Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours Worked
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={todayEntry.hours_worked}
              onChange={(e) => setTodayEntry(prev => ({
                ...prev,
                hours_worked: parseFloat(e.target.value) || 0
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Improvement / Next Plan
          </label>
          <textarea
            rows={3}
            value={todayEntry.next_plan}
            onChange={(e) => setTodayEntry(prev => ({
              ...prev,
              next_plan: e.target.value
            }))}
            placeholder="What should be improved or prioritized next?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blockers / Issues
          </label>
          <textarea
            rows={3}
            value={todayEntry.blockers}
            onChange={(e) => setTodayEntry(prev => ({
              ...prev,
              blockers: e.target.value
            }))}
            placeholder="What blocked progress today?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleLogToday}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          Log Today's Progress
        </button>
      </div>

      {/* Historical Progress */}
      <div className="bg-white rounded-2xl p-6 border shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Progress History
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : dailyProgress.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No progress logged yet
          </div>
        ) : (
          <div className="space-y-3">
            {dailyProgress.map(entry => (
              <div key={entry.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-xs text-purple-600 font-medium">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {new Date(entry.date).getDate()}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{entry.hours_worked}h</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.completed_goals_count} goals completed
                    </div>
                    <div className="text-sm font-semibold text-purple-600">
                      {entry.completion_percentage_snapshot}%
                    </div>
                  </div>
                  {entry.progress_notes && (
                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Notes:</span> {entry.progress_notes}</p>
                  )}
                  {entry.work_results && (
                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Results:</span> {entry.work_results}</p>
                  )}
                  {entry.blockers && (
                    <p className="text-sm text-amber-700 mb-1"><span className="font-medium">Blockers:</span> {entry.blockers}</p>
                  )}
                  {entry.next_plan && (
                    <p className="text-sm text-indigo-700"><span className="font-medium">Next:</span> {entry.next_plan}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
