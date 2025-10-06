from __future__ import annotations

import errno
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

BASE_DIR = Path(__file__).resolve().parent.parent


def _init_artifact_root() -> Path:
    env_root = os.getenv("ARTIFACT_ROOT")
    if env_root:
        root = Path(env_root)
        root.mkdir(parents=True, exist_ok=True)
        return root

    default_root = BASE_DIR / "artifacts"
    try:
        default_root.mkdir(parents=True, exist_ok=True)
        return default_root
    except OSError as exc:  # Vercel uses a read-only filesystem under /var/task
        if exc.errno not in (errno.EROFS, errno.EPERM):
            raise

    fallback_root = Path(tempfile.gettempdir()) / "ai_core_artifacts"
    fallback_root.mkdir(parents=True, exist_ok=True)
    return fallback_root


ARTIFACT_ROOT = _init_artifact_root()

# Простое хранилище в памяти
_IN_MEMORY_STORE: Dict[str, List[str]] = {}


@dataclass
class ArtifactRecord:
    path: Path
    title: str


def init_project(run_id: str, brief: str, extra_documents: Dict[str, str] | None = None) -> None:
    """Инициализация проекта: сохраняем бриф и доп. документы в память"""
    ARTIFACT_ROOT.joinpath(run_id).mkdir(parents=True, exist_ok=True)
    store = _IN_MEMORY_STORE.setdefault(run_id, [])
    store.clear()
    store.append(brief)
    if extra_documents:
        store.extend(extra_documents.values())


def upsert_document(run_id: str, content: str, *, source: str) -> None:
    """Добавить документ в память"""
    _IN_MEMORY_STORE.setdefault(run_id, []).append(content)


def get_context(run_id: str, query: str | None = None, k: int = 5) -> str:
    """Вернуть последние k документов из памяти"""
    docs = _IN_MEMORY_STORE.get(run_id, [])
    return "\n---\n".join(docs[-k:])


def save_artifact(run_id: str, filename: str, content: str, *, add_to_memory: bool = True) -> Path:
    """Сохранить артефакт на диск и в память"""
    run_dir = ARTIFACT_ROOT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    target = run_dir / filename
    target.write_text(content, encoding="utf-8")
    if add_to_memory:
        upsert_document(run_id, content, source=filename)
    return target


def list_artifacts(run_id: str) -> List[ArtifactRecord]:
    """Список артефактов для проекта"""
    run_dir = ARTIFACT_ROOT / run_id
    if not run_dir.exists():
        return []
    records: List[ArtifactRecord] = []
    for path in sorted(run_dir.glob("*.md")):
        records.append(
            ArtifactRecord(path=path, title=path.stem.replace("_", " ").title())
        )
    return records


__all__ = [
    "init_project",
    "get_context",
    "save_artifact",
    "list_artifacts",
    "upsert_document",
]
