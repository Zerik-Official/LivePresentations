.PHONY: help build up down logs restart clean test lint

help:
	@echo "LivePresentations - Docker Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup & Building:"
	@echo "  make setup          - Initial setup (copy .env files)"
	@echo "  make build          - Build Docker images"
	@echo ""
	@echo "Running:"
	@echo "  make up             - Start services"
	@echo "  make up-build       - Build and start services"
	@echo "  make down           - Stop services"
	@echo "  make restart        - Restart services"
	@echo ""
	@echo "Development:"
	@echo "  make logs           - View all logs"
	@echo "  make logs-backend   - View backend logs"
	@echo "  make logs-frontend  - View frontend logs"
	@echo ""
	@echo "Cleaning:"
	@echo "  make clean          - Stop and remove containers"
	@echo "  make clean-volumes  - Remove everything including volumes"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run frontend tests"
	@echo "  make lint           - Run linter"
	@echo ""

setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ .env created"; \
	else \
		echo "✓ .env already exists"; \
	fi
	@if [ ! -f apps/backend/.env ]; then \
		cp apps/backend/.env.example apps/backend/.env; \
		echo "✓ apps/backend/.env created"; \
	else \
		echo "✓ apps/backend/.env already exists"; \
	fi
	@if [ ! -f apps/frontend/.env ]; then \
		cp apps/frontend/.env.example apps/frontend/.env; \
		echo "✓ apps/frontend/.env created"; \
	else \
		echo "✓ apps/frontend/.env already exists"; \
	fi
	@echo ""
	@echo "Setup complete! Edit .env files if needed, then run 'make up-build'"

build:
	docker-compose build

up:
	docker-compose up

up-build:
	docker-compose up --build

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

clean:
	docker-compose down

clean-volumes:
	docker-compose down -v

test:
	cd apps/frontend && npm run test

lint:
	cd apps/frontend && npm run lint

.PHONY: help setup build up down logs restart clean test lint