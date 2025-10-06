from __future__ import annotations

import os
import re
from typing import Optional

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None  # type: ignore

_PROMPT = (
    "You are an expert text analyst. I will provide a long transcription or text.\n"
    "\nYour task is to:\n"
    "1. Break the text into meaningful paragraphs based on context and topic shifts.\n"
    "2. For each paragraph, identify and list the key points in a concise manner.\n"
    "3. From the entire text, extract all tasks mentioned. For each task, provide:\n"
    "   - Who the task is assigned to (if mentioned)\n"
    "   - What the task consists of (the action or objective)\n"
    "   - Any relevant details or priority/weight of the task\n\n"
    "Output the result in structured format like this:\n\n"
    "Paragraph 1:\n<paragraph text>\nKey Points:\n- <key point 1>\n- <key point 2>\n\n"
    "Paragraph 2:\n<paragraph text>\nKey Points:\n- <key point 1>\n- <key point 2>\n\n"
    "Tasks:\n- Task 1:\n  Assigned to: <person or team>\n  Task: <description of the task>\n  Details: <additional details, context, or priority>\n"
    "- Task 2:\n  Assigned to: <person or team>\n  Task: <description of the task>\n  Details: <additional details, context, or priority>\n\n"
    "Do not add any extra commentary. Keep it clear, concise, and structured."
)

def _resolve_model_name() -> str:
    model = os.getenv("GEMINI_MODEL")
    if not model:
        return "models/gemini-1.5-flash"

    stripped = model.strip()
    lower = stripped.lower()

    alias_map = {
        "flash": "models/gemini-1.5-flash",
        "gemini-flash": "models/gemini-1.5-flash",
        "gemini-1.5-flash": "models/gemini-1.5-flash",
        "gemini-1.5-flash-latest": "models/gemini-1.5-flash-latest",
        "gemini-1.5-flash-001": "models/gemini-1.5-flash-001",
        "gemini-1.5-flash-002": "models/gemini-1.5-flash-002",
        "gemini-1.5-flash-8b": "models/gemini-1.5-flash-8b",
        "gemini-1.5-flash-8b-latest": "models/gemini-1.5-flash-8b-latest",
        "gemini-2.0-flash": "models/gemini-2.0-flash",
        "gemini-2.0-flash-latest": "models/gemini-2.0-flash",
        "gemini-2.0-flash-lite": "models/gemini-2.0-flash-lite",
        "gemini-2.0-flash-lite-latest": "models/gemini-2.0-flash-lite",
        "gemini-2.5-flash": "models/gemini-2.0-flash",
        "gemini-2.5-flash-latest": "models/gemini-2.0-flash",
        "pro": "models/gemini-1.5-pro",
        "gemini-pro": "models/gemini-1.5-pro",
        "gemini-1.5-pro": "models/gemini-1.5-pro",
        "gemini-1.5-pro-latest": "models/gemini-1.5-pro-latest",
        "gemini-1.5-pro-001": "models/gemini-1.5-pro-001",
        "gemini-1.5-pro-002": "models/gemini-1.5-pro-002",
        "gemini-1.0-pro": "models/gemini-1.0-pro",
        "gemini-1.0-pro-latest": "models/gemini-1.0-pro-latest",
        "gemini-pro-latest": "models/gemini-1.0-pro-latest",
    }

    if lower in alias_map:
        return alias_map[lower]

    if lower.startswith("models/"):
        base = lower.split("/", 1)[1]
        if base in alias_map:
            return alias_map[base]
        return stripped

    suffixes = ("-latest", "-001", "-002")
    for suffix in suffixes:
        if lower.endswith(suffix):
            candidate = lower[: -len(suffix)]
            if candidate in alias_map:
                return alias_map[candidate]

    if "/" not in stripped:
        return f"models/{stripped}"

    return stripped


_DEFAULT_MODEL = _resolve_model_name()


def transcription_keys_model(
    text: str,
    *,
    model_name: Optional[str] = None,
    api_key: Optional[str] = None,
) -> str:
    """Produce structured paragraphs and tasks using Gemini."""

    if not text.strip():
        return ""
    if genai is None:
        raise RuntimeError(
            "google-generativeai is not installed. Add it to requirements to use Gemini."
        )

    api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Gemini API key is missing. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable."
        )

    model = (model_name or _DEFAULT_MODEL).strip()
    prompt = f"{_PROMPT}\n\n{text.strip()}"

    genai.configure(api_key=api_key)
    generative_model = genai.GenerativeModel(model)
    response = generative_model.generate_content(prompt)

    output = getattr(response, "text", "")
    if not output and getattr(response, "candidates", None):
        pieces: list[str] = []
        for candidate in response.candidates:  # type: ignore[attr-defined]
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []):
                text_part = getattr(part, "text", None)
                if text_part:
                    pieces.append(text_part)
        output = "\n".join(pieces)

    if not output:
        raise RuntimeError("Gemini response did not contain text output.")

    return output.strip()


def text_modify(text: str) -> tuple[str, str]:
    parts = text.split("Tasks:", 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return text.strip(), ""


def paragraph_modify(text: str) -> str:
    regex = re.compile(r"Paragraph [0-9]+:")
    return regex.sub(lambda match: f"#### {match.group()}\n\n", text)


def key_points(text: str) -> str:
    regex = re.compile(r"Key Points:")
    return regex.sub(lambda match: f"\n{match.group()}", text)


def task_to_list(text: str) -> list[str]:
    if "- Task" not in text:
        return []

    tasks = re.split(r"- Task [0-9]+:", text)
    results: list[str] = []
    for entry in tasks:
        entry = entry.strip()
        if not entry:
            continue

        assigned_match = re.search(r"Assigned to:\s*(.*)", entry)
        task_match = re.search(r"Task:\s*(.*)", entry)
        details_match = re.search(r"Details:\s*(.*)", entry, re.DOTALL)

        assigned = assigned_match.group(1).strip() if assigned_match else "Unassigned"
        task = task_match.group(1).strip() if task_match else "No task description"
        details = details_match.group(1).strip() if details_match else "No details"

        results.append(
            f"**Assigned to:** {assigned}\n\n"
            f"**Task:** {task}\n\n"
            f"**Details:** {details}"
        )

    return results


__all__ = [
    "transcription_keys_model",
    "text_modify",
    "paragraph_modify",
    "key_points",
    "task_to_list",
]
