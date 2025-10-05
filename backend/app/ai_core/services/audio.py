import io
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from openai import OpenAI
from app.ai_core.agents._llm import LLMError, chat
from app.ai_core.memory import rag

BASE_DIR = Path(__file__).resolve().parent.parent
TRANSCRIPT_CLEANUP_PROMPT = (
    BASE_DIR / "prompts" / "transcript_cleanup.md"
).read_text(encoding="utf-8")
MEETING_SUMMARY_PROMPT = (
    BASE_DIR / "prompts" / "meeting_summary.md"
).read_text(encoding="utf-8")

class AudioProcessingError(RuntimeError):
    """Raised when audio transcription or post-processing fails."""

@dataclass
class MeetingMaterials:
    raw_transcript: str
    normalized_transcript: str
    summary: str
    audio_path: Optional[Path] = None
    raw_artifact: Optional[Path] = None
    normalized_artifact: Optional[Path] = None
    summary_artifact: Optional[Path] = None

def transcribe_audio_bytes(
    file_bytes: bytes,
    *,
    filename: str,
    whisper_model: Optional[str] = None,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> str:
    """Send audio bytes to Whisper API and return the raw transcript."""

    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise AudioProcessingError(
            "OPENAI_API_KEY is not configured, невозможно вызвать Whisper."
        )

    model = whisper_model or os.getenv("WHISPER_MODEL", "whisper-1")

    client = OpenAI(api_key=key, base_url=base_url or os.getenv("OPENAI_BASE_URL"))
    audio_file = io.BytesIO(file_bytes)
    audio_file.name = filename

    try:
        response = client.audio.transcriptions.create(model=model, file=audio_file)
    except Exception as exc:  # pragma: no cover - network errors
        raise AudioProcessingError(f"Whisper transcription failed: {exc}") from exc

    text = getattr(response, "text", "")
    if not text:
        raise AudioProcessingError("Whisper вернул пустой ответ")
    return text.strip()

def normalize_transcript(transcript: str, *, model: Optional[str] = None) -> str:
    """Clean up the transcript using the main LLM backend."""

    if not transcript.strip():
        return transcript
    try:
        cleaned = chat(
            [
                {"role": "system", "content": TRANSCRIPT_CLEANUP_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Translate the meeting transcript into a readable form while preserving its meaning."
                        f"\n\nTranscript:\n{transcript.strip()}"
                    ),
                },
            ],
            model=model,
        )
    except LLMError as exc:  # pragma: no cover - сетевые ошибки
        raise AudioProcessingError(f"Failed to normalize transcript: {exc}") from exc
    return cleaned.strip()

def summarize_transcript(transcript: str, *, model: Optional[str] = None) -> str:
    """Produce a compact meeting summary for downstream agents."""

    if not transcript.strip():
        return ""

    try:
        summary = chat(
            [
                {"role": "system", "content": MEETING_SUMMARY_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Produce a structured meeting summary."
                        f"\n\nNormalized Transcript:\n{transcript.strip()}"
                    ),
                },
            ],
            model=model,
        )
    except LLMError as exc:  # pragma: no cover - сетевые ошибки
        raise AudioProcessingError(f"Unable to create summary: {exc}") from exc

    return summary.strip()


def prepare_meeting_materials(
    file_bytes: bytes,
    *,
    filename: str,
    whisper_model: Optional[str] = None,
    llm_model: Optional[str] = None,
) -> MeetingMaterials:
    """Full pipeline: audio → raw transcript → normalization → summary."""
    raw = transcribe_audio_bytes(
        file_bytes,
        filename=filename,
        whisper_model=whisper_model,
    )
    normalized = normalize_transcript(raw, model=llm_model)
    summary = summarize_transcript(normalized or raw, model=llm_model)
    return MeetingMaterials(
        raw_transcript=raw,
        normalized_transcript=normalized or raw,
        summary=summary or normalized or raw,
    )


def persist_meeting_materials(
    run_id: str,
    materials: MeetingMaterials,
    *,
    audio_bytes: Optional[bytes] = None,
    audio_filename: Optional[str] = None,
) -> MeetingMaterials:
    """Persist meeting artifacts to the run folder and RAG memory."""

    run_dir = rag.ARTIFACT_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    if audio_bytes and audio_filename:
        safe_name = _unique_filename(run_dir, audio_filename)
        audio_path = run_dir / safe_name
        audio_path.write_bytes(audio_bytes)
        materials.audio_path = audio_path

    if materials.raw_transcript:
        materials.raw_artifact = rag.save_artifact(
            run_id,
            "meeting_transcript_raw.md",
            materials.raw_transcript,
            add_to_memory=False,
        )

    if materials.normalized_transcript:
        materials.normalized_artifact = rag.save_artifact(
            run_id,
            "meeting_transcript.md",
            materials.normalized_transcript,
            add_to_memory=True,
        )

    if materials.summary:
        materials.summary_artifact = rag.save_artifact(
            run_id,
            "meeting_summary.md",
            materials.summary,
            add_to_memory=True,
        )

    return materials


def _unique_filename(run_dir: Path, filename: str) -> str:
    """Ensure we don't overwrite existing files in the run directory."""

    candidate = Path(filename).name or f"audio-{uuid.uuid4().hex[:8]}.bin"
    path = run_dir / candidate
    if not path.exists():
        return candidate

    stem = path.stem
    suffix = path.suffix
    while path.exists():
        candidate = f"{stem}-{uuid.uuid4().hex[:4]}{suffix}"
        path = run_dir / candidate
    return candidate


__all__ = [
    "AudioProcessingError",
    "MeetingMaterials",
    "prepare_meeting_materials",
    "persist_meeting_materials",
    "normalize_transcript",
    "summarize_transcript",
    "transcribe_audio_bytes",
]
