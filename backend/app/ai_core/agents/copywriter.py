from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import Any, Dict

from app.ai_core.agents._llm import chat
from app.ai_core.memory.rag import get_context, save_artifact

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPT_TEXT = (BASE_DIR / "prompts" / "copywriter.md").read_text(encoding="utf-8")


def texts(state: Dict[str, Any]) -> Dict[str, Any]:
    brief: str = state["brief"]
    run_id: str = state["run_id"]
    icp: str = state.get("icp", "")
    concepts: str = state.get("concepts", "")
    model: str | None = state.get("model")

    context = get_context(run_id, query=concepts or icp or brief, k=5)

    response = chat(
        [
            {"role": "system", "content": PROMPT_TEXT},
            {
                "role": "user",
                "content": (
                    f"Brief:\n{brief}\n\nICP:\n{icp}\n\nConcepts:\n{concepts}\n\n"
                    f"Memory Context:\n{context}\n\n"
                    "Use the best of the proposed concepts and create texts."
                ),
            },
        ],
        model=model,
    )

    artifact = save_artifact(run_id, "copywriter_texts.md", response)

    board = deepcopy(state.get("board", {}))
    board.setdefault("copywriter_texts", {})
    board["copywriter_texts"].update({"status": "Done", "notes": response})

    artifacts = list(state.get("artifacts", []))
    artifacts.append(str(artifact))

    return {
        "copy": response,
        "artifacts": artifacts,
        "board": board,
    }


__all__ = ["texts"]
