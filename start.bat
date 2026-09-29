@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo LivePresentations - Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    set DOCKER_INSTALLED=0
) else (
    set DOCKER_INSTALLED=1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    set DOCKER_COMPOSE_INSTALLED=0
) else (
    set DOCKER_COMPOSE_INSTALLED=1
)

if !DOCKER_INSTALLED! equ 1 if !DOCKER_COMPOSE_INSTALLED! equ 1 (
    echo [OK] Docker found
    echo [OK] Docker Compose found
    echo.
    echo How do you want to run LivePresentations?
    echo.
    echo   1) Docker (Recommended - easier setup)
    echo   2) Manual setup (Frontend + Backend locally)
    echo.

    set /p CHOICE="Enter your choice (1 or 2): "

    if "!CHOICE!"=="1" (
        set RUN_DOCKER=1
    ) else if "!CHOICE!"=="2" (
        set RUN_DOCKER=0
    ) else (
        echo Invalid choice. Exiting.
        exit /b 1
    )
) else (
    echo Docker or Docker Compose not found.
    echo.
    echo You have two options:
    echo   1) Install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo   2) Run the project manually (see instructions below)
    echo.

    set /p PROCEED="Do you want to proceed with manual setup? (y/n): "

    if /i "!PROCEED!"=="y" (
        set RUN_DOCKER=0
    ) else (
        exit /b 0
    )
)

echo.

if !RUN_DOCKER! equ 1 (
    REM Docker setup
    echo Setting up environment files...
    echo.

    if not exist ".env" (
        copy .env.example .env
        echo [OK] .env created
    ) else (
        echo [OK] .env already exists
    )

    if not exist "apps\backend\.env" (
        copy apps\backend\.env.example apps\backend\.env
        echo [OK] apps\backend\.env created
    ) else (
        echo [OK] apps\backend\.env already exists
    )

    if not exist "apps\frontend\.env" (
        copy apps\frontend\.env.example apps\frontend\.env
        echo [OK] apps\frontend\.env created
    ) else (
        echo [OK] apps\frontend\.env already exists
    )

    echo.
    echo Building and starting services...
    echo.

    REM Build and start services
    docker-compose up --build

    echo.
    echo ========================================
    echo LivePresentations is running!
    echo ========================================
    echo.
    echo Frontend: http://localhost:5173
    echo Backend:  http://localhost:8000
    echo API Docs: http://localhost:8000/docs
    echo.
    echo Press Ctrl+C to stop services
) else (
    REM Manual setup
    echo Manual Setup Instructions
    echo.
    echo For more details, see docs\SETUP_COMPLETE.md
    echo.
    echo Prerequisites:
    echo   - Node.js 18+ (npm)
    echo   - Python 3.10+ (python)
    echo.

    echo Step 1: Setup Backend
    echo.
    echo   cd apps\backend
    echo.
    echo   REM Create virtual environment
    echo   python -m venv venv
    echo   venv\Scripts\activate
    echo.
    echo   REM Install dependencies
    echo   pip install -r requirements.txt
    echo.
    echo   REM Setup environment
    echo   copy .env.example .env
    echo.
    echo   REM Run backend
    echo   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    echo.

    echo Step 2: Setup Frontend (in another terminal)
    echo.
    echo   cd apps\frontend
    echo   npm install
    echo   npm run dev -- --host
    echo.

    echo Access the application:
    echo.
    echo   Frontend: http://localhost:5173
    echo   Backend:  http://localhost:8000
    echo   API Docs: http://localhost:8000/docs
    echo.
    echo Note: Keep both backend and frontend terminals running
    echo.
)
