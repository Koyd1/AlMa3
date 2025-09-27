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

# --- Fly.io / Cloudflare helpers ---
fly-create:
	cd backend && flyctl apps create alma3 || true

fly-deploy:
	cd backend && flyctl deploy --config fly.toml --now

fly-secrets:
	cd backend && flyctl secrets set ALLOWED_ORIGINS=https://alma3.pages.dev

pages-build:
	cd frontend && npm ci && npm run build
