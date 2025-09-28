DOCKER_COMPOSE = docker compose -f infra/docker-compose.yml

.PHONY: up down restart logs ps build pull fly-create fly-deploy fly-secrets pages-build

up:
	$(DOCKER_COMPOSE) up -d --build

down:
	$(DOCKER_COMPOSE) down

restart:
	$(DOCKER_COMPOSE) down && $(DOCKER_COMPOSE) up -d --build

logs:
	$(DOCKER_COMPOSE) logs -f

ps:
	$(DOCKER_COMPOSE) ps

build:
	$(DOCKER_COMPOSE) build --pull

pull:
	$(DOCKER_COMPOSE) pull

run:
	uvicorn app.main:app --reload --port 8001

run-root:
	uvicorn backend.app.main:app --reload --port 8001
