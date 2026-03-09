# Quick Deploy Guide - WorkHub

## Các bước deploy nhanh lên DigitalOcean

### 1. Chuẩn bị Server (5 phút)

```bash
# SSH vào server
ssh root@YOUR_SERVER_IP

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# Cài Docker Compose
apt install docker-compose git -y

# Setup firewall
apt install ufw -y
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 2. Upload Code lên Server

**Option A: Sử dụng Git**
```bash
cd /var/www
git clone YOUR_REPOSITORY_URL workhub
cd workhub
```

**Option B: Upload từ máy local**
```bash
# Trên máy local
scp -r staff-management root@YOUR_SERVER_IP:/var/www/workhub
```

### 3. Cấu hình Environment

```bash
cd /var/www/workhub

# Copy và chỉnh sửa .env
cp .env.example .env
nano .env
```

Thay đổi các giá trị sau:
```env
SECRET_KEY=abc123xyz789...  # Generate: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
DB_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password
ALLOWED_HOSTS=workhub.scms.it.com
```

Copy sang backend:
```bash
cp .env backend/.env
```

### 4. Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Chọn **Option 1** (First time deployment):
- Nhập domain: `workhub.scms.it.com`
- Nhập email của bạn
- Tạo Django admin user khi được hỏi

### 5. Hoàn tất!

Truy cập:
- Website: https://workhub.scms.it.com
- Admin: https://workhub.scms.it.com/admin

---

## Commands thường dùng

```bash
# Xem logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop all
docker-compose down

# Update code và deploy lại
git pull
./deploy.sh  # Chọn option 2

# Backup database
docker-compose exec db pg_dump -U postgres workhub > backup.sql

# Django management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell
```

---

## Troubleshooting nhanh

**Lỗi 502 Bad Gateway:**
```bash
docker-compose logs backend
docker-compose restart backend
```

**Database lỗi:**
```bash
docker-compose logs db
docker-compose restart db
```

**SSL lỗi:**
```bash
# Check domain đã trỏ đúng IP chưa
nslookup workhub.scms.it.com

# Renew certificate
docker-compose run --rm certbot renew
docker-compose restart nginx
```

**Check services status:**
```bash
docker-compose ps
```
