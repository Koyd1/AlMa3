import os
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase import Client, create_client


router = APIRouter(prefix="/auth", tags=["auth"])

_admin_client: Optional[Client] = None


def get_admin_client() -> Client:
    """Return a cached Supabase service-role client."""

    global _admin_client

    if _admin_client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_PUBLIC_SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not service_key:
            raise RuntimeError("Supabase admin credentials are not configured")

        _admin_client = create_client(url, service_key)

    return _admin_client


class SignUpPayload(BaseModel):
    email: EmailStr
    password: str
    metadata: dict[str, Any] | None = None


@router.get("/health")
def health():
    return {"auth": "ok"}


@router.post("/signup")
def signup(payload: SignUpPayload):
    """Create a Supabase user without triggering confirmation emails."""

    try:
        client = get_admin_client()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    create_request: dict[str, Any] = {
        "email": payload.email,
        "password": payload.password,
        "email_confirm": True,
    }

    if payload.metadata:
        create_request["user_metadata"] = payload.metadata

    try:
        response = client.auth.admin.create_user(create_request)
    except Exception as exc:  # pragma: no cover - depends on Supabase responses
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=getattr(exc, "message", str(exc)),
        ) from exc

    user = getattr(response, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    return {"id": user.id, "email": user.email}
