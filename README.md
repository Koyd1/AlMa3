# TODO:
1. Реализовать загрузку аудо и его саммари
2. Реализовать правильное отображение отчётов
3. Реализовать выгрузку отчётов
4. Выгрузка артефактов в разных форматах

- Сделать дизайн ревью
- Добавить кэширование
- Рефакторинг

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

Идея: фронт билдим в статику на Cloudflare Pages, backend деплоим в Fly.io с автослипом (free tier).

1) Проверка ок статуса /api/health

Примечания
- В `backend/app/main.py` добавлен CORS: по умолчанию `*` (без credentials). Для продакшена обязательно задайте точный домен через `ALLOWED_ORIGINS`.
- В `backend/fly.toml` настроен `internal_port = 8000`, совпадает с `uvicorn` из Dockerfile.
- Nginx и `infra/` в этом варианте не используются.

## Интеграционный чек (Vercel + Render/Vercel бэкенд)

Для быстрого контроля работоспособности фронта и API добавлен скрипт `integration-check.mjs`.

```sh
# Проверка всего (фронт + API) по умолчанию
node integration-check.mjs

# Проверить только backend (если фронт ещё не задеплоен)
SKIP_FRONT=1 node integration-check.mjs

# Указать свои домены
FRONT_URL=https://example-frontend.vercel.app \
BACK_URL=https://example-backend.vercel.app \
node integration-check.mjs
```



### Vercel (Frontend) + Vercel (Backend) настройка

- Бэкенд: деплойте как отдельный проект (например, `alma3-backend-v1`) и убедитесь, что доступны эндпоинты `/api/...`.
- Фронтенд: проект с корнем `frontend/`. В конфиге `frontend/vercel.json` уже прописаны `rewrites`, которые проксируют `/api` → `https://alma3-backend-v1.vercel.app`.
- Переменные окружения фронта: `VITE_API_BASE` держите пустым или равным `/api` (другие значения перезапишут прокси).
- После изменения `vercel.json` обязательно делайте `Redeploy` с `Clear build cache`.
