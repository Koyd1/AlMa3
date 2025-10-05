from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from typing import Any, Dict

from app.ai_core.agents._llm import chat
from app.ai_core.memory.rag import get_context, save_artifact

BASE_DIR = Path(__file__).resolve().parent.parent
PROMPT_TEXT = (BASE_DIR / "prompts" / "technician.md").read_text(encoding="utf-8")


def blueprint(state: Dict[str, Any]) -> Dict[str, Any]:
    brief: str = state["brief"]
    run_id: str = state["run_id"]
    icp: str = state.get("icp", "")
    concepts: str = state.get("concepts", "")
    finance: str = state.get("finance", "")
    model: str | None = state.get("model")

    context_query = "\n\n".join(filter(None, [brief, icp, concepts, finance])) or brief
    context = get_context(run_id, query=context_query, k=5)

    response = chat(
        [
            {"role": "system", "content": PROMPT_TEXT},
            {
                "role": "user",
                "content": (
                    f"Brief:\n{brief}\n\nICP:\n{icp}\n\n"
                    f"Concepts:\n{concepts}\n\nFinancial Inputs:\n{finance}\n\n"
                    f"Context from Memory:\n{context}\n\nDescribe the technical implementation."
                ),
            },
        ],
        model=model,
    )

    artifact = save_artifact(run_id, "technician_blueprint.md", response)

    board = deepcopy(state.get("board", {}))
    board.setdefault("technician_blueprint", {})
    board["technician_blueprint"].update({"status": "Done", "notes": response})

    artifacts = list(state.get("artifacts", []))
    artifacts.append(str(artifact))

    return {
        "tech_plan": response,
        "artifacts": artifacts,
        "board": board,
    }


__all__ = ["blueprint"]
