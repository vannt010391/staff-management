# WorkHub Deployment Guide - DigitalOcean + Docker + HTTPS

Hướng dẫn deploy WorkHub lên DigitalOcean với Docker và SSL certificate.

## Yêu cầu

- Server Ubuntu 24.04 trên DigitalOcean
- Domain: workhub.scms.it.com đã trỏ về IP server
- Docker và Docker Compose đã cài đặt

## 1. Chuẩn bị Server

### 1.1. Tạo Droplet trên DigitalOcean

1. Tạo Droplet Ubuntu 24.04
2. Chọn cấu hình tối thiểu: 2GB RAM, 1 CPU
3. Lưu lại IP address

### 1.2. Trỏ Domain về Server

Thêm DNS A record:
```
Type: A
Name: workhub.scms.it.com
Value: YOUR_SERVER_IP
```

### 1.3. SSH vào Server

```bash
ssh root@YOUR_SERVER_IP
```

### 1.4. Cài đặt Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 1.5. Cài đặt các công cụ cần thiết

```bash
apt install git ufw -y

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 2. Deploy Application

### 2.1. Clone Project

```bash
# Create directory
mkdir -p /var/www
cd /var/www

# Clone your repository (hoặc upload code lên server)
git clone YOUR_REPOSITORY_URL workhub
cd workhub
```

### 2.2. Cấu hình Environment Variables

```bash
# Copy và chỉnh sửa file .env
cp .env.example .env
nano .env
```

Cấu hình các giá trị sau trong `.env`:

```env
# Django Settings
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here
ALLOWED_HOSTS=workhub.scms.it.com

# Database
DB_NAME=workhub
DB_USER=postgres
DB_PASSWORD=your-strong-database-password-here

# Redis
REDIS_PASSWORD=your-strong-redis-password-here

# CORS
CORS_ALLOWED_ORIGINS=https://workhub.scms.it.com
```

**Quan trọng:**
- Tạo `SECRET_KEY` mạnh: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`
- Đặt mật khẩu mạnh cho database và redis
- Không commit file `.env` vào git

### 2.3. Copy backend .env

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Sử dụng cùng thông tin như file `.env` ở root.

### 2.4. Chạy Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Chọn option **1** (First time deployment) và làm theo hướng dẫn:
1. Nhập domain: `workhub.scms.it.com`
2. Nhập email để nhận thông báo SSL
3. Tạo Django superuser khi được yêu cầu

## 3. Kiểm tra Deployment

### 3.1. Kiểm tra Services đang chạy

```bash
docker-compose ps
```

Tất cả services phải có status `Up`.

### 3.2. Xem Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### 3.3. Truy cập Application

- Frontend: https://workhub.scms.it.com
- Admin: https://workhub.scms.it.com/admin
- API: https://workhub.scms.it.com/api

## 4. Quản lý Application

### 4.1. Update Code

```bash
cd /var/www/workhub
./deploy.sh
# Chọn option 2 (Deploy/Update application)
```

### 4.2. Restart Services

```bash
./deploy.sh
# Chọn option 6 (Restart services)
```

Hoặc:
```bash
docker-compose restart
```

### 4.3. Stop Services

```bash
./deploy.sh
# Chọn option 5 (Stop all services)
```

### 4.4. Database Backup

```bash
# Backup
docker-compose exec db pg_dump -U postgres workhub > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker-compose exec -T db psql -U postgres workhub < backup_file.sql
```

### 4.5. Django Commands

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Django shell
docker-compose exec backend python manage.py shell
```

## 5. SSL Certificate

### 5.1. SSL được tự động renew

Certbot container sẽ tự động renew certificate mỗi 12 giờ.

### 5.2. Manual Renew

```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### 5.3. Check SSL Certificate

```bash
docker-compose run --rm certbot certificates
```

## 6. Monitoring và Troubleshooting

### 6.1. Check Resource Usage

```bash
docker stats
```

### 6.2. Check Disk Space

```bash
df -h
docker system df
```

### 6.3. Clean up unused Docker resources

```bash
docker system prune -a
```

### 6.4. Common Issues

**Issue: Database connection failed**
```bash
# Check database is running
docker-compose ps db
# Check logs
docker-compose logs db
# Restart database
docker-compose restart db
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check backend is running
docker-compose ps backend
# Check backend logs
docker-compose logs backend
# Restart backend
docker-compose restart backend
```

**Issue: SSL certificate failed**
```bash
# Check domain DNS
nslookup workhub.scms.it.com

# Check port 80 is open
curl http://workhub.scms.it.com/.well-known/acme-challenge/

# Try manual certificate
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d workhub.scms.it.com
```

## 7. Security Best Practices

1. **Thay đổi mật khẩu mặc định**
   - Database password
   - Redis password
   - Django SECRET_KEY
   - Admin user password

2. **Backup thường xuyên**
   - Database
   - Media files
   - Environment files

3. **Update thường xuyên**
   ```bash
   apt update && apt upgrade -y
   docker-compose pull
   ```

4. **Monitor logs**
   - Check application logs thường xuyên
   - Setup log rotation
   - Monitor failed login attempts

5. **Firewall**
   - Chỉ mở các port cần thiết (22, 80, 443)
   - Sử dụng SSH key thay vì password
   - Disable root SSH login

## 8. Performance Optimization

### 8.1. Increase Gunicorn Workers

Trong `docker-compose.yml`, chỉnh số workers:
```yaml
command: gunicorn --bind 0.0.0.0:8000 --workers 4 --timeout 120 config.wsgi:application
```

Workers = (2 x CPU cores) + 1

### 8.2. Database Optimization

```bash
# Access PostgreSQL
docker-compose exec db psql -U postgres workhub

# Run VACUUM
VACUUM ANALYZE;
```

### 8.3. Redis Memory Limit

Thêm vào `docker-compose.yml`:
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
```

## 9. Backup và Recovery

### 9.1. Automated Backup Script

Tạo file `/var/www/workhub/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/workhub"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U postgres workhub > $BACKUP_DIR/db_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz -C backend media/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Setup cron job:
```bash
crontab -e
# Add this line (backup daily at 2 AM)
0 2 * * * /var/www/workhub/backup.sh
```

## 10. Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose logs -f`
2. Check services status: `docker-compose ps`
3. Check system resources: `htop`, `df -h`
4. Review this guide carefully

---

**Chúc bạn deploy thành công!** 🚀
