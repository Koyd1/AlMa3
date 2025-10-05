from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, TypedDict, cast

# ✅ Исправленные импорты
from app.ai_core.agents import manager
from app.ai_core.agents.registry import (
    AGENT_REGISTRY,
    DEFAULT_AGENT_SEQUENCE,
    DEFAULT_SUMMARY_AGENTS,
)
from app.ai_core.memory.rag import init_project


class CampaignState(TypedDict, total=False):
    run_id: str
    brief: str
    model: Optional[str]
    project_title: str
    selected_agents: List[str]
    agents_for_summary: List[str]
    meeting_summary: str
    transcript_raw: str
    transcript_clean: str
    audio_path: str
    plan: str
    icp: str
    concepts: str
    copy: str
    summary: str
    artifacts: List[str]
    board: Dict[str, Dict[str, Any]]
    todo: List[Dict[str, Any]]
    interrupted: bool


def _normalize_agent_ids(agent_ids: Sequence[str] | None) -> List[str]:
    if not agent_ids:
        return list(DEFAULT_AGENT_SEQUENCE)

    valid = [agent_id for agent_id in agent_ids if agent_id in AGENT_REGISTRY]
    # Сохраняем порядок, определенный DEFAULT_AGENT_SEQUENCE
    ordering = {agent_id: idx for idx, agent_id in enumerate(DEFAULT_AGENT_SEQUENCE)}
    return sorted(valid, key=lambda agent_id: ordering.get(agent_id, len(ordering)))


def _normalize_summary_agents(
    agents_for_summary: Sequence[str] | None,
    selected_agents: Sequence[str],
) -> List[str]:
    if not agents_for_summary:
        defaults = [
            agent_id for agent_id in DEFAULT_SUMMARY_AGENTS if agent_id in selected_agents
        ]
        return defaults or list(selected_agents)
    normalized = [agent_id for agent_id in agents_for_summary if agent_id in selected_agents]
    return normalized or list(selected_agents)


def prepare_initial_state(
    brief: str,
    *,
    model: Optional[str] = None,
    project_title: Optional[str] = None,
    extra_documents: Optional[Dict[str, str]] = None,
    selected_agents: Optional[Sequence[str]] = None,
    agents_for_summary: Optional[Sequence[str]] = None,
    meeting_summary: Optional[str] = None,
    transcript_raw: Optional[str] = None,
    transcript_clean: Optional[str] = None,
    audio_path: Optional[str] = None,
) -> CampaignState:
    run_id = f"run-{uuid.uuid4().hex[:8]}"
    init_project(run_id, brief, extra_documents)

    normalized_agents = _normalize_agent_ids(selected_agents)
    normalized_summary_agents = _normalize_summary_agents(
        agents_for_summary, normalized_agents
    )

    state = CampaignState(
        run_id=run_id,
        brief=brief,
        model=model,
        project_title=project_title or "Маркетинговая кампания",
        artifacts=[],
        board={},
        selected_agents=normalized_agents,
        agents_for_summary=normalized_summary_agents,
    )

    if meeting_summary:
        state["meeting_summary"] = meeting_summary
    if transcript_raw:
        state["transcript_raw"] = transcript_raw
    if transcript_clean:
        state["transcript_clean"] = transcript_clean
    if audio_path:
        state["audio_path"] = audio_path

    return state


StepHandler = Callable[[Dict[str, Any]], Dict[str, Any]]


@dataclass(frozen=True)
class OrchestrationStep:
    id: str
    handler: StepHandler


def _iter_steps(selected_agents: Sequence[str]) -> Iterable[OrchestrationStep]:
    yield OrchestrationStep("manager_plan", manager.plan)
    for agent_id in selected_agents:
        agent_cfg = AGENT_REGISTRY[agent_id]
        yield OrchestrationStep(agent_cfg.id, agent_cfg.handler)
    yield OrchestrationStep("manager_summary", manager.assemble)


def run_campaign(
    state: CampaignState,
    *,
    stop_signal: Callable[[], bool] | None = None,
    on_step: Callable[[str, CampaignState], None] | None = None,
) -> CampaignState:
    """Последовательно выполняет шаги оркестрации с возможностью остановки."""

    current_state: Dict[str, Any] = dict(state)
    selected_agents = _normalize_agent_ids(current_state.get("selected_agents"))
    current_state["selected_agents"] = selected_agents

    for step in _iter_steps(selected_agents):
        if stop_signal and stop_signal():
            current_state["interrupted"] = True
            break

        updates = step.handler(current_state)
        current_state.update(updates)

        if on_step:
            on_step(step.id, cast(CampaignState, dict(current_state)))

    return cast(CampaignState, current_state)


def stream_campaign(
    state: CampaignState,
    *,
    stop_signal: Callable[[], bool] | None = None,
) -> Iterable[Dict[str, Any]]:
    """Генерирует состояние после каждого шага."""

    current_state: Dict[str, Any] = dict(state)
    selected_agents = _normalize_agent_ids(current_state.get("selected_agents"))
    current_state["selected_agents"] = selected_agents

    for step in _iter_steps(selected_agents):
        if stop_signal and stop_signal():
            current_state["interrupted"] = True
            yield {"step": step.id, "state": dict(current_state), "status": "stopped"}
            break

        updates = step.handler(current_state)
        current_state.update(updates)
        yield {"step": step.id, "state": dict(current_state)}


__all__ = [
    "CampaignState",
    "prepare_initial_state",
    "run_campaign",
    "stream_campaign",
]
