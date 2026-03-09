#!/bin/bash

# WorkHub Deployment Script
# This script helps deploy WorkHub to production

set -e

echo "================================================"
echo "WorkHub Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it"
    echo "  cp .env.example .env"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Function to setup SSL
setup_ssl() {
    echo "================================================"
    echo "Setting up SSL Certificate"
    echo "================================================"

    read -p "Enter your domain (e.g., workhub.scms.it.com): " DOMAIN
    read -p "Enter your email for SSL certificate: " EMAIL

    # Create temporary nginx config without SSL
    echo "Creating temporary nginx config..."
    cat > nginx/conf.d/workhub-temp.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

    # Start nginx and certbot
    echo "Starting nginx..."
    docker-compose up -d nginx certbot

    # Wait for nginx to start
    sleep 5

    # Obtain SSL certificate
    echo "Obtaining SSL certificate..."
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email ${EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN}

    # Remove temporary config
    rm nginx/conf.d/workhub-temp.conf

    # Restart nginx with full config
    docker-compose restart nginx

    echo -e "${GREEN}✓ SSL certificate obtained successfully${NC}"
}

# Main deployment options
echo "Select deployment option:"
echo "1) First time deployment (with SSL setup)"
echo "2) Deploy/Update application"
echo "3) Setup SSL only"
echo "4) View logs"
echo "5) Stop all services"
echo "6) Restart services"
echo ""
read -p "Enter option (1-6): " option

case $option in
    1)
        echo "Starting first time deployment..."

        # Build and start services
        echo "Building Docker images..."
        docker-compose build

        echo "Starting database and redis..."
        docker-compose up -d db redis

        # Wait for database to be ready
        echo "Waiting for database to be ready..."
        sleep 10

        # Setup SSL
        setup_ssl

        # Start all services
        echo "Starting all services..."
        docker-compose up -d

        # Run migrations
        echo "Running database migrations..."
        docker-compose exec backend python manage.py migrate

        # Create superuser
        echo ""
        echo "Create Django superuser:"
        docker-compose exec backend python manage.py createsuperuser

        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo "Your application is now running at:"
        echo "  https://workhub.scms.it.com"
        echo ""
        echo "Admin panel: https://workhub.scms.it.com/admin"
        ;;

    2)
        echo "Deploying/Updating application..."

        # Pull latest changes if using git
        if [ -d .git ]; then
            echo "Pulling latest changes..."
            git pull
        fi

        # Rebuild and restart
        docker-compose down
        docker-compose build
        docker-compose up -d

        # Run migrations
        docker-compose exec backend python manage.py migrate

        # Collect static files
        docker-compose exec backend python manage.py collectstatic --noinput

        echo -e "${GREEN}✓ Application updated successfully${NC}"
        ;;

    3)
        setup_ssl
        ;;

    4)
        echo "Viewing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;

    5)
        echo "Stopping all services..."
        docker-compose down
        echo -e "${GREEN}✓ All services stopped${NC}"
        ;;

    6)
        echo "Restarting services..."
        docker-compose restart
        echo -e "${GREEN}✓ Services restarted${NC}"
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
