import os
import json
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from supabase import create_client, Client

# Импорты из твоего кода агентов
from app.ai_core.graph import prepare_initial_state, run_campaign
from app.ai_core.services.audio import (
    AudioProcessingError,
    MeetingMaterials,
    prepare_meeting_materials,
    persist_meeting_materials,
)
from app.ai_core.voice_to_speach import transcription_keys_model

router = APIRouter(tags=["orchestrator"])

# ---------------------
# Supabase connection
# ---------------------
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Ленивая инициализация клиента Supabase."""

    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("VITE_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
            "VITE_PUBLIC_SUPABASE_ANON_KEY"
        )

        if not url or not service_key:
            raise RuntimeError("Supabase environment variables are not configured")

        _supabase_client = create_client(url, service_key)

    return _supabase_client


# ---------------------
# API endpoint
# ---------------------
@router.post("/run")
async def run_orchestrator(
    background_tasks: BackgroundTasks,
    campaign_id: str = Form(...),
    title: str = Form(...),
    orchestrator_prompt: str = Form(""),
    additional_notes: str = Form(""),
    selected_agents: str = Form("[]"),
    audio: UploadFile | None = File(None),
):
    """
    Запускает обработку кампании в фоне.
    """
    try:
        get_supabase_client()
    except RuntimeError as exc:  # pragma: no cover - зависит от окружения
        raise HTTPException(status_code=500, detail=str(exc))

    audio_payload: Optional[bytes] = None
    audio_filename: Optional[str] = None

    if audio is not None:
        audio_payload = await audio.read()
        audio_filename = audio.filename or "uploaded-audio"

    background_tasks.add_task(
        process_campaign,
        campaign_id,
        title,
        orchestrator_prompt,
        additional_notes,
        selected_agents,
        audio_payload,
        audio_filename,
    )
    return {"message": "Campaign started", "status": "processing"}


# ---------------------
# Background processing
# ---------------------
def process_campaign(
    campaign_id: str,
    title: str,
    orchestrator_prompt: str,
    additional_notes: str,
    selected_agents: str,
    audio_bytes: Optional[bytes],
    audio_filename: Optional[str],
):
    try:
        supabase = get_supabase_client()

        # Обновляем статус кампании
        supabase.table("campaigns").update(
            {"status": "processing"}
        ).eq("id", campaign_id).execute()

        # -------------------------------
        # 1. Обработка аудио (если есть)
        # -------------------------------
        meeting_materials: Optional[MeetingMaterials] = None
        audio_summary = ""

        if audio_bytes:
            try:
                meeting_materials = prepare_meeting_materials(
                    audio_bytes,
                    filename=audio_filename or "uploaded-audio",
                    whisper_model=os.getenv("WHISPER_MODEL", "base"),
                )
            except AudioProcessingError as exc:
                print("⚠️ Whisper transcription failed:", exc)
                meeting_materials = None
            except Exception as exc:  # pragma: no cover - сетевые/IO ошибки
                print("⚠️ Unexpected audio processing error:", exc)
                meeting_materials = None

            if meeting_materials and meeting_materials.summary:
                try:
                    audio_summary = transcription_keys_model(meeting_materials.summary)
                except Exception as exc:  # pragma: no cover - опциональная интеграция
                    print("⚠️ Gemini summarization failed:", exc)

        # -------------------------------
        # 2. Подготовка состояния агентов
        # -------------------------------
        try:
            loaded_agents = json.loads(selected_agents or "[]")
        except json.JSONDecodeError:
            loaded_agents = []

        if isinstance(loaded_agents, list):
            selected_agents_list = [
                agent_id for agent_id in loaded_agents if isinstance(agent_id, str)
            ]
        else:
            selected_agents_list = []

        brief_sections = [orchestrator_prompt, additional_notes, audio_summary]
        base_brief = "\n\n".join(s for s in brief_sections if s)

        state = prepare_initial_state(
            base_brief,
            project_title=title,
            selected_agents=selected_agents_list,
            meeting_summary=(meeting_materials.summary if meeting_materials else ""),
            transcript_raw=(
                meeting_materials.raw_transcript if meeting_materials else ""
            ),
            transcript_clean=(
                meeting_materials.normalized_transcript if meeting_materials else ""
            ),
        )

        if meeting_materials:
            try:
                meeting_materials = persist_meeting_materials(
                    state["run_id"],
                    meeting_materials,
                    audio_bytes=audio_bytes,
                    audio_filename=audio_filename,
                )
                if meeting_materials.audio_path:
                    state["audio_path"] = str(meeting_materials.audio_path)
            except Exception as exc:  # pragma: no cover - IO ошибки
                print("⚠️ Failed to persist meeting materials:", exc)

        # -------------------------------
        # 3. Запуск оркестрации
        # -------------------------------
        result = run_campaign(state)

        summary = result.get("summary", "")
        artifacts = result.get("artifacts", [])

        # -------------------------------
        # 4. Обновление кампании в Supabase
        # -------------------------------
        update_payload = {
            "status": "completed",
            "artifacts_path": ", ".join(artifacts),
            "additional_notes": (additional_notes or "") + ("\n\n" if summary else "") + summary,
        }

        board = result.get("board")
        if board:
            update_payload["board"] = board

        todo = result.get("todo")
        if todo:
            update_payload["todo"] = todo

        supabase.table("campaigns").update(update_payload).eq("id", campaign_id).execute()

        print(f"✅ Кампания {campaign_id} завершена")

    except Exception as e:
        print("❌ Ошибка при обработке кампании:", e)
        try:
            supabase = get_supabase_client()
        except RuntimeError:
            return

        supabase.table("campaigns").update(
            {"status": "failed", "additional_notes": str(e)}
        ).eq("id", campaign_id).execute()
