#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}LivePresentations - Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Docker is installed
DOCKER_INSTALLED=true
if ! command -v docker &> /dev/null; then
    DOCKER_INSTALLED=false
fi

# Check if Docker Compose is installed
DOCKER_COMPOSE_INSTALLED=true
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_INSTALLED=false
fi

if [ "$DOCKER_INSTALLED" = true ] && [ "$DOCKER_COMPOSE_INSTALLED" = true ]; then
    echo -e "${GREEN}✓${NC} Docker found"
    echo -e "${GREEN}✓${NC} Docker Compose found"
    echo ""
    echo "How do you want to run LivePresentations?"
    echo ""
    echo "  1) Docker (Recommended - easier setup)"
    echo "  2) Manual setup (Frontend + Backend locally)"
    echo ""
    read -p "Enter your choice (1 or 2): " CHOICE

    if [ "$CHOICE" = "1" ]; then
        RUN_DOCKER=true
    elif [ "$CHOICE" = "2" ]; then
        RUN_DOCKER=false
    else
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Docker or Docker Compose not found.${NC}"
    echo ""
    echo "You have two options:"
    echo "  1) Install Docker and Docker Compose from https://www.docker.com/products/docker-desktop"
    echo "  2) Run the project manually (see instructions below)"
    echo ""
    read -p "Do you want to proceed with manual setup? (y/n): " PROCEED

    if [ "$PROCEED" != "y" ] && [ "$PROCEED" != "Y" ]; then
        exit 0
    fi

    RUN_DOCKER=false
fi

echo ""

if [ "$RUN_DOCKER" = true ]; then
    # Docker setup
    echo -e "${YELLOW}Setting up environment files...${NC}"

    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env created"
    else
        echo -e "${GREEN}✓${NC} .env already exists"
    fi

    if [ ! -f apps/backend/.env ]; then
        cp apps/backend/.env.example apps/backend/.env
        echo -e "${GREEN}✓${NC} apps/backend/.env created"
    else
        echo -e "${GREEN}✓${NC} apps/backend/.env already exists"
    fi

    if [ ! -f apps/frontend/.env ]; then
        cp apps/frontend/.env.example apps/frontend/.env
        echo -e "${GREEN}✓${NC} apps/frontend/.env created"
    else
        echo -e "${GREEN}✓${NC} apps/frontend/.env already exists"
    fi

    echo ""
    echo -e "${YELLOW}Building and starting services...${NC}"
    echo ""

    # Build and start services
    docker-compose up --build

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}LivePresentations is running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo "Press Ctrl+C to stop services"
else
    # Manual setup
    echo -e "${YELLOW}Manual Setup Instructions${NC}"
    echo ""
    echo -e "${BLUE}For more details, see docs/SETUP_COMPLETE.md${NC}"
    echo ""
    echo -e "${BLUE}Prerequisites:${NC}"
    echo "  - Node.js 18+ (npm)"
    echo "  - Python 3.10+ (python or python3)"
    echo ""

    echo -e "${BLUE}Step 1: Setup Backend${NC}"
    echo ""
    echo "  cd apps/backend"
    echo ""
    echo "  # Create virtual environment"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo ""
    echo "  # Install dependencies"
    echo "  pip install -r requirements.txt"
    echo ""
    echo "  # Setup environment"
    echo "  cp .env.example .env"
    echo ""
    echo "  # Run backend"
    echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    echo ""

    echo -e "${BLUE}Step 2: Setup Frontend (in another terminal)${NC}"
    echo ""
    echo "  cd apps/frontend"
    echo "  npm install"
    echo "  npm run dev -- --host"
    echo ""

    echo -e "${BLUE}Access the application:${NC}"
    echo ""
    echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
    echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}Note:${NC} Keep both backend and frontend terminals running"
    echo ""
fi
