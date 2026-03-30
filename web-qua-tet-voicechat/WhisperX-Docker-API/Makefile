# WhisperX Docker API Makefile

IMAGE_NAME = reg.securityzone.vn/sonnguyen/whisperx-api:latest
CONTAINER_NAME = whisperx-api

.PHONY: build build-no-cache up down restart logs shell clean prune help

# Build image
build:
	docker build -t $(IMAGE_NAME) .

# Build without cache
build-no-cache:
	docker build --no-cache -t $(IMAGE_NAME) .

# Start container
up:
	docker compose up -d

# Start with logs
up-logs:
	docker compose up

# Stop container
down:
	docker compose down

# Restart container
restart:
	docker compose restart

# View logs
logs:
	docker compose logs -f

# Shell into container
shell:
	docker exec -it $(CONTAINER_NAME) bash

# Check container status
status:
	docker ps -a | grep $(CONTAINER_NAME) || echo "Container not found"

# Check image size
size:
	docker images | grep $(IMAGE_NAME)

# Check disk usage
disk:
	docker system df

# Remove container and image
clean:
	docker compose down --rmi local

# Remove all unused Docker resources (CAREFUL!)
prune:
	docker builder prune -af
	docker image prune -f

# Deep clean - remove ALL unused images (CAREFUL!)
prune-all:
	docker system prune -a --volumes -f

# Test API health
test:
	curl -s http://localhost:5772/health | jq . || echo "API not responding"

# Help
help:
	@echo "Available commands:"
	@echo "  make build          - Build Docker image"
	@echo "  make build-no-cache - Build without cache"
	@echo "  make up             - Start container (detached)"
	@echo "  make up-logs        - Start with logs"
	@echo "  make down           - Stop container"
	@echo "  make restart        - Restart container"
	@echo "  make logs           - View container logs"
	@echo "  make shell          - Shell into container"
	@echo "  make status         - Check container status"
	@echo "  make size           - Check image size"
	@echo "  make disk           - Check Docker disk usage"
	@echo "  make clean          - Remove container and image"
	@echo "  make prune          - Clean build cache"
	@echo "  make prune-all      - Remove ALL unused Docker resources"
	@echo "  make test           - Test API health"
