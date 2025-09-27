from fastapi import APIRouter


router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/balance")
def balance():
    return {"balance": 0}

