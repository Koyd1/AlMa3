from __future__ import annotations

import os
from typing import Any, Dict, Iterable, Optional

import google.generativeai as genai


class LLMError(RuntimeError):
    """Raised when the LLM API returns an error."""


def _get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Reads environment variable, returns default if not found."""
    return os.getenv(key, default)


def _get_gemini_model_name() -> str:
    """Resolve model name or fallback to the latest flash model."""
    return _get_env("GEMINI_MODEL", "gemini-1.5-flash-latest")


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
        # Improve visibility for 404 or auth issues
        if "404" in str(exc):
            raise LLMError(
                f"❌ Gemini model '{model_name}' not found or unsupported. "
                f"Try using 'gemini-1.5-flash-latest'."
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
