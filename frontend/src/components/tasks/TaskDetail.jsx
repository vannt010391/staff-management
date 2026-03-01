import { X, Calendar, DollarSign, User, Target, Clock, AlignLeft, Flag } from 'lucide-react';
import { formatCurrency, getTaskAssigneeName } from '../../utils/helpers';

export default function TaskDetail({ task, onClose }) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Task Details</h2>
              <p className="text-white/90 mt-2">{task.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={Target} label="Project" value={task.project_name || '-'} />
              <InfoRow icon={Flag} label="Priority" value={task.priority_display || task.priority || '-'} />
              <InfoRow icon={Clock} label="Status" value={task.status_display || task.status || '-'} />
              <InfoRow icon={User} label="Assigned To" value={getTaskAssigneeName(task) || 'Unassigned'} />
              <InfoRow icon={User} label="Assigned By" value={task.assigned_by_username || '-'} />
              <InfoRow icon={DollarSign} label="Price" value={task.price ? formatCurrency(Number(task.price)) : '-'} />
              <InfoRow icon={Calendar} label="Due Date" value={task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'} />
              <InfoRow icon={Calendar} label="Created" value={task.created_at ? new Date(task.created_at).toLocaleString() : '-'} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlignLeft className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {task.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
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
