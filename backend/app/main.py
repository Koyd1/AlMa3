import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, agents, runs, billing, primary
from app.routes import orchestrator

app = FastAPI(title="AI Agents API")

# ----------------------
# CORS configuration
# ----------------------

# 1️⃣ Берём значение из .env (через ALLOWED_ORIGINS)
# Пример: ALLOWED_ORIGINS=https://al-ma3-gdxe.vercel.app,http://localhost:5173
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")

if allowed_origins_env:
    # разделяем по запятым, убираем пробелы
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    # если переменная не указана, задаём дефолт
    allowed_origins = [
        "https://al-ma3-gdxe.vercel.app",  # твой фронт на Vercel
        "http://localhost:5173",  # для разработки
        "*",  # разрешаем все (можно убрать для безопасности)
    ]

# Убеждаемся, что localhost всегда добавлен
if "http://localhost:5173" not in allowed_origins:
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Routers
# ----------------------
app.include_router(auth.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(orchestrator.router, prefix="/api/orchestrator")
app.include_router(primary.router, prefix="/api/primary", tags=["primary"])

# ----------------------
# Health endpoints
# ----------------------
@app.get("/health")
def health_root():
    return {"status": "ok"}

@app.get("/api/health")
def api_health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )



#import os
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
#
# from .routes import auth, agents, runs, billing, primary
# from app.routes import orchestrator
#
# app = FastAPI(title="AI Agents API")
#
# # ----------------------
# # CORS configuration
# # ----------------------
#
#
# allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
#
# # Если явно не указано, то добавляем localhost:5173 для фронта
# if allowed_origins.strip() == "*":
#     cors_kwargs = dict(
#         allow_origins=["*", "http://localhost:5173"],
#         allow_credentials=False,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )
# else:
#     origins_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]
#     # добавляем локальный фронт если его нет
#     if "http://localhost:5173" not in origins_list:
#         origins_list.append("http://localhost:5173")
#
#     cors_kwargs = dict(
#         allow_origins=origins_list,
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )
#
# app.add_middleware(CORSMiddleware, **cors_kwargs)
#
# # ----------------------
# # Routers
# # ----------------------
# app.include_router(auth.router, prefix="/api")
# app.include_router(agents.router, prefix="/api")
# app.include_router(runs.router, prefix="/api")
# app.include_router(billing.router, prefix="/api")
# app.include_router(orchestrator.router, prefix="/api/orchestrator")
#
# # Новый роут для таблицы
# app.include_router(primary.router, prefix="/api/primary", tags=["primary"])
#
# # ----------------------
# # Health endpoints
# # ----------------------
# @app.get("/health")
# def health_root():
#     return {"status": "ok"}
#
# @app.get("/api/health")
# def api_health():
#     return {"status": "ok"}
#
#
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "app.main:app",
#         host="0.0.0.0",
#         port=int(os.getenv("PORT", "8000")),
#         reload=True,
#     )
