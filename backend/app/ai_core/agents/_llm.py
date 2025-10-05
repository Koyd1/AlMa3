from __future__ import annotations

import os
from typing import Any, Dict, Iterable, Optional

import requests

try:
    import streamlit as st
except ImportError:
    st = None  # Streamlit не всегда установлен

try:
    import google.generativeai as genai
except ImportError:
    genai = None


class LLMError(RuntimeError):
    """Raised when the LLM API returns an error."""


def _get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Читает из env или streamlit secrets"""
    value = os.getenv(key)
    if value:
        return value
    if st is not None:
        try:
            secret_value = st.secrets[key]
        except Exception:
            secret_value = None
        if secret_value is not None:
            return str(secret_value)
    return default


def _resolve_backend() -> str:
    backend = _get_setting("LLM_BACKEND")
    if backend:
        return backend.lower()
    if _get_setting("GEMINI_API_KEY"):
        return "gemini"
    return "ollama"


# 🔹 Ollama (локально)
def ollama_chat(
    messages: Iterable[Dict[str, str]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    model_name = model or _get_setting("OLLAMA_MODEL", "llama3.1:8b-instruct")
    base_url = (_get_setting("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
    payload: Dict[str, Any] = {
        "model": model_name,
        "messages": list(messages),
        "stream": False,
        "options": {"temperature": temperature},
    }
    try:
        resp = requests.post(f"{base_url}/api/chat", json=payload, timeout=180)
        resp.raise_for_status()
        data = resp.json()
        return (data.get("message") or {}).get("content", "").strip()
    except Exception as exc:
        raise LLMError(f"Ollama request failed: {exc}") from exc


# 🔹 Gemini (для Streamlit Cloud)
def gemini_chat(
    messages: Iterable[Dict[str, str]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    if genai is None:
        raise LLMError("google-generativeai is not installed")

    api_key = _get_setting("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("GEMINI_API_KEY is not set")

    genai.configure(api_key=api_key)
    model_name = model or _get_setting("GEMINI_MODEL", "gemini-1.5-flash")

    # Gemini не понимает openai-формат → склеиваем
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

    response = genai.GenerativeModel(model_name).generate_content(
        "".join(prompt_parts),
        generation_config={"temperature": temperature},
    )
    text = getattr(response, "text", None)
    if not text:
        raise LLMError("Gemini returned empty content")
    return text.strip()


# 🔹 Универсальная точка входа
def chat(
    messages: Iterable[Dict[str, str]],
    *,
    model: Optional[str] = None,
    temperature: float = 0.2,
) -> str:
    backend = _resolve_backend()
    if backend == "ollama":
        return ollama_chat(messages, model=model, temperature=temperature)
    if backend == "gemini":
        return gemini_chat(messages, model=model, temperature=temperature)
    raise LLMError(f"Unknown LLM_BACKEND: {backend}")


__all__ = ["chat", "LLMError", "ollama_chat", "gemini_chat"]
