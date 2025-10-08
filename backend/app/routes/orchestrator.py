import os
import json
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from supabase import create_client, Client

# Импорты из твоего кода агентов
from app.ai_core.graph import prepare_initial_state, run_campaign
from app.ai_core.agents.registry import AGENT_REGISTRY
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


def _execute_request(request):
    """Helper to execute supabase requests and surface PostgREST errors."""

    result = request.execute()
    error = getattr(result, "error", None)
    if error:
        raise RuntimeError(f"Supabase request failed: {error}")
    return result


def get_supabase_client() -> Client:
    """Ленивая инициализация клиента Supabase."""

    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_PUBLIC_SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url:
            raise RuntimeError("Supabase URL is not configured")

        if not service_key:
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY is required for orchestrator updates"
            )

        _supabase_client = create_client(url, service_key)

    return _supabase_client


# ---------------------
# Helpers
# ---------------------
_STEP_LABELS = {
    "manager_plan": "План кампании",
    "manager_summary": "Финальная сборка",
}
for _agent_id, _config in AGENT_REGISTRY.items():
    _STEP_LABELS[_agent_id] = _config.title


def _humanize_step(step_id: str) -> str:
    return _STEP_LABELS.get(step_id, step_id.replace("_", " ").title())


def _compose_notes(user_notes: str, progress_log: list[str], summary: str | None = None) -> str:
    sections: list[str] = []
    cleaned_user_notes = (user_notes or "").strip()

    if cleaned_user_notes:
        sections.append(f"📝 Заметки пользователя:\n{cleaned_user_notes}")
    if summary:
        sections.append(summary.strip())
    if progress_log:
        sections.append("📈 Прогресс выполнения:\n" + "\n".join(progress_log))

    return "\n\n".join(section for section in sections if section).strip()


def _safe_campaign_update(supabase: Client, campaign_id: str, payload: dict) -> None:
    try:
        _execute_request(
            supabase.table("campaigns").update(payload).eq("id", campaign_id)
        )
    except RuntimeError as exc:
        message = str(exc).lower()
        filtered_payload = dict(payload)
        removed_fields: list[str] = []

        for field in ("board", "todo"):
            if field in filtered_payload and field in message:
                filtered_payload.pop(field, None)
                removed_fields.append(field)

        if removed_fields:
            print(
                f"ℹ️ Supabase schema missing columns {', '.join(removed_fields)}; retrying without them."
            )
            _execute_request(
                supabase.table("campaigns").update(filtered_payload).eq("id", campaign_id)
            )
        else:
            raise


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
    user_notes = (additional_notes or "").strip()
    progress_log: list[str] = []
    supabase: Optional[Client] = None

    try:
        supabase = get_supabase_client()

        # -------------------------------
        # 0. Подготовка шагов и прогресса
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

        steps_sequence = ["manager_plan", *selected_agents_list, "manager_summary"]
        total_steps = max(len(steps_sequence), 1)
        progress_log.append(f"🚀 Оркестратор запущен. Всего шагов: {total_steps}.")

        _safe_campaign_update(
            supabase,
            campaign_id,
            {
                "status": "processing",
                "selected_agents": selected_agents_list,
                "additional_notes": _compose_notes(user_notes, progress_log),
            },
        )

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
            if meeting_materials:
                progress_log.append("🎧 Аудиоматериалы подготовлены.")
                _safe_campaign_update(
                    supabase,
                    campaign_id,
                    {
                        "status": "processing",
                        "additional_notes": _compose_notes(user_notes, progress_log),
                    },
                )

        # -------------------------------
        # 2. Подготовка состояния агентов
        # -------------------------------
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
        progress_state = {"completed": 0}

        def handle_step(step_id: str, step_state) -> None:
            progress_state["completed"] += 1
            label = _humanize_step(step_id)
            progress_log.append(
                f"{progress_state['completed']}/{total_steps} — {label}"
            )
            artifacts_list = [
                str(path)
                for path in step_state.get("artifacts", [])
                if isinstance(path, (str, os.PathLike))
            ]
            _safe_campaign_update(
                supabase,
                campaign_id,
                {
                    "status": "processing",
                    "additional_notes": _compose_notes(user_notes, progress_log),
                    "artifacts_path": ", ".join(artifacts_list),
                },
            )

        result = run_campaign(state, on_step=handle_step)

        summary = result.get("summary", "")
        artifacts = [str(path) for path in result.get("artifacts", [])]

        # -------------------------------
        # 4. Обновление кампании в Supabase
        # -------------------------------
        progress_log.append("🏁 Оркестратор завершил выполнение.")

        update_payload = {
            "status": "completed",
            "artifacts_path": ", ".join(artifacts),
            "additional_notes": _compose_notes(user_notes, progress_log, summary),
            "selected_agents": selected_agents_list,
        }

        board = result.get("board")
        if board:
            update_payload["board"] = board

        todo = result.get("todo")
        if todo:
            update_payload["todo"] = todo

        _safe_campaign_update(supabase, campaign_id, update_payload)

        print(f"✅ Кампания {campaign_id} завершена")

    except Exception as e:
        print("❌ Ошибка при обработке кампании:", e)
        try:
            if supabase is None:
                supabase = get_supabase_client()
        except RuntimeError:
            return

        try:
            progress_log.append(f"⚠️ Ошибка: {e}")
            failure_notes = _compose_notes(user_notes, progress_log)
            if failure_notes:
                failure_notes = f"{failure_notes}\n\n⚠️ Подробности: {e}"
            else:
                failure_notes = f"⚠️ Ошибка: {e}"

            _safe_campaign_update(
                supabase,
                campaign_id,
                {"status": "failed", "additional_notes": failure_notes},
            )
        except RuntimeError:
            pass
