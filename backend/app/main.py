import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, agents, runs, billing, primary
from app.routes import orchestrator

app = FastAPI(title="AI Agents API")

# ----------------------
# CORS configuration
# ----------------------
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")

# Если явно не указано, то добавляем localhost:5173 для фронта
if allowed_origins.strip() == "*":
    cors_kwargs = dict(
        allow_origins=["*", "http://localhost:5173"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]
    # добавляем локальный фронт если его нет
    if "http://localhost:5173" not in origins_list:
        origins_list.append("http://localhost:5173")

    cors_kwargs = dict(
        allow_origins=origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(CORSMiddleware, **cors_kwargs)

# ----------------------
# Routers
# ----------------------
app.include_router(auth.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(orchestrator.router, prefix="/api/orchestrator")

# Новый роут для таблицы 
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
