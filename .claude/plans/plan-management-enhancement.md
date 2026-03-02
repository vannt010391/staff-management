# Plan Management Feature Enhancement

## Context

The user wants to enhance the Plan Management feature in the HR module with the following requirements:

**Current Issues:**
- Plans page only shows "My Plans" without distinction between personal and team plans
- No quarterly plan type (only daily, weekly, monthly, yearly exist)
- No daily progress tracking mechanism
- No update history tracking
- Limited filtering options for managers to view team plans

**User Requirements:**
1. **All Plans vs My Plans**: Separate views where "All Plans" shows plans filtered by department and employee (for managers/admins), and "My Plans" shows only personal plans
2. **Add Quarterly Plan Type**: Support creating plans by week, month, quarter (quý), and year
3. **Daily Progress Tracking**: Track daily completion progress (theo dõi mỗi ngày hoàn thành được bao nhiêu)
4. **Update History**: Save and display history of all plan updates (lịch sử cập nhật phải được lưu lại)

**Why This Change:**
This enhancement allows better team coordination and accountability. Managers need to track their team's plans, employees need daily tracking to stay on target, and history tracking provides transparency and audit trails for plan modifications.

---

## Implementation Plan

### Phase 1: Backend - Database Models

#### 1.1 Add Quarterly Plan Type
**File**: `backend/hr/models.py` (line 446)

Update `Plan.PLAN_TYPE_CHOICES`:
```python
PLAN_TYPE_CHOICES = [
    ('daily', 'Daily Plan'),
    ('weekly', 'Weekly Plan'),
    ('monthly', 'Monthly Plan'),
    ('quarterly', 'Quarterly Plan'),  # ADD THIS
    ('yearly', 'Yearly Plan'),
]
```

#### 1.2 Create PlanDailyProgress Model
**File**: `backend/hr/models.py` (after line 630, after PlanNote class)

```python
class PlanDailyProgress(models.Model):
    """Daily progress tracking for plans"""
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='daily_progress')
    date = models.DateField(help_text='Date of progress entry')

    # Progress metrics
    completed_goals_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Goals completed on this day'
    )
    hours_worked = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    progress_notes = models.TextField(blank=True)
    completion_percentage_snapshot = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Plan completion % at end of day'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['plan', 'date']
        indexes = [models.Index(fields=['plan', '-date'])]
        verbose_name = 'Plan Daily Progress'

    def __str__(self):
        return f"{self.plan.title} - {self.date} ({self.completion_percentage_snapshot}%)"
```

#### 1.3 Create PlanUpdateHistory Model
**File**: `backend/hr/models.py` (after PlanDailyProgress)

```python
class PlanUpdateHistory(models.Model):
    """Audit trail for all plan changes"""
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('status_changed', 'Status Changed'),
        ('goal_added', 'Goal Added'),
        ('goal_completed', 'Goal Completed'),
        ('reviewed', 'Reviewed by Manager'),
    ]

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='update_history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='plan_changes'
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    # Store changes as JSON
    previous_values = models.JSONField(
        null=True,
        blank=True,
        help_text='Previous state before change'
    )
    current_values = models.JSONField(
        null=True,
        blank=True,
        help_text='New state after change'
    )
    change_description = models.TextField(
        blank=True,
        help_text='Human-readable description of change'
    )

    class Meta:
        ordering = ['-changed_at']
        indexes = [models.Index(fields=['plan', '-changed_at'])]
        verbose_name = 'Plan Update History'
        verbose_name_plural = 'Plan Update Histories'

    def __str__(self):
        return f"{self.plan.title} - {self.action} by {self.changed_by} at {self.changed_at}"
```

#### 1.4 Create Database Migration
**File**: Create new migration file

```bash
cd backend
python manage.py makemigrations hr
```

---

### Phase 2: Backend - Serializers

#### 2.1 Create New Serializers
**File**: `backend/hr/serializers.py` (add at end of file, around line 297)

```python
class PlanDailyProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanDailyProgress
        fields = [
            'id', 'plan', 'date', 'completed_goals_count',
            'hours_worked', 'progress_notes',
            'completion_percentage_snapshot',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PlanUpdateHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source='changed_by.get_full_name',
        read_only=True
    )
    action_display = serializers.CharField(
        source='get_action_display',
        read_only=True
    )

    class Meta:
        model = PlanUpdateHistory
        fields = [
            'id', 'plan', 'action', 'action_display',
            'changed_by', 'changed_by_name', 'changed_at',
            'previous_values', 'current_values', 'change_description'
        ]
        read_only_fields = ['changed_by', 'changed_at']
```

#### 2.2 Update Existing PlanSerializer
**File**: `backend/hr/serializers.py` (line 263-297)

Add daily_progress and update_history to PlanSerializer:
```python
class PlanSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    goals = PlanGoalSerializer(many=True, read_only=True)
    notes = PlanNoteSerializer(many=True, read_only=True)
    daily_progress = PlanDailyProgressSerializer(many=True, read_only=True)  # ADD
    update_history = PlanUpdateHistorySerializer(many=True, read_only=True)  # ADD

    class Meta:
        model = Plan
        fields = [
            # ... existing fields ...
            'goals', 'notes',
            'daily_progress',  # ADD
            'update_history',  # ADD
            'created_at', 'updated_at'
        ]
```

#### 2.3 Update Imports
**File**: `backend/hr/serializers.py` (line 2)

```python
from .models import (
    Department, CareerPath, Employee, KPI, Evaluation, SalaryReview,
    PersonalReport, Plan, PlanGoal, PlanNote,
    PlanDailyProgress, PlanUpdateHistory  # ADD THESE
)
```

---

### Phase 3: Backend - Views & API Endpoints

#### 3.1 Create PlanDailyProgressViewSet
**File**: `backend/hr/views.py` (add after PlanNoteViewSet, around line 615)

```python
class PlanDailyProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing daily progress entries"""
    queryset = PlanDailyProgress.objects.all()
    serializer_class = PlanDailyProgressSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'date']
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        """Filter based on plan access permissions"""
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return PlanDailyProgress.objects.all()
        # Users can only see progress for plans they have access to
        accessible_plans = Plan.objects.filter(user=user)
        return PlanDailyProgress.objects.filter(plan__in=accessible_plans)

    @action(detail=False, methods=['post'])
    def log_today(self, request):
        """Quick endpoint to log today's progress"""
        plan_id = request.data.get('plan')
        today = timezone.now().date()

        progress, created = PlanDailyProgress.objects.get_or_create(
            plan_id=plan_id,
            date=today,
            defaults={
                'completed_goals_count': request.data.get('completed_goals_count', 0),
                'hours_worked': request.data.get('hours_worked', 0),
                'progress_notes': request.data.get('progress_notes', ''),
                'completion_percentage_snapshot': request.data.get('completion_percentage_snapshot', 0)
            }
        )

        if not created:
            # Update existing entry
            for field in ['completed_goals_count', 'hours_worked', 'progress_notes', 'completion_percentage_snapshot']:
                if field in request.data:
                    setattr(progress, field, request.data[field])
            progress.save()

        serializer = self.get_serializer(progress)
        return Response(serializer.data)


class PlanUpdateHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing plan update history (read-only)"""
    queryset = PlanUpdateHistory.objects.all()
    serializer_class = PlanUpdateHistorySerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'action', 'changed_by']
    ordering_fields = ['changed_at']
    ordering = ['-changed_at']

    def get_queryset(self):
        """Filter based on plan access permissions"""
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return PlanUpdateHistory.objects.all()
        accessible_plans = Plan.objects.filter(user=user)
        return PlanUpdateHistory.objects.filter(plan__in=accessible_plans)
```

#### 3.2 Update PlanViewSet
**File**: `backend/hr/views.py` (line 413-556)

Add department and employee filters:
```python
class PlanViewSet(viewsets.ModelViewSet):
    # ... existing code ...
    filterset_fields = [
        'user', 'plan_type', 'status', 'period_start',
        'user__employee_profile__department',  # ADD: Filter by department
    ]

    # ... existing get_queryset() ...

    def perform_create(self, serializer):
        """Auto-set user and create history entry"""
        plan = serializer.save(user=self.request.user)
        # Create history entry
        PlanUpdateHistory.objects.create(
            plan=plan,
            action='created',
            changed_by=self.request.user,
            current_values={'title': plan.title, 'plan_type': plan.plan_type},
            change_description=f'Plan created: {plan.title}'
        )

    def perform_update(self, serializer):
        """Track changes in history"""
        plan = serializer.instance
        # Capture previous values
        previous = {
            'status': plan.status,
            'completion_percentage': plan.completion_percentage,
            'title': plan.title
        }

        # Save updates
        updated_plan = serializer.save()

        # Check what changed
        changes = []
        if previous['status'] != updated_plan.status:
            changes.append(f"Status: {previous['status']} → {updated_plan.status}")
        if previous['completion_percentage'] != updated_plan.completion_percentage:
            changes.append(f"Progress: {previous['completion_percentage']}% → {updated_plan.completion_percentage}%")
        if previous['title'] != updated_plan.title:
            changes.append(f"Title: {previous['title']} → {updated_plan.title}")

        if changes:
            PlanUpdateHistory.objects.create(
                plan=updated_plan,
                action='status_changed' if previous['status'] != updated_plan.status else 'updated',
                changed_by=self.request.user,
                previous_values=previous,
                current_values={
                    'status': updated_plan.status,
                    'completion_percentage': updated_plan.completion_percentage,
                    'title': updated_plan.title
                },
                change_description='; '.join(changes)
            )
```

#### 3.3 Update Imports
**File**: `backend/hr/views.py` (line 8)

```python
from .models import (
    Department, CareerPath, Employee, KPI, Evaluation, SalaryReview,
    PersonalReport, Plan, PlanGoal, PlanNote,
    PlanDailyProgress, PlanUpdateHistory  # ADD THESE
)

from .serializers import (
    # ... existing imports ...
    PlanDailyProgressSerializer, PlanUpdateHistorySerializer  # ADD THESE
)
```

#### 3.4 Update URL Routing
**File**: `backend/hr/urls.py`

Add new viewsets to router:
```python
router.register(r'plan-daily-progress', views.PlanDailyProgressViewSet)
router.register(r'plan-update-history', views.PlanUpdateHistoryViewSet)
```

---

### Phase 4: Frontend - Services

#### 4.1 Update Plans Service
**File**: `frontend/src/services/plans.js`

Add new methods:
```javascript
// Add to plansService object:

// Daily progress
async getDailyProgress(planId, params = {}) {
  const response = await api.get(`/hr/plan-daily-progress/`, {
    params: { plan: planId, ...params }
  });
  return response.data.results || response.data;
},

async logTodayProgress(planId, data) {
  const response = await api.post(`/hr/plan-daily-progress/log_today/`, {
    plan: planId,
    ...data
  });
  return response.data;
},

async createDailyProgress(data) {
  const response = await api.post(`/hr/plan-daily-progress/`, data);
  return response.data;
},

// Update history
async getUpdateHistory(planId) {
  const response = await api.get(`/hr/plan-update-history/`, {
    params: { plan: planId }
  });
  return response.data.results || response.data;
},

// Enhanced filtering for All Plans view
async getAllPlans(params = {}) {
  const response = await api.get(`/hr/plans/`, { params });
  return response.data.results || response.data;
},
```

---

### Phase 5: Frontend - UI Components

#### 5.1 Update PlanForm - Add Quarterly Option
**File**: `frontend/src/components/hr/PlanForm.jsx` (lines 43-56)

Update the plan_type switch case to include quarterly:
```javascript
useEffect(() => {
  if (formData.period_start && !plan) {
    const start = new Date(formData.period_start);
    let end = new Date(start);

    switch (formData.plan_type) {
      case 'daily':
        end = new Date(start);
        break;
      case 'weekly':
        end.setDate(start.getDate() + 6);
        break;
      case 'monthly':
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        break;
      case 'quarterly':  // ADD THIS CASE
        end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        break;
      case 'yearly':
        end = new Date(start.getFullYear(), 11, 31);
        break;
    }
    // ... rest of code
  }
}, [formData.plan_type, formData.period_start, plan]);
```

Also update the select options (line 138-141):
```javascript
<select ...>
  <option value="daily">Daily Plan</option>
  <option value="weekly">Weekly Plan</option>
  <option value="monthly">Monthly Plan</option>
  <option value="quarterly">Quarterly Plan</option>  {/* ADD THIS */}
  <option value="yearly">Yearly Plan</option>
</select>
```

#### 5.2 Create Daily Progress Component
**File**: `frontend/src/components/hr/PlanDailyTracking.jsx` (NEW FILE)

```javascript
import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import plansService from '../../services/plans';

export default function PlanDailyTracking({ planId }) {
  const [dailyProgress, setDailyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayEntry, setTodayEntry] = useState({
    completed_goals_count: 0,
    hours_worked: 0,
    progress_notes: '',
    completion_percentage_snapshot: 0
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
        completed_goals_count: 0,
        hours_worked: 0,
        progress_notes: '',
        completion_percentage_snapshot: 0
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

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goals Completed Today
            </label>
            <input
              type="number"
              min="0"
              value={todayEntry.completed_goals_count}
              onChange={(e) => setTodayEntry(prev => ({
                ...prev,
                completed_goals_count: parseInt(e.target.value) || 0
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

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
            Progress Notes
          </label>
          <textarea
            rows={3}
            value={todayEntry.progress_notes}
            onChange={(e) => setTodayEntry(prev => ({
              ...prev,
              progress_notes: e.target.value
            }))}
            placeholder="What did you accomplish today?"
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
                    <p className="text-sm text-gray-700">{entry.progress_notes}</p>
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
```

#### 5.3 Create Update History Component
**File**: `frontend/src/components/hr/PlanUpdateHistory.jsx` (NEW FILE)

```javascript
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
```

#### 5.4 Update PlansPage - Add Tabs for All/My Plans
**File**: `frontend/src/pages/hr/PlansPage.jsx` (major refactor)

Add state and tab handling (around line 15):
```javascript
const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'
const [selectedDepartment, setSelectedDepartment] = useState('');
const [selectedEmployee, setSelectedEmployee] = useState('');
const [departments, setDepartments] = useState([]);
const [employees, setEmployees] = useState([]);

// Fetch plans based on view mode
const fetchPlans = async () => {
  try {
    setLoading(true);
    let data;
    if (viewMode === 'my') {
      data = await plansService.getMyPlans();
    } else {
      // All plans with filters
      const params = {};
      if (selectedDepartment) params['user__employee_profile__department'] = selectedDepartment;
      if (selectedEmployee) params.user = selectedEmployee;
      if (filterType) params.plan_type = filterType;
      if (filterStatus) params.status = filterStatus;
      data = await plansService.getAllPlans(params);
    }
    setPlans(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error fetching plans:', error);
    toast.error('Failed to load plans');
  } finally {
    setLoading(false);
  }
};

// Re-fetch when view mode or filters change
useEffect(() => {
  fetchPlans();
}, [viewMode, selectedDepartment, selectedEmployee, filterType, filterStatus]);
```

Add tab navigation in PageHeader (around line 217):
```javascript
<PageHeader
  icon={Target}
  title={
    <div className="flex items-center gap-4">
      <span>Plans</span>
      <div className="flex bg-white rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setViewMode('my')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'my'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Plans
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            viewMode === 'all'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Plans
        </button>
      </div>
    </div>
  }
  subtitle={viewMode === 'my' ? 'Track your goals and progress' : 'View team plans and progress'}
  actions={/* existing actions */}
/>
```

Add department/employee filters in filter section (only show when viewMode === 'all'):
```javascript
{viewMode === 'all' && (
  <>
    <select
      value={selectedDepartment}
      onChange={(e) => setSelectedDepartment(e.target.value)}
      className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      <option value="">All Departments</option>
      {departments.map(dept => (
        <option key={dept.id} value={dept.id}>{dept.name}</option>
      ))}
    </select>

    <select
      value={selectedEmployee}
      onChange={(e) => setSelectedEmployee(e.target.value)}
      className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      <option value="">All Employees</option>
      {employees.map(emp => (
        <option key={emp.id} value={emp.user}>
          {emp.user_details?.full_name || emp.user_details?.username}
        </option>
      ))}
    </select>
  </>
)}
```

#### 5.5 Update PlanDetailPage - Add Daily Tracking & History
**File**: `frontend/src/pages/hr/PlanDetailPage.jsx`

Import new components:
```javascript
import PlanDailyTracking from '../../components/hr/PlanDailyTracking';
import PlanUpdateHistory from '../../components/hr/PlanUpdateHistory';
```

Add tabs for different sections and include the components:
```javascript
{/* Add after existing plan details */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  <PlanDailyTracking planId={plan.id} />
  <PlanUpdateHistory planId={plan.id} />
</div>
```

---

### Phase 6: Admin Interface

**File**: `backend/hr/admin.py`

Register new models:
```python
from .models import (
    # ... existing imports ...
    PlanDailyProgress, PlanUpdateHistory
)

@admin.register(PlanDailyProgress)
class PlanDailyProgressAdmin(admin.ModelAdmin):
    list_display = ['plan', 'date', 'completed_goals_count', 'hours_worked', 'completion_percentage_snapshot']
    list_filter = ['date', 'plan__plan_type']
    search_fields = ['plan__title', 'progress_notes']
    date_hierarchy = 'date'


@admin.register(PlanUpdateHistory)
class PlanUpdateHistoryAdmin(admin.ModelAdmin):
    list_display = ['plan', 'action', 'changed_by', 'changed_at']
    list_filter = ['action', 'changed_at']
    search_fields = ['plan__title', 'change_description']
    readonly_fields = ['changed_at']
    date_hierarchy = 'changed_at'
```

---

## Implementation Order

1. **Backend Database** (Phase 1):
   - Update Plan model PLAN_TYPE_CHOICES
   - Create PlanDailyProgress model
   - Create PlanUpdateHistory model
   - Run migrations

2. **Backend API** (Phases 2-3):
   - Create serializers for new models
   - Create viewsets for new models
   - Update existing PlanViewSet with history tracking
   - Update URL routing
   - Register models in admin

3. **Frontend Services** (Phase 4):
   - Update plans.js service with new API methods

4. **Frontend UI** (Phase 5):
   - Update PlanForm with quarterly option
   - Create PlanDailyTracking component
   - Create PlanUpdateHistory component
   - Update PlansPage with tabs and filters
   - Update PlanDetailPage with new components

---

## Testing & Verification

### Backend Testing:
1. Run migrations: `python manage.py migrate`
2. Create test data through Django admin or API
3. Test API endpoints:
   - `GET /api/hr/plans/` with department filter
   - `POST /api/hr/plan-daily-progress/log_today/`
   - `GET /api/hr/plan-update-history/?plan=<id>`

### Frontend Testing:
1. Test "My Plans" tab shows only personal plans
2. Test "All Plans" tab shows team plans (for managers)
3. Test department/employee filters work correctly
4. Test quarterly plan creation auto-calculates 3-month period
5. Test daily progress logging
6. Test update history displays correctly
7. Test permissions (staff should not see "All Plans" tab)

### End-to-End Test Flow:
1. Login as manager
2. Create a quarterly plan
3. Add goals to the plan
4. Log daily progress for today
5. Update plan status → verify history entry created
6. Switch to "All Plans" tab → verify can see team members' plans
7. Filter by department → verify filtering works
8. Login as staff → verify "All Plans" tab not visible or shows only own plans

---

## Critical Files Modified

**Backend:**
- `backend/hr/models.py` - Add quarterly type, new models
- `backend/hr/serializers.py` - New serializers
- `backend/hr/views.py` - New viewsets, update existing
- `backend/hr/urls.py` - New routes
- `backend/hr/admin.py` - Register new models

**Frontend:**
- `frontend/src/services/plans.js` - New API methods
- `frontend/src/components/hr/PlanForm.jsx` - Add quarterly
- `frontend/src/components/hr/PlanDailyTracking.jsx` - NEW
- `frontend/src/components/hr/PlanUpdateHistory.jsx` - NEW
- `frontend/src/pages/hr/PlansPage.jsx` - Major refactor for tabs
- `frontend/src/pages/hr/PlanDetailPage.jsx` - Add new components

---

## Rollback Plan

If issues occur:
1. Revert frontend changes (no data loss)
2. Keep backend models and migrations (data preserved)
3. Can disable new API endpoints by commenting out router registration
4. Database migrations can be rolled back: `python manage.py migrate hr <previous_migration_number>`
