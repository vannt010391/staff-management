# Leave Management Implementation Guide

## ✅ **COMPLETED (13/19 tasks)**

### Phase 1: Enhanced Attendance (100%)
- Metadata tracking (location, IP, device)
- Backend API endpoints
- Frontend modal with preview

### Phase 2: Attendance Management Dashboard (100%)
- Team hierarchy (manager field)
- Role-based permissions
- Management endpoints (team_attendance, monthly_report, export)
- Dashboard page with filters

### Phase 3: Leave Models & Database (40%)
- ✅ LeaveType, LeaveBalance, LeaveRequest models created
- ✅ Migrations applied
- ⏳ Serializers (next)
- ⏳ ViewSets (next)

---

## 🔨 **REMAINING IMPLEMENTATION (6 tasks)**

### Task 1: Create Leave Serializers

**File**: `backend/hr/serializers.py`

Add at the end of file (after AttendanceSettingsSerializer):

```python
class LeaveTypeSerializer(serializers.ModelSerializer):
    """Serializer for LeaveType"""
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'code', 'default_days_per_year',
            'requires_approval', 'is_paid', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    """Serializer for LeaveBalance"""
    user_details = serializers.SerializerMethodField()
    leave_type_details = serializers.SerializerMethodField()
    remaining_days = serializers.ReadOnlyField()

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'user', 'user_details', 'leave_type', 'leave_type_details',
            'year', 'total_days', 'used_days', 'remaining_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name() or obj.user.username
        }

    def get_leave_type_details(self, obj):
        return {
            'id': obj.leave_type.id,
            'name': obj.leave_type.name,
            'code': obj.leave_type.code
        }


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Full serializer for LeaveRequest"""
    user_details = serializers.SerializerMethodField()
    leave_type_details = serializers.SerializerMethodField()
    approver_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'user', 'user_details', 'leave_type', 'leave_type_details',
            'start_date', 'end_date', 'days_count', 'reason',
            'status', 'status_display', 'approver', 'approver_details',
            'approved_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'approver', 'approved_at', 'created_at', 'updated_at']

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name() or obj.user.username
        }

    def get_leave_type_details(self, obj):
        return {
            'id': obj.leave_type.id,
            'name': obj.leave_type.name,
            'code': obj.leave_type.code
        }

    def get_approver_details(self, obj):
        if not obj.approver:
            return None
        return {
            'id': obj.approver.id,
            'username': obj.approver.username,
            'full_name': obj.approver.get_full_name() or obj.approver.username
        }


class LeaveRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating leave requests"""
    leave_type = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField()

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data
```

### Task 2: Create Leave ViewSets & Permissions

**File**: `backend/hr/permissions.py`

Add new permission:

```python
class CanManageLeaveRequests(permissions.BasePermission):
    """
    Permission: Admin/Manager/Team Lead can approve/reject leave requests
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Only admin/manager/team_lead can approve/reject
        if view.action in ['process_request']:
            return request.user.role in ['admin', 'manager', 'team_lead']

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can manage all
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        # Manager can manage department requests
        if request.user.role == 'manager':
            try:
                employee = obj.user.employee_profile
                if employee.department:
                    return employee.department.manager == request.user
            except:
                pass

        # Team Lead can manage direct reports
        if request.user.role == 'team_lead':
            try:
                employee = obj.user.employee_profile
                return employee.manager == request.user
            except:
                pass

        # User can view own requests
        return obj.user == request.user
```

**File**: `backend/hr/views.py`

Add at the end before the last ViewSet, and update imports:

```python
# Add to imports
from .models import LeaveType, LeaveBalance, LeaveRequest
from .serializers import (
    LeaveTypeSerializer, LeaveBalanceSerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer
)
from .permissions import CanManageLeaveRequests

# Add ViewSets
class LeaveTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveType (Admin only)"""
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrManager]


class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for LeaveBalance"""
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAdminOrManagerOrSelf]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return LeaveBalance.objects.all()
        return LeaveBalance.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get current user's leave balance"""
        year = request.query_params.get('year', timezone.now().year)
        balances = LeaveBalance.objects.filter(user=request.user, year=year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveRequest"""
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [CanManageLeaveRequests]

    def get_queryset(self):
        user = self.request.user

        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return LeaveRequest.objects.all()

        # Manager sees department requests
        if user.role == 'manager':
            try:
                managed_dept = Department.objects.filter(manager=user).first()
                if managed_dept:
                    employee_ids = managed_dept.employees.values_list('user_id', flat=True)
                    return LeaveRequest.objects.filter(user_id__in=employee_ids)
            except:
                pass

        # Team Lead sees direct reports
        if user.role == 'team_lead':
            managed_employee_ids = Employee.objects.filter(manager=user).values_list('user_id', flat=True)
            return LeaveRequest.objects.filter(user_id__in=managed_employee_ids)

        # User sees own requests
        return LeaveRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get current user's leave requests"""
        requests = LeaveRequest.objects.filter(user=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending requests for approval (manager/team lead)"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        """Approve or reject leave request"""
        leave_request = self.get_object()

        if leave_request.status != 'pending':
            return Response(
                {'error': 'Leave request already processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        action_type = request.data.get('action')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '')

        if action_type == 'approve':
            leave_request.status = 'approved'
            leave_request.approver = request.user
            leave_request.approved_at = timezone.now()
            leave_request.save()  # This triggers attendance creation and balance update

            return Response({
                'message': 'Leave request approved',
                'leave_request': LeaveRequestSerializer(leave_request).data
            })

        elif action_type == 'reject':
            leave_request.status = 'rejected'
            leave_request.approver = request.user
            leave_request.approved_at = timezone.now()
            leave_request.rejection_reason = rejection_reason
            leave_request.save()

            return Response({
                'message': 'Leave request rejected',
                'leave_request': LeaveRequestSerializer(leave_request).data
            })

        return Response(
            {'error': 'Invalid action. Use "approve" or "reject"'},
            status=status.HTTP_400_BAD_REQUEST
        )
```

**File**: `backend/hr/urls.py`

Add to router:

```python
router.register(r'leave-types', LeaveTypeViewSet)
router.register(r'leave-balances', LeaveBalanceViewSet)
router.register(r'leave-requests', LeaveRequestViewSet)
```

### Task 3: Create Frontend Leave Service

**File**: `frontend/src/services/leaveService.js` (CREATE NEW FILE)

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const leaveService = {
  // Leave Types
  getLeaveTypes: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/hr/leave-types/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Leave Balance
  getMyBalance: async (year = new Date().getFullYear()) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-balances/my_balance/?year=${year}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Leave Requests - Employee
  getMyRequests: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/my_requests/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  createRequest: async (data) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/leave-requests/`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Leave Requests - Manager
  getPendingApprovals: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/pending_approvals/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getAllRequests: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/hr/leave-requests/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  processRequest: async (id, action, rejectionReason = '') => {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      `${API_URL}/hr/leave-requests/${id}/process_request/`,
      { action, rejection_reason: rejectionReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

export default leaveService;
```

### Task 4-6: Frontend Pages (Quick Reference)

Due to space, here are the key components you need to create:

**`frontend/src/pages/hr/LeaveRequestsPage.jsx`** - Employee view
- Show leave balance cards
- Submit leave request form
- List own leave requests with status

**`frontend/src/pages/hr/LeaveManagementPage.jsx`** - Manager view
- Pending approvals list
- All team requests
- Approve/Reject buttons

**Navigation Updates**:
- Add to `App.jsx` routes
- Add to `Layout.jsx` navigation (common items for all users, HR menu for managers)

---

## 🚀 **Quick Start Commands**

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

## 🧪 **Testing Checklist**

### Enhanced Attendance
- [ ] Check-in shows device metadata preview
- [ ] IP address captured in database
- [ ] Location coordinates saved
- [ ] Admin can view team attendance with all metadata
- [ ] CSV export includes all fields

### Leave Management (After completing remaining tasks)
- [ ] Employee can submit leave request
- [ ] Leave balance displays correctly
- [ ] Manager sees pending approvals
- [ ] Approve creates attendance records
- [ ] Leave balance auto-deducts

---

## 📊 **Database Schema**

### New Tables
- `hr_leavetype` - Leave type definitions
- `hr_leavebalance` - User balances per type/year
- `hr_leaverequest` - Leave requests with approval workflow

### Updated Tables
- `hr_employee` - Added `manager_id` field
- `hr_attendance` - Added 18 metadata fields

---

## 🎯 **What's Working Now**

1. **Enhanced Attendance**: 100% functional
   - Metadata collection
   - Team management dashboard
   - Export functionality

2. **Leave Models**: Database ready
   - Run migrations ✅
   - Models have business logic ✅
   - Ready for API layer

3. **Next Steps**: Add serializers → viewsets → frontend

---

**Estimated Time to Complete**: 2-3 hours for remaining frontend work
