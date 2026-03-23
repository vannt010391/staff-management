import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Target, User, Calendar, DollarSign, Clock, Flag, FileText, Upload, Trash2, Download, History, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import tasksService from '../services/tasks';
import usersService from '../services/users';
import taskFilesService from '../services/taskFiles';
import { formatCurrency, getTaskAssigneeName } from '../utils/helpers';
import { useAuthStore } from '../stores/authStore';
import { TASK_STATUS_LABELS } from '../constants';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [failedCriteria, setFailedCriteria] = useState({});
  const [commentText, setCommentText] = useState('');
  const [commentDesignRule, setCommentDesignRule] = useState('');
  const [commentResult, setCommentResult] = useState('none');
  const [commentAttachment, setCommentAttachment] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileType, setUploadFileType] = useState('submission');
  const [uploadComment, setUploadComment] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Staff edit state
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Change history
  const [changeHistory, setChangeHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const canAssignReviewer = ['admin', 'manager'].includes(user?.role);
  const isReviewerRole = ['admin', 'manager', 'team_lead', 'staff'].includes(user?.role);

  useEffect(() => {
    fetchTask();
    fetchChangeHistory();
  }, [id]);

  useEffect(() => {
    if (canAssignReviewer) {
      fetchReviewers();
    }
  }, [canAssignReviewer]);

  useEffect(() => {
    // Load all users for the assigned_to dropdown (admin/manager/staff/team_lead)
    const loadUsers = async () => {
      try {
        const [admins, managers, teamLeads, staffs, freelancers] = await Promise.all([
          usersService.getUsersByRole('admin'),
          usersService.getUsersByRole('manager'),
          usersService.getUsersByRole('team_lead'),
          usersService.getUsersByRole('staff'),
          usersService.getUsersByRole('freelancer'),
        ]);
        const map = new Map();
        [...admins, ...managers, ...teamLeads, ...staffs, ...freelancers].forEach(u => map.set(u.id, u));
        setAllUsers(Array.from(map.values()));
      } catch { /* ignore */ }
    };
    loadUsers();
  }, []);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await tasksService.getTask(id);
      setTask(data);
      setEditForm({
        title: data.title || '',
        description: data.description || '',
        priority: data.priority || 'medium',
        due_date: data.due_date ? data.due_date.substring(0, 10) : '',
        stage: data.stage || 'planning',
        status: data.status || 'new',
        price: data.price || '',
        assigned_to: data.assigned_to ? String(data.assigned_to) : '',
      });
      setSelectedReviewerId(data.reviewer ? String(data.reviewer) : '');
      setFailedCriteria({});
      setReviewComment('');
    } catch (error) {
      console.error('Error fetching task detail:', error);
      toast.error('Failed to load task detail');
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await tasksService.getChangeHistory(id);
      setChangeHistory(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim() && !commentAttachment) {
      toast.error('Please enter comment text or attach a file/image');
      return;
    }

    try {
      setCommentLoading(true);
      const payload = {
        comment: commentText.trim(),
        design_rule: commentDesignRule ? Number(commentDesignRule) : undefined,
        is_passed: commentResult === 'none' ? undefined : commentResult === 'pass',
        attachment: commentAttachment || undefined,
      };

      await tasksService.addComment(id, payload);
      toast.success('Comment added successfully');
      setCommentText('');
      setCommentDesignRule('');
      setCommentResult('none');
      setCommentAttachment(null);
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const fetchReviewers = async () => {
    try {
      const [admins, managers, teamLeads, staffs] = await Promise.all([
        usersService.getUsersByRole('admin'),
        usersService.getUsersByRole('manager'),
        usersService.getUsersByRole('team_lead'),
        usersService.getUsersByRole('staff'),
      ]);

      const reviewerMap = new Map();
      [...admins, ...managers, ...teamLeads, ...staffs].forEach((item) => {
        reviewerMap.set(item.id, item);
      });

      setReviewers(Array.from(reviewerMap.values()));
    } catch (error) {
      console.error('Error fetching reviewers:', error);
    }
  };

  const handleAssignReviewer = async () => {
    try {
      setActionLoading(true);
      const reviewerId = selectedReviewerId ? Number(selectedReviewerId) : null;
      await tasksService.assignReviewer(id, reviewerId);
      toast.success(reviewerId ? 'Reviewer assigned successfully' : 'Reviewer cleared successfully');
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign reviewer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setActionLoading(true);
      await tasksService.changeStatus(id, 'review_pending');
      toast.success('Task submitted for review');
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit for review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWorking = async () => {
    try {
      setActionLoading(true);
      await tasksService.changeStatus(id, 'working');
      toast.success('Task moved to Working');
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update task status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewDecision = async (decision) => {
    const designRules = Array.isArray(task.design_rules) ? task.design_rules : [];

    let criteriaData = [];

    if (decision === 'reject') {
      if (designRules.length === 0) {
        toast.error('Cannot reject without design rules criteria on task');
        return;
      }

      const failedRuleIds = designRules
        .filter((rule) => failedCriteria[rule.id])
        .map((rule) => rule.id);

      if (failedRuleIds.length === 0) {
        toast.error('Please select at least one failed criterion for reject');
        return;
      }

      criteriaData = designRules.map((rule) => ({
        design_rule: rule.id,
        is_met: !failedRuleIds.includes(rule.id),
        comment: failedRuleIds.includes(rule.id) ? reviewComment : '',
      }));
    } else {
      criteriaData = designRules.map((rule) => ({
        design_rule: rule.id,
        is_met: true,
        comment: '',
      }));
    }

    try {
      setActionLoading(true);
      if (decision === 'approve') {
        await tasksService.approveTask(id, { comment: reviewComment, criteria_data: criteriaData });
        toast.success('Task approved successfully');
      } else {
        await tasksService.rejectTask(id, { comment: reviewComment, criteria_data: criteriaData });
        toast.success('Task rejected successfully');
      }
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review decision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      await taskFilesService.uploadFile(id, {
        file: uploadFile,
        file_type: uploadFileType,
        comment: uploadComment,
      });
      toast.success('File uploaded successfully');
      setUploadFile(null);
      setUploadFileType('submission');
      setUploadComment('');
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await taskFilesService.deleteFile(fileId);
      toast.success('File deleted successfully');
      await fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const handleSaveEdit = async () => {
    try {
      setEditSaving(true);
      await tasksService.patchTask(id, editForm);
      toast.success('Task updated successfully');
      setEditMode(false);
      await fetchTask();
      await fetchChangeHistory();
    } catch (error) {
      const errData = error.response?.data;
      const msg = errData?.detail || errData?.error || Object.values(errData || {})[0] || 'Failed to update task';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  }

  if (!task) {
    return <div className="p-6 text-gray-600">Task not found.</div>;
  }

  const isAssignedFreelancer = user?.role === 'freelancer' && task.assigned_to === user?.id;
  const isAssignedReviewer = task.reviewer === user?.id;
  const canSubmitForReview = isAssignedFreelancer && task.status === 'working';
  const canRestartWork = isAssignedFreelancer && ['assigned', 'rejected'].includes(task.status);
  const canReview = isReviewerRole && isAssignedReviewer && task.status === 'review_pending';
  const designRules = Array.isArray(task.design_rules) ? task.design_rules : [];
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const resources = Array.isArray(task.resources) ? task.resources : [];
  const uploads = Array.isArray(task.uploads) ? task.uploads : [];
  const canUploadFiles = isAssignedFreelancer || ['admin', 'manager'].includes(user?.role);
  const canEdit = ['admin', 'manager', 'staff', 'team_lead'].includes(user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-6">
        <button onClick={() => navigate('/tasks')} className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            {canEdit && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-2 whitespace-pre-line">{task.description || 'No description'}</p>
        </div>

        {/* Edit Form */}
        {canEdit && editMode && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-600" /> Edit Task
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="working">Working</option>
                  <option value="review_pending">Review Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={editForm.stage}
                  onChange={(e) => setEditForm(f => ({ ...f, stage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="planning">Planning</option>
                  <option value="design">Design</option>
                  <option value="development">Development</option>
                  <option value="review">Review</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={editForm.assigned_to}
                  onChange={(e) => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Unassigned --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={editForm.price}
                  onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {!editMode && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-5">
          <Info icon={Target} label="Project" value={task.project_name || '-'} />
          <Info icon={Clock} label="Status" value={task.status_display || task.status || '-'} />
          <Info icon={Flag} label="Priority" value={task.priority_display || task.priority || '-'} />
          <Info icon={User} label="Assigned To" value={getTaskAssigneeName(task) || 'Unassigned'} />
          <Info icon={User} label="Assigned By" value={task.assigned_by_username || '-'} />
          <Info icon={User} label="Reviewer" value={task.reviewer_full_name || task.reviewer_username || '-'} />
          <Info icon={DollarSign} label="Price" value={task.price ? formatCurrency(Number(task.price)) : '-'} />
          <Info icon={Calendar} label="Due Date" value={task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'} />
          <Info icon={Calendar} label="Created" value={task.created_at ? new Date(task.created_at).toLocaleString() : '-'} />
          <Info icon={DollarSign} label="Freelancer Earning" value={formatCurrency(Number(task.freelancer_earning || 0))} />
        </div>
        )}

        {/* Task Resources */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tài liệu tham khảo
          </h3>
          {resources.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có tài liệu tham khảo</p>
          ) : (
            <div className="space-y-2">
              {resources.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={handleFileDelete}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Task Uploads */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File bài làm / Kết quả
          </h3>

          {canUploadFiles && (
            <form onSubmit={handleFileUpload} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn file</label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại file</label>
                    <select
                      value={uploadFileType}
                      onChange={(e) => setUploadFileType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="submission">Bài làm</option>
                      <option value="revision">File sửa</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (tùy chọn)</label>
                  <textarea
                    rows={2}
                    value={uploadComment}
                    onChange={(e) => setUploadComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Thêm ghi chú về file này..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadLoading ? 'Đang upload...' : 'Upload File'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {uploads.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có file bài làm</p>
          ) : (
            <div className="space-y-2">
              {uploads.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onDelete={handleFileDelete}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>

        {canAssignReviewer && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Review Assignment</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg min-w-[280px]"
              >
                <option value="">Unassigned</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {(reviewer.first_name || reviewer.last_name)
                      ? `${reviewer.first_name || ''} ${reviewer.last_name || ''}`.trim()
                      : reviewer.username}{' '}
                    ({reviewer.role})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignReviewer}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Save Reviewer
              </button>
            </div>
          </div>
        )}

        {(canSubmitForReview || canRestartWork || canReview) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Task Lifecycle Actions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Current status: {TASK_STATUS_LABELS[task.status] || task.status}
            </p>

            {task.status === 'review_pending' && isReviewerRole && !isAssignedReviewer && (
              <p className="text-sm text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                This task is in review pending. Only assigned reviewer can approve or reject.
              </p>
            )}

            {canReview && (
              <div className="mb-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Review Comment</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Write review note..."
                />

                {designRules.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Reject Criteria (select failed rules)</p>
                    <div className="space-y-2">
                      {designRules.map((rule) => (
                        <label key={rule.id} className="flex items-start gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={!!failedCriteria[rule.id]}
                            onChange={(e) => setFailedCriteria((prev) => ({ ...prev, [rule.id]: e.target.checked }))}
                            className="mt-0.5 h-4 w-4"
                          />
                          <span>
                            {rule.name} {rule.is_required ? '(Required)' : '(Optional)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {canRestartWork && (
                <button
                  onClick={handleStartWorking}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Start Working
                </button>
              )}
              {canSubmitForReview && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Submit For Review
                </button>
              )}
              {canReview && (
                <>
                  <button
                    onClick={() => handleReviewDecision('approve')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewDecision('reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Review Comments</h3>
            <p className="text-sm text-gray-600 mt-1">Add review criteria result (pass/failed) and attach file or image</p>
          </div>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            <textarea
              rows={4}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Write your comment or review note..."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={commentDesignRule}
                onChange={(e) => setCommentDesignRule(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">No criteria</option>
                {designRules.map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>

              <select
                value={commentResult}
                onChange={(e) => setCommentResult(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="none">No pass/fail</option>
                <option value="pass">Pass</option>
                <option value="failed">Failed</option>
              </select>

              <input
                type="file"
                onChange={(e) => setCommentAttachment(e.target.files?.[0] || null)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {commentLoading ? 'Submitting...' : 'Add Comment'}
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    taskId={id}
                    designRules={designRules}
                    onCommentAdded={fetchTask}
                  />
              ))
            )}
          </div>
        </div>

        {/* Change History */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />
            Change History
          </h3>
          {historyLoading ? (
            <div className="text-center py-6 text-gray-400">Loading...</div>
          ) : changeHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No change history yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {changeHistory.map((item) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">
                      {item.changed_by_full_name || item.changed_by_username || 'Hệ thống'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.changed_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {item.change_note ? (
                    <p className="text-gray-600">{item.change_note}</p>
                  ) : (
                    <p className="text-gray-600">
                      <span className="font-medium text-blue-700">{item.field_name}</span>
                      {': '}
                      <span className="line-through text-red-500">{item.old_value || '(trống)'}</span>
                      {' → '}
                      <span className="text-green-600">{item.new_value || '(trống)'}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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

function FileItem({ file, onDelete, currentUserId }) {
  const canDelete = currentUserId === file.uploaded_by;
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{file.file_type_display}</span>
            <span>{formatFileSize(file.file_size)}</span>
            <span>Bởi {file.uploaded_by_full_name || file.uploaded_by_username}</span>
            <span>{new Date(file.uploaded_at).toLocaleString()}</span>
          </div>
          {file.comment && (
            <p className="text-xs text-gray-600 mt-1 italic">{file.comment}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <a
          href={file.file_url}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(file.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, taskId, designRules, onCommentAdded }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyDesignRule, setReplyDesignRule] = useState('');
  const [replyResult, setReplyResult] = useState('none');
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const passFailBadge =
    comment.pass_fail_display === 'pass'
      ? 'bg-green-100 text-green-700'
      : comment.pass_fail_display === 'failed'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700';

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyText.trim() && !replyAttachment) {
      toast.error('Please enter reply text or attach a file/image');
      return;
    }

    try {
      setReplyLoading(true);
      await tasksService.addComment(taskId, {
        parent: comment.id,
        comment: replyText.trim(),
        design_rule: replyDesignRule ? Number(replyDesignRule) : undefined,
        is_passed: replyResult === 'none' ? undefined : replyResult === 'pass',
        attachment: replyAttachment || undefined,
      });

      setReplyText('');
      setReplyDesignRule('');
      setReplyResult('none');
      setReplyAttachment(null);
      setShowReplyForm(false);
      await onCommentAdded();
      toast.success('Reply added successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add reply');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-900">{comment.user_full_name || comment.user_username || 'Unknown'}</span>
        {comment.design_rule_name && (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
            {comment.design_rule_name}
          </span>
        )}
        {comment.pass_fail_display && (
          <span className={`text-xs px-2 py-1 rounded-full ${passFailBadge}`}>
            {comment.pass_fail_display.toUpperCase()}
          </span>
        )}
        <span className="text-xs text-gray-500">{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</span>
      </div>

      {comment.comment && <p className="text-sm text-gray-700 whitespace-pre-line">{comment.comment}</p>}

      {comment.attachment_url && (
        <a
          href={comment.attachment_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Open attachment
        </a>
      )}

      <div className="mt-3">
        <button
          onClick={() => setShowReplyForm((prev) => !prev)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {showReplyForm ? 'Cancel reply' : 'Reply'}
        </button>
      </div>

      {showReplyForm && (
        <form onSubmit={handleReplySubmit} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Write a reply..."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              value={replyDesignRule}
              onChange={(e) => setReplyDesignRule(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">No criteria</option>
              {designRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>

            <select
              value={replyResult}
              onChange={(e) => setReplyResult(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="none">No pass/fail</option>
              <option value="pass">Pass</option>
              <option value="failed">Failed</option>
            </select>

            <input
              type="file"
              onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={replyLoading}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {replyLoading ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}

      {replies.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              taskId={taskId}
              designRules={designRules}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
