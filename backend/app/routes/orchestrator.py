import os
import json
import asyncio
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from supabase import create_client, Client

# Импорты из твоего кода агентов
from app.ai_core.graph import prepare_initial_state, run_campaign
from app.ai_core.services.audio import prepare_meeting_materials
from app.ai_core.voice_to_speach import transcription_keys_model

router = APIRouter(tags=["orchestrator"])

# ---------------------
# Supabase connection
# ---------------------
SUPABASE_URL = os.getenv("VITE_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("VITE_PUBLIC_SUPABASE_ANON_KEY")
)
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("❌ Supabase environment variables not set!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


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
    background_tasks.add_task(
        process_campaign,
        campaign_id,
        title,
        orchestrator_prompt,
        additional_notes,
        selected_agents,
        audio,
    )
    return {"message": "Campaign started", "status": "processing"}


# ---------------------
# Background processing
# ---------------------
async def process_campaign(
    campaign_id: str,
    title: str,
    orchestrator_prompt: str,
    additional_notes: str,
    selected_agents: str,
    audio: UploadFile | None,
):
    try:
        # Обновляем статус кампании
        supabase.table("campaigns").update(
            {"status": "processing"}
        ).eq("id", campaign_id).execute()

        # -------------------------------
        # 1. Обработка аудио (если есть)
        # -------------------------------
        meeting_materials = None
        audio_summary = ""

        if audio:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                content = await audio.read()
                tmp.write(content)
                tmp_path = tmp.name

            meeting_materials = prepare_meeting_materials(
                content,
                filename=audio.filename,
                whisper_model=os.getenv("WHISPER_MODEL", "base"),
            )

            if meeting_materials and meeting_materials.summary:
                try:
                    audio_summary = transcription_keys_model(meeting_materials.summary)
                except Exception as e:
                    print("⚠️ Gemini summarization failed:", e)

        # -------------------------------
        # 2. Подготовка состояния агентов
        # -------------------------------
        selected_agents_list = json.loads(selected_agents or "[]")

        brief_sections = [orchestrator_prompt, additional_notes, audio_summary]
        base_brief = "\n\n".join(s for s in brief_sections if s)

        state = prepare_initial_state(
            base_brief,
            project_title=title,
            selected_agents=selected_agents_list,
        )

        # -------------------------------
        # 3. Запуск оркестрации
        # -------------------------------
        result = run_campaign(state)

        summary = result.get("summary", "")
        artifacts = result.get("artifacts", [])

        # -------------------------------
        # 4. Обновление кампании в Supabase
        # -------------------------------
        supabase.table("campaigns").update(
            {
                "status": "completed",
                "artifacts_path": ", ".join(artifacts),
                "additional_notes": (additional_notes or "") + "\n\n" + summary,
            }
        ).eq("id", campaign_id).execute()

        print(f"✅ Кампания {campaign_id} завершена")

    except Exception as e:
        print("❌ Ошибка при обработке кампании:", e)
        supabase.table("campaigns").update(
            {"status": "failed", "additional_notes": str(e)}
        ).eq("id", campaign_id).execute()
