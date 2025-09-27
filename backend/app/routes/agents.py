from fastapi import APIRouter


router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents():
    return {"agents": []}

