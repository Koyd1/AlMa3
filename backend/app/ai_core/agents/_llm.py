from __future__ import annotations

import os
from typing import Any, Dict, Iterable, List, NamedTuple, Optional, Tuple

import google.generativeai as genai


class LLMError(RuntimeError):
    """Raised when the LLM API returns an error."""


class _GeminiCredential(NamedTuple):
    key_name: str
    api_key: str
    model_override: Optional[str]


def _get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """Reads environment variable, returns default if not found."""
    return os.getenv(key, default)


def _collect_gemini_credentials() -> List[_GeminiCredential]:
    """Collect available Gemini API keys with optional model overrides."""

    def append(name: str, seen: set[str], items: List[_GeminiCredential]) -> None:
        value = _get_env(name)
        if not value or value in seen:
            return

        prefix_key = "GEMINI_API_KEY"
        if name.startswith(prefix_key):
            suffix = name[len(prefix_key) :]
        else:
            suffix = ""

        if suffix:
            model_env = f"GEMINI_MODEL{suffix}"
        else:
            model_env = "GEMINI_MODEL"

        override_raw = _get_env(model_env)
        override = _normalize_gemini_model(override_raw) if override_raw else None

        items.append(_GeminiCredential(name, value, override))
        seen.add(value)

    collected: List[_GeminiCredential] = []
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
        return "models/gemini-2.5-flash"

    normalized = raw.strip()
    lower = normalized.lower()

    alias_map = {
        "gemini-2.5-flash": "models/gemini-2.5-flash",
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


def _describe_empty_response(response: Any, error: Optional[Exception] = None) -> str:
    """Compose debug info for empty Gemini responses."""

    details: List[str] = []

    candidates = getattr(response, "candidates", None) or []
    first_candidate = candidates[0] if candidates else None

    finish_reason = getattr(first_candidate, "finish_reason", None)
    if finish_reason is not None:
        details.append(f"finish_reason={finish_reason}")

    block_reason = getattr(getattr(response, "prompt_feedback", None), "block_reason", None)
    if block_reason:
        details.append(f"block_reason={block_reason}")

    safety = getattr(first_candidate, "safety_ratings", None)
    if safety:
        details.append(f"safety={safety}")

    if error:
        details.append(f"exception={error}")

    return ", ".join(details) if details else "empty response"


def _extract_text_from_response(response: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract plain text from Gemini response.

    Returns a tuple of (text, debug_info). When text is None, debug_info
    contains a short explanation.
    """

    candidates = getattr(response, "candidates", None) or []
    collected: List[str] = []

    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            text = getattr(part, "text", None)
            if text:
                collected.append(text)

    if collected:
        combined = "\n".join(collected).strip()
        if combined:
            return combined, None

    try:
        text_prop = response.text  # type: ignore[attr-defined]
    except Exception as exc:
        return None, _describe_empty_response(response, exc)

    if isinstance(text_prop, str) and text_prop.strip():
        return text_prop.strip(), None

    return None, _describe_empty_response(response)


_FALLBACK_MODELS = [
    "models/gemini-2.5-flash",
]


def _candidate_models(primary: str, default: str) -> List[str]:
    order: List[str] = []
    for candidate in (primary, default, *_FALLBACK_MODELS):
        if not candidate:
            continue
        normalized = _normalize_gemini_model(candidate)
        if normalized not in order:
            order.append(normalized)
    return order


def _get_gemini_model_name() -> str:
    """Resolve model name or fallback to a stable flash model."""

    return _normalize_gemini_model(_get_env("GEMINI_MODEL"))


def _get_max_output_tokens() -> int:
    """Resolve max output tokens for Gemini completions."""

    raw = _get_env("GEMINI_MAX_OUTPUT_TOKENS")
    if raw:
        try:
            value = int(raw)
            if value > 0:
                return value
        except ValueError:
            pass
    return 8192


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
    model_name = _normalize_gemini_model(model) if model else _get_gemini_model_name()

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

    credentials = _collect_gemini_credentials()
    if not credentials:
        raise LLMError("❌ GEMINI_API_KEY is not set in environment variables.")

    quota_errors: List[str] = []
    not_found_errors: List[str] = []
    empty_responses: List[str] = []
    last_exc: Optional[Exception] = None

    for cred in credentials:
        key_name, api_key, override_model = cred
        active_model = override_model or model_name
        models_to_try = _candidate_models(active_model, model_name)

        genai.configure(api_key=api_key)

        for candidate_model in models_to_try:
            try:
                model_obj = genai.GenerativeModel(candidate_model)
                response = model_obj.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=_get_max_output_tokens(),
                        candidate_count=1,
                    ),
                )
            except Exception as exc:
                message = str(exc)
                tag = f"{key_name}@{candidate_model}"

                if "404" in message or "not_found" in message.lower():
                    not_found_errors.append(f"{tag}: {message}")
                    last_exc = exc
                    continue

                if _is_quota_error(exc):
                    quota_errors.append(f"{tag}: {message}")
                    last_exc = exc
                    break

                raise LLMError(f"Gemini request failed using {tag}: {exc}") from exc

            text, debug_info = _extract_text_from_response(response)
            if text:
                return text

            explanation = debug_info or "empty response"
            empty_responses.append(f"{key_name}@{candidate_model}: {explanation}")
            last_exc = RuntimeError(explanation)
        else:
            # All candidate models exhausted for this credential
            continue

        # If we hit a quota error we break to next credential without trying other models
        continue

    tried = ", ".join(cred.key_name for cred in credentials)

    if not_found_errors:
        details = "; ".join(not_found_errors)
        raise LLMError(
            "Gemini request failed: requested model is unavailable for all configured keys. "
            f"Tried {tried}. Details: {details}."
        ) from last_exc

    if empty_responses:
        details = "; ".join(empty_responses)
        raise LLMError(
            "Gemini request failed: received empty responses for all configured keys. "
            f"Tried {tried}. Details: {details}."
        ) from last_exc

    details = "; ".join(quota_errors) or "quota exceeded"
    raise LLMError(
        "Gemini request failed: quota exceeded for all configured keys. "
        f"Tried {tried}. Details: {details}."
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
