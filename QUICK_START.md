# 🚀 Quick Start Guide

## ✅ Hệ Thống Đã Chạy!

### Servers Running:
- **Frontend**: http://localhost:5173/
- **Backend**: http://localhost:8000/
- **API Docs**: http://localhost:8000/swagger/
- **Admin**: http://localhost:8000/admin/

### Login Credentials:
```
Username: admin
Password: admin123
```

## 🎯 Test Flow

### 1. Test Frontend Login
1. Mở trình duyệt: http://localhost:5173/
2. Sẽ redirect to `/login` (vì chưa login)
3. Nhập credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click "Sign in"
5. Sẽ redirect to Dashboard
6. Xem sidebar menu và user info ở góc trên

### 2. Test Backend API
1. Mở: http://localhost:8000/swagger/
2. Click "Authorize" button
3. Login để lấy token:
   - Expand `POST /api/auth/login/`
   - Click "Try it out"
   - Body:
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Execute
   - Copy `access` token from response
4. Click "Authorize" again
5. Paste: `Bearer {your_access_token}`
6. Test các endpoints khác

### 3. Test Django Admin
1. Mở: http://localhost:8000/admin/
2. Login với:
   - Username: `admin`
   - Password: `admin123`
3. Browse các models:
   - Users
   - Projects
   - Tasks
   - Reviews
   - Notifications

## 📊 Create Test Data

### Option 1: Via Django Admin
1. Go to http://localhost:8000/admin/
2. Create:
   - 2-3 Users (1 manager, 2 freelancers)
   - 1-2 Projects
   - 2-3 Topics per project
   - 3-5 Design Rules per project
   - 5-10 Tasks (assign to freelancers)

### Option 2: Via Swagger API
1. Go to http://localhost:8000/swagger/
2. Authorize with admin token
3. Use POST endpoints to create:
   - `POST /api/users/` - Create users
   - `POST /api/projects/` - Create projects
   - `POST /api/tasks/` - Create tasks
   - `POST /api/tasks/{id}/assign/` - Assign tasks

## 🧪 Test Privacy Rules

### Create Test Users:
```python
# In backend venv:
cd backend
./venv/Scripts/python manage.py shell

# In shell:
from accounts.models import User

# Create freelancers
freelancer1 = User.objects.create_user(
    username='freelancer1',
    password='pass123',
    role='freelancer',
    email='f1@example.com'
)

freelancer2 = User.objects.create_user(
    username='freelancer2',
    password='pass123',
    role='freelancer',
    email='f2@example.com'
)
```

### Test Flow:
1. **As Admin**: Create 2 tasks
   - Assign Task 1 to freelancer1
   - Assign Task 2 to freelancer2

2. **Login as freelancer1**:
   - Username: `freelancer1`, Password: `pass123`
   - Go to Tasks page
   - Should only see Task 1

3. **Login as freelancer2**:
   - Username: `freelancer2`, Password: `pass123`
   - Go to Tasks page
   - Should only see Task 2

4. **Login as admin**:
   - Should see ALL tasks

## 🛠️ Development Commands

### Backend:
```bash
# Stop server: Ctrl+C in terminal or close window

# Restart server:
cd backend
./venv/Scripts/python manage.py runserver

# Make migrations after model changes:
./venv/Scripts/python manage.py makemigrations
./venv/Scripts/python manage.py migrate

# Create superuser:
./venv/Scripts/python manage.py createsuperuser

# Django shell:
./venv/Scripts/python manage.py shell
```

### Frontend:
```bash
# Stop server: Ctrl+C in terminal

# Restart server:
cd frontend
npm run dev

# Build for production:
npm run build

# Preview production build:
npm run preview
```

## 📁 Project Structure

```
working-management/
├── backend/                    # Django Backend
│   ├── venv/                  # Virtual environment
│   ├── db.sqlite3             # SQLite database (for testing)
│   ├── config/                # Django settings
│   ├── accounts/              # User & Auth
│   ├── projects/              # Projects, Topics, Rules
│   ├── tasks/                 # Tasks (với privacy)
│   ├── reviews/               # Reviews
│   └── notifications/         # Notifications
│
├── frontend/                   # React Frontend
│   ├── node_modules/          # NPM packages
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Pages (Login, Dashboard)
│   │   ├── services/          # API services
│   │   ├── stores/            # Zustand stores
│   │   └── utils/             # Helper functions
│   └── dist/                  # Build output
│
└── QUICK_START.md             # This file
```

## 🔧 Configuration

### Backend (.env):
```env
DEBUG=True
SECRET_KEY=your-secret-key
# Using SQLite for quick testing
# Switch to PostgreSQL in production
```

### Frontend (.env):
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## 🐛 Troubleshooting

### Backend Issues:

**Port 8000 already in use:**
```bash
# Find process:
netstat -ano | findstr :8000

# Kill process (replace PID):
taskkill /PID <PID> /F

# Or use different port:
./venv/Scripts/python manage.py runserver 8001
```

**Migration errors:**
```bash
cd backend
rm db.sqlite3
./venv/Scripts/python manage.py migrate
./venv/Scripts/python manage.py createsuperuser
```

### Frontend Issues:

**Port 5173 already in use:**
- Vite will automatically use next available port (5174, 5175, etc.)

**Module not found:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Tailwind not working:**
```bash
cd frontend
npm run dev
# Hard refresh browser: Ctrl+F5
```

## 📚 Next Steps

### Immediate:
1. ✅ Test login/logout
2. ✅ Browse Dashboard
3. ✅ Test Django Admin
4. ✅ Check API docs

### Development:
1. **Create Test Data** (via Admin or API)
2. **Implement Tasks Page** (priority #1)
   - Create `frontend/src/pages/TasksPage.jsx`
   - List tasks với privacy filter
   - Test với different users

3. **Implement Projects Page**
   - Create/Edit projects
   - Manage topics & design rules

4. **Add More Features**
   - File uploads
   - Comments
   - Reviews
   - Notifications

## 🎨 UI Components to Build

### Tasks Management:
- TasksPage.jsx - List view
- TaskDetailPage.jsx - Detail view
- TaskForm.jsx - Create/Edit form
- TaskCard.jsx - Task card component

### Projects Management:
- ProjectsPage.jsx
- ProjectDetailPage.jsx
- ProjectForm.jsx
- TopicsList.jsx
- DesignRulesList.jsx

### Common Components:
- Modal.jsx
- Button.jsx
- Input.jsx
- Select.jsx
- Table.jsx
- Badge.jsx
- Card.jsx

## 📖 Resources

- Backend README: [backend/README.md](backend/README.md)
- Frontend Summary: [FRONTEND_SUMMARY.md](FRONTEND_SUMMARY.md)
- API Documentation: http://localhost:8000/swagger/
- Django Docs: https://docs.djangoproject.com/
- React Docs: https://react.dev/
- TailwindCSS: https://tailwindcss.com/

## ✨ Features Checklist

### ✅ Implemented:
- [x] Backend API (100%)
  - [x] Authentication & Users
  - [x] Projects, Topics, Design Rules
  - [x] Tasks với Privacy Rules
  - [x] Reviews & Criteria
  - [x] Notifications
  - [x] 40+ API endpoints
  - [x] Django Admin
  - [x] Swagger Documentation

- [x] Frontend Core (40%)
  - [x] React + Vite setup
  - [x] Authentication (Login/Logout)
  - [x] Protected Routes
  - [x] Layout với Sidebar
  - [x] Dashboard
  - [x] API Integration
  - [x] State Management (Zustand)
  - [x] Toast Notifications

### 📋 TODO:
- [ ] Tasks Management Pages
- [ ] Projects Management Pages
- [ ] Users Management Pages
- [ ] Reviews Pages
- [ ] Notifications Features
- [ ] File Upload UI
- [ ] Comments UI
- [ ] Dashboard Statistics
- [ ] Real-time Updates (WebSocket)

## 🎉 Success!

Your Freelancer Management System is now running!

**Frontend**: http://localhost:5173/
**Backend**: http://localhost:8000/swagger/

Happy coding! 🚀
