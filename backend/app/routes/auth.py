from fastapi import APIRouter


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/health")
def health():
    return {"auth": "ok"}

