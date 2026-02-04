import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Edit, Trash2, DollarSign, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import CareerPathForm from '../../components/hr/CareerPathForm';

export default function CareerPathsPage() {
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);

  useEffect(() => {
    fetchCareerPaths();
  }, []);

  const fetchCareerPaths = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/hr/career-paths/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      // Sort by level
      const sorted = data.sort((a, b) => a.level - b.level);
      setCareerPaths(sorted);
    } catch (error) {
      console.error('Error fetching career paths:', error);
      toast.error('Failed to fetch career paths');
      setCareerPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (path) => {
    setSelectedPath(path);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!pathToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/hr/career-paths/${pathToDelete.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Career path deleted successfully');
      fetchCareerPaths();
      setShowDeleteConfirm(false);
      setPathToDelete(null);
    } catch (error) {
      console.error('Error deleting career path:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete career path');
    }
  };

  const handleFormSuccess = () => {
    fetchCareerPaths();
  };

  const getLevelColor = (level) => {
    const colors = {
      1: 'from-blue-500 to-blue-600',
      2: 'from-green-500 to-green-600',
      3: 'from-purple-500 to-purple-600',
      4: 'from-orange-500 to-orange-600',
      5: 'from-red-500 to-red-600'
    };
    return colors[level] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            Career Paths
          </h1>
          <p className="text-gray-600 mt-1">Manage career levels and salary ranges</p>
        </div>
        <button
          onClick={() => {
            setSelectedPath(null);
            setShowForm(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          New Career Path
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Total Career Levels</p>
            <p className="text-4xl font-bold mt-1">{careerPaths.length}</p>
          </div>
          <TrendingUp className="h-16 w-16 text-purple-200" />
        </div>
      </div>

      {/* Career Paths List */}
      {careerPaths.length === 0 ? (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No career paths found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {careerPaths.map((path) => (
            <div
              key={path.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
            >
              {/* Path Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 bg-gradient-to-br ${getLevelColor(path.level)} rounded-xl text-white`}>
                    <Award className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-2xl text-gray-900">{path.title}</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        Level {path.level}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <span className="text-lg font-semibold text-gray-700">
                          ${parseFloat(path.min_salary).toLocaleString()} - ${parseFloat(path.max_salary).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(path)}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setPathToDelete(path);
                      setShowDeleteConfirm(true);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Path Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Requirements */}
                {path.requirements && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Requirements</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{path.requirements}</p>
                  </div>
                )}

                {/* Benefits */}
                {path.benefits && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Benefits</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{path.benefits}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Career Path Form Modal */}
      {showForm && (
        <CareerPathForm
          careerPath={selectedPath}
          onClose={() => {
            setShowForm(false);
            setSelectedPath(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && pathToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the <span className="font-semibold">{pathToDelete.title}</span> career path?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPathToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
