from __future__ import annotations

import os
from typing import Dict, Iterable, List, Optional, Tuple

import google.generativeai as genai


class LLMError(RuntimeError):
    """Raised when the LLM API returns an error."""


def _get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Reads environment variable, returns default if not found."""
    return os.getenv(key, default)


def _collect_gemini_api_keys() -> List[Tuple[str, str]]:
    """Collect available Gemini API keys in priority order."""

    def append(name: str, seen: set[str], items: List[Tuple[str, str]]) -> None:
        value = _get_env(name)
        if value and value not in seen:
            items.append((name, value))
            seen.add(value)

    collected: List[Tuple[str, str]] = []
    seen_values: set[str] = set()

    append("GEMINI_API_KEY", seen_values, collected)
    append("GOOGLE_API_KEY", seen_values, collected)

    suffix_entries: List[Tuple[int, int, str]] = []
    prefix = "GEMINI_API_KEY"
    for name in os.environ:
        if not name.startswith(prefix) or name == prefix:
            continue
        suffix = name[len(prefix) :]
        if suffix.isdigit():
            suffix_entries.append((0, int(suffix), name))
        else:
            suffix_entries.append((1, 0, name))

    for _, _, name in sorted(suffix_entries):
        append(name, seen_values, collected)

    return collected


def _is_quota_error(exc: Exception) -> bool:
    message = str(exc).lower()
    if "quota" in message or "rate limit" in message or "429" in message:
        return True
    code = getattr(exc, "code", None)
    status = getattr(exc, "status_code", None)
    return code == 429 or status == 429


def _normalize_gemini_model(raw: Optional[str]) -> str:
    """Map common aliases and deprecated names to supported Gemini models."""

    if not raw:
        return "models/gemini-1.5-flash"

    normalized = raw.strip()
    lower = normalized.lower()

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
        return normalized

    suffixes = ("-latest", "-001", "-002")
    for suffix in suffixes:
        if lower.endswith(suffix):
            candidate = lower[: -len(suffix)]
            if candidate in alias_map:
                return alias_map[candidate]

    if "/" not in normalized:
        return f"models/{normalized}"

    return normalized


def _get_gemini_model_name() -> str:
    """Resolve model name or fallback to a stable flash model."""

    return _normalize_gemini_model(_get_env("GEMINI_MODEL"))


def gemini_chat(
    messages: Iterable[Dict[str, str]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    """
    Unified Gemini chat entrypoint.
    Supports multi-message input (system, user, assistant).
    """
    model_name = model or _get_gemini_model_name()

    # Convert OpenAI-style messages to plain text prompt
    prompt_parts = []
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "system":
            prompt_parts.append(f"[SYSTEM]\n{content}\n")
        elif role == "user":
            prompt_parts.append(f"[USER]\n{content}\n")
        elif role == "assistant":
            prompt_parts.append(f"[ASSISTANT]\n{content}\n")

    prompt = "\n".join(prompt_parts).strip()

    api_keys = _collect_gemini_api_keys()
    if not api_keys:
        raise LLMError("❌ GEMINI_API_KEY is not set in environment variables.")

    quota_errors: List[str] = []
    last_exc: Optional[Exception] = None

    for key_name, api_key in api_keys:
        try:
            genai.configure(api_key=api_key)
            model_obj = genai.GenerativeModel(model_name)
            response = model_obj.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature
                ),
            )

            text = getattr(response, "text", None)
            if not text:
                raise LLMError("Gemini returned empty content.")
            return text.strip()

        except Exception as exc:
            message = str(exc)
            if "404" in message or "not_found" in message.lower():
                raise LLMError(
                    "❌ Gemini model '{}' not found by the API ({}). "
                    "Double-check GEMINI_MODEL and that your API key has access to that release.".format(
                        model_name, message
                    )
                ) from exc

            if _is_quota_error(exc):
                quota_errors.append(f"{key_name}: {message}")
                last_exc = exc
                continue

            raise LLMError(f"Gemini request failed using {key_name}: {exc}") from exc

    details = "; ".join(quota_errors) or "quota exceeded"
    raise LLMError(
        "Gemini request failed: quota exceeded for all configured keys. "
        f"Tried {', '.join(name for name, _ in api_keys)}. Details: {details}."
    ) from last_exc


def chat(
    messages: Iterable[Dict[str, str]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    """
    Single entrypoint used across backend.
    """
    return gemini_chat(messages, model=model, temperature=temperature)


__all__ = ["chat", "gemini_chat", "LLMError"]
