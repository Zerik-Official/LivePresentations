# LivePresentations - Deployment Guide

## What's Been Done

Your project has been fully Dockerized with easy-to-use deployment options. Here's what was created:

### Docker Files Created

1. **apps/backend/Dockerfile** - Multi-stage build for FastAPI backend
   - Optimized Python 3.12 slim image
   - Minimal final image size (~200MB)
   - Health checks included
   - Proper environment variables

2. **apps/frontend/Dockerfile** - Multi-stage build for React frontend
   - Node.js 22 Alpine base
   - Production build with `serve`
   - Optimized for performance (~150MB)
   - Health checks included

3. **docker-compose.yml** - Complete orchestration
   - Backend and frontend services
   - Proper networking
   - Volume management for database persistence
   - Environment variable support
   - Service health checks
   - Automatic startup dependency handling

4. **.dockerignore** - Optimized Docker builds
   - Excludes unnecessary files
   - Reduces build time and image size

### Configuration & Documentation

1. **.env.example** (root) - Centralized environment configuration
   - Backend settings
   - Frontend settings
   - Easy to customize

2. **README.md** (updated) - Complete English documentation
   - Translated to English
   - Fixed backend startup command (no longer requires running from root)
   - Added Docker quick start section
   - Improved installation instructions
   - Better architecture explanation

3. **DOCKER.md** - Detailed Docker guide
   - Prerequisites
   - Quick start instructions
   - Environment variables reference
   - Common commands
   - Production deployment tips
   - Troubleshooting guide

### Helper Scripts

1. **Makefile** - For Linux/macOS users
   ```bash
   make setup       # Initial setup
   make up          # Start services
   make down        # Stop services
   make logs        # View logs
   make clean       # Cleanup
   ```

2. **start.sh** - Bash script for Linux/macOS
   ```bash
   ./start.sh
   ```

3. **start.bat** - Batch script for Windows
   ```bash
   start.bat
   ```

## Quick Start

### Option 1: One-Command Startup (Easiest)

**On Linux/macOS:**
```bash
./start.sh
```

**On Windows:**
```bash
start.bat
```

### Option 2: Docker Compose Directly

```bash
# Copy environment configuration
cp .env.example .env

# Build and run
docker-compose up --build
```

### Option 3: Using Make

```bash
make setup
make up-build
```

## Access Points

Once running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Configuration

Edit `.env` file for custom settings:

```env
SECRET_KEY=your-secure-key-here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENABLE_TURNSTILLE_CAPTCHA=true
TURNSTILE_PUBLIC_KEY=your-key
TURNSTILE_PRIVATE_KEY=your-key
UPLOAD_QUOTA_MB=20
```

## Common Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose stop

# Remove everything
docker-compose down

# Remove with volumes
docker-compose down -v

# Rebuild images
docker-compose up --build
```

## Architecture

```
LivePresentations/
├── docker-compose.yml      # Orchestration
├── .env.example            # Configuration template
├── .dockerignore           # Build optimization
├── Makefile                # Commands for make
├── start.sh                # Linux/macOS startup
├── start.bat               # Windows startup
├── apps/
│   ├── backend/
│   │   ├── Dockerfile      # Backend containerization
│   │   ├── requirements.txt # Python dependencies
│   │   ├── .env.example    # Backend config
│   │   └── app/            # FastAPI application
│   └── frontend/
│       ├── Dockerfile      # Frontend containerization
│       ├── package.json    # Node dependencies
│       ├── .env.example    # Frontend config
│       └── src/            # React application
└── README.md               # English documentation
```

## Troubleshooting

### Backend won't start
```bash
docker-compose logs backend
# Check SECRET_KEY and database permissions
```

### Frontend shows "Cannot connect to backend"
```bash
# Verify backend is running
docker-compose logs backend

# Check VITE_BACKEND_URL environment variable
docker-compose logs frontend
```

### Ports already in use
Edit `docker-compose.yml` and change ports:
```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Changed from 8000
  frontend:
    ports:
      - "5174:5173"  # Changed from 5173
```

### Clean start (remove everything)
```bash
docker-compose down -v
docker-compose up --build
```

## Further Documentation

- See [DOCKER.md](DOCKER.md) for detailed Docker information
- See [README.md](../README.md) for development setup and features
- See [.env.example](../.env.example) for all configuration options

## Key Improvements Made

1. **Single Docker Compose file** - One command to run everything
2. **Fixed backend command** - No longer requires running from root with --app-dir
3. **Multi-stage builds** - Optimized image sizes
4. **Health checks** - Automatic service verification
5. **Environment configuration** - Centralized .env management
6. **Documentation in English** - Complete English README
7. **Helper scripts** - Easy startup for Windows, Linux, and macOS
8. **Production ready** - Includes deployment best practices

## Next Steps

1. **For Development:**
   - `./start.sh` or `start.bat` to begin
   - Edit `.env` for custom configuration
   - Services auto-restart on code changes

2. **For Production:**
   - Set strong `SECRET_KEY`
   - Configure `CORS_ORIGINS` properly
   - Enable and configure Turnstile CAPTCHA
   - Use a reverse proxy (nginx/caddy)
   - Set up proper monitoring