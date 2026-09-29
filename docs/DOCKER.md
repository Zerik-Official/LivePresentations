# Docker Deployment Guide

This guide explains how to deploy LivePresentations using Docker and Docker Compose.

## Prerequisites

- Docker (v20.10 or higher)
- Docker Compose (v1.29 or higher)

## Quick Start

1. **Clone the repository:**

```bash
git clone https://github.com/Zerik-Official/LivePresentations
cd LivePresentations
```

2. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and update the following variables as needed:
- `SECRET_KEY`: Generate a secure key with `openssl rand -hex 32`
- `TURNSTILE_PUBLIC_KEY` & `TURNSTILE_PRIVATE_KEY`: Add your Cloudflare Turnstile keys (optional)

3. **Build and run the services:**

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Docker Compose Services

### Backend Service
- **Image:** Built from `apps/backend/Dockerfile`
- **Port:** 8000
- **Volume:** `./apps/backend/instance` for SQLite database persistence
- **Health Check:** Validates FastAPI startup

### Frontend Service
- **Image:** Built from `apps/frontend/Dockerfile`
- **Port:** 5173
- **Dependency:** Waits for backend to be healthy before starting
- **Health Check:** Validates HTTP connectivity

## Environment Variables

All environment variables are configurable via `.env` file:

```env
# Backend
SECRET_KEY=your-secure-key-here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENABLE_TURNSTILLE_CAPTCHA=true
TURNSTILE_PUBLIC_KEY=your-public-key
TURNSTILE_PRIVATE_KEY=your-private-key
UPLOAD_QUOTA_MB=20

# Frontend
VITE_BACKEND_URL=http://backend:8000
VITE_TURNSTILE_PUBLIC_KEY=your-public-key
```

## Common Commands

### Start services in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services
```bash
docker-compose stop
```

### Remove containers and networks
```bash
docker-compose down
```

Remove with volumes:
```bash
docker-compose down -v
```

### Rebuild images
```bash
docker-compose up --build
```

### Rebuild specific service
```bash
docker-compose build backend
docker-compose build frontend
```

## Production Deployment

For production deployments:

1. **Generate a strong SECRET_KEY:**
```bash
openssl rand -hex 32
```

2. **Configure CORS properly:**
Update `CORS_ORIGINS` with your actual domain(s).

3. **Enable CAPTCHA (recommended):**
Get keys from [Cloudflare Turnstile](https://dash.cloudflare.com/login) and add them to `.env`.

4. **Use a reverse proxy (nginx/caddy):**
Place a reverse proxy in front of your containers for SSL/TLS termination and load balancing.

Example nginx configuration:
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:5173;
}

server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://backend/;
    }

    location / {
        proxy_pass http://frontend;
    }
}
```

5. **Database persistence:**
Ensure the `instance` volume is properly mounted and backed up.

## Troubleshooting

### Backend won't start
Check logs:
```bash
docker-compose logs backend
```

Common issues:
- Invalid `SECRET_KEY` format
- Database file permissions
- Port 8000 already in use

### Frontend shows "Cannot connect to backend"
1. Verify backend is running: `docker-compose logs backend`
2. Check `VITE_BACKEND_URL` is set correctly
3. Verify network connectivity between containers

### Port already in use
Change port mappings in `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Changed from 8000 to 8001
  frontend:
    ports:
      - "5174:5173"  # Changed from 5173 to 5174
```

### Database not persisting
Ensure the volume is properly mounted in `docker-compose.yml`:
```yaml
services:
  backend:
    volumes:
      - ./apps/backend/instance:/app/instance
```

## Performance Optimization

### Multi-stage builds
Both Dockerfiles use multi-stage builds to minimize image size:
- Backend image: ~200MB
- Frontend image: ~150MB

### Health checks
Services include health checks to ensure proper startup sequencing and detect failures.

### Resource limits (optional)
Add to `docker-compose.yml` services:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## Development with Docker

For development, you can use volume mounts for hot-reloading:

```yaml
services:
  backend:
    volumes:
      - ./apps/backend:/app
  frontend:
    environment:
      - VITE_HMR_HOST=localhost
```

This allows you to edit code and see changes without rebuilding images.

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/Zerik-Official/LivePresentations/issues).