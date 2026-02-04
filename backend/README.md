# Freelancer Management System - Backend

Hệ thống quản lý công việc cho freelancer trong lĩnh vực thiết kế bài giảng PowerPoint và Storyline.

## Công nghệ sử dụng

- **Django 5.0.1** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Django Channels** - WebSocket (Real-time notifications)
- **Redis** - Channel layer backend
- **drf-yasg** - API documentation (Swagger/ReDoc)

## Tính năng đã implement

### ✅ Phase 1: Authentication & User Management (HOÀN THÀNH)
- Custom User model với 3 roles: Admin, Manager, Freelancer
- JWT Authentication (Login, Logout, Refresh Token)
- User Registration (Admin only)
- User Profile Management
- Change Password
- User CRUD APIs (Admin only)
- Role-based permissions

### ✅ Models đã implement (HOÀN THÀNH)
1. **User Model** - Quản lý người dùng với roles
2. **Project Model** - Quản lý dự án
3. **Topic Model** - Quản lý chủ đề trong dự án
4. **DesignRule Model** - Quy tắc thiết kế cho dự án
5. **Task Model** - Quản lý công việc với giá
6. **TaskFile Model** - Files đính kèm
7. **TaskComment Model** - Comments và replies
8. **TaskReview Model** - Review công việc
9. **ReviewCriteria Model** - Chi tiết review theo quy tắc
10. **Notification Model** - Thông báo người dùng

### Django Admin
- Đã cấu hình admin interface cho tất cả models
- Inline editing cho related models
- Filters, search, và pagination
- Custom admin actions

## Cấu trúc dự án

```
backend/
├── config/              # Django project settings
│   ├── settings.py     # Đã cấu hình: DB, JWT, CORS, Channels
│   ├── urls.py         # Main URLs với Swagger
│   ├── asgi.py         # ASGI config cho Channels
│   └── routing.py      # WebSocket routing
├── accounts/           # User & Authentication
│   ├── models.py       # Custom User model
│   ├── serializers.py  # Auth serializers
│   ├── views.py        # Auth APIs
│   ├── permissions.py  # Custom permissions
│   └── urls.py         # Auth endpoints
├── projects/           # Project, Topic, DesignRule
│   ├── models.py
│   └── admin.py
├── tasks/              # Task, TaskFile, TaskComment
│   ├── models.py
│   └── admin.py
├── reviews/            # TaskReview, ReviewCriteria
│   ├── models.py
│   └── admin.py
├── notifications/      # Notification
│   ├── models.py
│   └── admin.py
├── analytics/          # Analytics (sẽ implement sau)
├── requirements.txt    # Python packages
├── .env               # Environment variables
├── .env.example       # Environment template
└── manage.py
```

## Setup Instructions

### 1. Cài đặt PostgreSQL

**Windows:**
- Download PostgreSQL từ https://www.postgresql.org/download/windows/
- Cài đặt và ghi nhớ password của user `postgres`
- Mở pgAdmin hoặc psql

**Tạo database:**
```sql
CREATE DATABASE freelancer_management;
```

### 2. Cài đặt Redis (cho WebSocket)

**Windows:**
- Download Redis từ https://github.com/microsoftarchive/redis/releases
- Cài đặt và chạy Redis server
- Hoặc sử dụng Docker:
```bash
docker run -d -p 6379:6379 redis
```

### 3. Cấu hình Environment Variables

Sao chép file `.env.example` thành `.env` và cập nhật:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_NAME=freelancer_management
DATABASE_USER=postgres
DATABASE_PASSWORD=your-postgres-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Cài đặt Python Packages

```bash
cd backend
pip install -r requirements.txt
```

### 5. Chạy Migrations

```bash
python manage.py migrate
```

### 6. Tạo Superuser

```bash
python manage.py createsuperuser
```

Nhập thông tin:
- Username
- Email
- Password

### 7. Chạy Development Server

```bash
python manage.py runserver
```

Server sẽ chạy tại: http://127.0.0.1:8000

## API Documentation

Sau khi chạy server, truy cập:

- **Swagger UI**: http://127.0.0.1:8000/swagger/
- **ReDoc**: http://127.0.0.1:8000/redoc/
- **Django Admin**: http://127.0.0.1:8000/admin/

## API Endpoints (Đã implement)

### Authentication
- `POST /api/auth/register/` - Register user (Admin only)
- `POST /api/auth/login/` - Login và nhận JWT tokens
- `POST /api/auth/logout/` - Logout (blacklist refresh token)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info
- `PUT /api/auth/profile/` - Update profile
- `POST /api/auth/change-password/` - Change password

### Users (Admin only)
- `GET /api/users/` - List users
- `GET /api/users/{id}/` - User detail
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `POST /api/users/{id}/toggle-active/` - Activate/deactivate user

## Testing APIs

### 1. Login để lấy Token

```bash
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    ...
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### 2. Sử dụng Token cho các requests khác

Thêm header:
```
Authorization: Bearer {access_token}
```

### 3. Test với Swagger UI

1. Mở http://127.0.0.1:8000/swagger/
2. Click "Authorize" button
3. Nhập: `Bearer {access_token}`
4. Test các endpoints

## Privacy Rule Implementation

**Quan trọng**: Freelancer chỉ thấy tasks của mình

Implemented trong Task ViewSet:
```python
def get_queryset(self):
    if self.request.user.role == 'freelancer':
        return Task.objects.filter(assigned_to=self.request.user)
    elif self.request.user.role in ['manager', 'admin']:
        return Task.objects.all()
```

## Các bước tiếp theo (TODO)

### Backend
1. ✅ Implement serializers và views cho Projects app
2. ✅ Implement serializers và views cho Tasks app
3. ✅ Implement serializers và views cho Reviews app
4. ✅ Implement serializers và views cho Notifications app
5. ⏳ Implement Analytics/Dashboard APIs
6. ⏳ Implement WebSocket Consumer cho real-time notifications
7. ⏳ Write unit tests

### Frontend (Chưa bắt đầu)
1. ⏳ Setup React + Vite project
2. ⏳ Implement Authentication pages
3. ⏳ Implement Dashboard (role-based)
4. ⏳ Implement Projects management
5. ⏳ Implement Tasks management
6. ⏳ Implement Review system
7. ⏳ Implement Real-time notifications
8. ⏳ Implement File upload/download
9. ⏳ Implement Comments/Chat

## Troubleshooting

### Database connection error
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin database trong `.env`
- Kiểm tra database đã được tạo

### Redis connection error
- Kiểm tra Redis server đang chạy
- Kiểm tra `REDIS_HOST` và `REDIS_PORT` trong `.env`

### Migration errors
- Xóa database và tạo lại
- Xóa các migration files và chạy `makemigrations` lại
- Kiểm tra import statements trong models

## Notes

- **Security**: Đổi `SECRET_KEY` trong production
- **Database**: Backup database thường xuyên
- **Media Files**: Cấu hình S3 cho production
- **Redis**: Sử dụng Redis Cloud cho production
- **CORS**: Update `CORS_ALLOWED_ORIGINS` cho production domain

## Contact & Support

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Console logs
2. Django logs
3. PostgreSQL logs
4. Redis logs
