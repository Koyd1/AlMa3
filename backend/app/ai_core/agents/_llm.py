from __future__ import annotations

import os
from typing import Any, Dict, Iterable, Optional

import google.generativeai as genai


class LLMError(RuntimeError):
    """Raised when the LLM API returns an error."""


def _get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Reads environment variable, returns default if not found."""
    return os.getenv(key, default)


def _normalize_gemini_model(raw: Optional[str]) -> str:
    """Map common aliases and deprecated names to supported Gemini models."""

    if not raw:
        return "gemini-2.5-flash"

    normalized = raw.strip()
    lower = normalized.lower()

    alias_map = {
        "flash": "gemini-2.5-flash",
        "gemini-flash": "gemini-2.5-flash",
        "gemini-2.5-flash": "gemini-2.5-flash",
        "gemini-2.5-flash-latest": "gemini-2.5-flash",
        "gemini-2.5-flash-001": "gemini-2.5-flash",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-1.5-flash-001": "gemini-1.5-flash",
        "gemini-1.5-flash-latest": "gemini-1.5-flash",
        "pro": "gemini-1.5-pro",
        "gemini-pro": "gemini-1.5-pro",
        "gemini-1.5-pro-latest": "gemini-1.5-pro",
    }

    if lower in alias_map:
        return alias_map[lower]

    suffixes = ("-latest", "-001", "-002")
    for suffix in suffixes:
        if lower.endswith(suffix):
            candidate = normalized[: -len(suffix)]
            if candidate:
                return candidate

    return normalized


def _get_gemini_model_name() -> str:
    """Resolve model name or fallback to a stable flash model."""

    return _normalize_gemini_model(_get_env("GEMINI_MODEL"))


def _configure_gemini() -> None:
    """Configure Gemini API."""
    api_key = _get_env("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("❌ GEMINI_API_KEY is not set in environment variables.")
    genai.configure(api_key=api_key)


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
    _configure_gemini()

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

    try:
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
                "❌ Gemini model '{}' not found. "
                "Ensure GEMINI_MODEL matches an available model such as 'gemini-1.5-flash'.".format(
                    model_name
                )
            ) from exc
        raise LLMError(f"Gemini request failed: {exc}") from exc


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
