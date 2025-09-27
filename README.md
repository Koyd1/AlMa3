# AI Agents Monorepo Skeleton

Стартовая структура проекта с Backend (FastAPI), Frontend (React/Vite) и Infra (Docker Compose + Nginx).

## Структура

- `backend/` — FastAPI приложение, роуты, core-логика, сервисы
- `frontend/` — React/Vite фронтенд
- `infra/` — docker-compose и nginx конфиг
- `.env.example` — пример переменных окружения
- `Makefile` — удобные команды

## Быстрый старт (Docker)

1. Скопируйте `.env.example` в `.env` и при необходимости измените значения.
2. Запустите окружение:
   ```sh
   make up
   ```
3. Backend доступен на `http://localhost:8000/health`, фронтенд — на `http://localhost:5173` (через Nginx — `http://localhost/`).

## Backend локально

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Frontend локально

```sh
cd frontend
npm install
npm run dev -- --host
```

## Деплой (бесплатно): Variant B — Cloudflare Pages (frontend) + Fly.io (backend)

Идея: фронт билдим в статику на Cloudflare Pages, backend деплоим в Fly.io с автослипом (free tier).

1) Backend → Fly.io (alma3)
- Установите `flyctl`: https://fly.io/docs/hands-on/install-flyctl/
- Войдите: `flyctl auth login`
- Перейдите в `backend/`:
  ```sh
  cd backend
  ```
- Имя приложения уже задано: `app = "alma3"` в `backend/fly.toml`.
- Запустите мастер:
  ```sh
  flyctl launch
  ```
  Выберите регион, подтвердите использование существующего `fly.toml`, согласитесь на деплой.
- После деплоя URL будет `https://alma3.fly.dev` (если имя свободно).
- Настройте CORS (разрешить только домен фронтенда на Pages):
  ```sh
  flyctl secrets set ALLOWED_ORIGINS=https://alma3.pages.dev
  ```

2) Frontend → Cloudflare Pages (alma3)
- В Cloudflare Dashboard создайте Pages-проект из репозитория, укажите корень проекта: `frontend/`.
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Переменная окружения (или файл `frontend/.env.production` уже добавлен):
  - `VITE_API_BASE = https://alma3.fly.dev/api`
- После билда фронт будет доступен по адресу `https://alma3.pages.dev` (если имя проекта — alma3).

3) Проверка
- Откройте `https://alma3.pages.dev` — на странице должно отображаться состояние health API.
- Прямой вызов API: `https://alma3.fly.dev/api/health` должен вернуть `{ "status": "ok" }`.

Примечания
- В `backend/app/main.py` добавлен CORS: по умолчанию `*` (без credentials). Для продакшена обязательно задайте точный домен через `ALLOWED_ORIGINS`.
- В `backend/fly.toml` настроен `internal_port = 8000`, совпадает с `uvicorn` из Dockerfile.
- Nginx и `infra/` в этом варианте не используются.
