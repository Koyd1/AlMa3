from fastapi import APIRouter

from app.ai_core.agents.registry import AGENT_REGISTRY


router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents():
    agents = [
        {
            "id": cfg.id,
            "title": cfg.title,
            "owner": cfg.owner,
            "description": cfg.description,
            "default_selected": cfg.default_selected,
            "default_in_summary": cfg.default_in_summary,
        }
        for cfg in AGENT_REGISTRY.values()
    ]
    return {"agents": agents}
