import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, Edit, Trash2, DollarSign, Award, Eye } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { toast } from 'sonner';
import CareerPathForm from '../../components/hr/CareerPathForm';
import { PageHeader, StatCard, Button, EmptyState, Table, ViewToggle } from '../../components/ui';
import { formatCurrency } from '../../utils/helpers';

export default function CareerPathsPage() {
  const navigate = useNavigate();
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);
  const [view, setView] = useState('list');

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
      // Handle both paginated response (with results) and direct array
      const data = response.data.results || (Array.isArray(response.data) ? response.data : []);
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

  const handleView = (path) => {
    navigate(`/hr/career-paths/${path.id}`);
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

  const handleFormSuccess = async () => {
    await fetchCareerPaths();
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

  const getLevelBadgeColor = (level) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      key: 'level',
      label: 'Level',
      width: '10%',
      render: (path) => (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getLevelBadgeColor(path.level)}`}>
          Level {path.level}
        </span>
      )
    },
    {
      key: 'title',
      label: 'Title',
      width: '25%',
      render: (path) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br ${getLevelColor(path.level)} rounded-lg`}>
            <Award className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">{path.title}</span>
        </div>
      )
    },
    {
      key: 'salary_range',
      label: 'Salary Range',
      width: '20%',
      render: (path) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">
            {formatCurrency(Number(path.min_salary || 0))} - {formatCurrency(Number(path.max_salary || 0))}
          </span>
        </div>
      )
    },
    {
      key: 'requirements',
      label: 'Requirements',
      width: '30%',
      render: (path) => path.requirements ? (
        <span className="text-sm text-gray-600 line-clamp-2">{path.requirements}</span>
      ) : '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '15%',
      render: (path) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView(path);
            }}
            className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-3 w-3 text-indigo-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(path);
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPathToDelete(path);
              setShowDeleteConfirm(true);
            }}
            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          icon={TrendingUp}
          title="Career Paths"
          subtitle="Manage career levels and salary ranges"
          actions={
            <>
              <ViewToggle view={view} onViewChange={setView} />
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setSelectedPath(null);
                  setShowForm(true);
                }}
              >
                New Career Path
              </Button>
            </>
          }
        />

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={TrendingUp}
            label="Total Career Levels"
            value={careerPaths.length}
            gradient="purple"
          />
        </div>

        {/* Career Paths List/Grid */}
        {careerPaths.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No career paths found"
            description="Start by creating your first career path"
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedPath(null);
                  setShowForm(true);
                }}
              >
                New Career Path
              </Button>
            }
          />
        ) : view === 'list' ? (
          <Table columns={columns} data={careerPaths} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          {formatCurrency(Number(path.min_salary || 0))} - {formatCurrency(Number(path.max_salary || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(path)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="h-4 w-4 text-indigo-600" />
                  </button>
                  <button
                    onClick={() => handleEdit(path)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => {
                      setPathToDelete(path);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPathToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
