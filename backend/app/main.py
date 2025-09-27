import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import auth, agents, runs, billing


app = FastAPI(title="AI Agents API")


# CORS (configure for separate frontend domain)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins.strip() == "*":
    cors_kwargs = dict(
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]
    cors_kwargs = dict(
        allow_origins=origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(CORSMiddleware, **cors_kwargs)


# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(billing.router, prefix="/api")


@app.get("/health")
def health():
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
