-- =============================================================
-- Migration: Add orchestrator_results table and version tracking
-- Author: ChatGPT (AI Orchestrator schema enhancement)
-- =============================================================

-- 1️⃣ Добавляем поле version в таблицу campaigns
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.campaigns.version IS
'Номер версии кампании. Увеличивается при каждой перегенерации.';

-- Индекс для быстрого поиска по версии кампании
CREATE INDEX IF NOT EXISTS campaigns_version_idx
  ON public.campaigns (version);

-- =============================================================
-- 2️⃣ Создаём таблицу orchestrator_results
-- =============================================================

CREATE TABLE IF NOT EXISTS public.orchestrator_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  agent_name text NOT NULL,
  step text,
  status text CHECK (status IN ('success', 'failed')),
  results text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orchestrator_results IS
'Результаты работы отдельных агентов оркестратора (по шагам и версиям).';

COMMENT ON COLUMN public.orchestrator_results.version IS
'Версия результата (соответствует версии кампании).';

-- Индексы
CREATE INDEX IF NOT EXISTS orchestrator_results_campaign_id_idx
  ON public.orchestrator_results (campaign_id);

CREATE INDEX IF NOT EXISTS orchestrator_results_agent_name_idx
  ON public.orchestrator_results (agent_name);

CREATE INDEX IF NOT EXISTS orchestrator_results_version_idx
  ON public.orchestrator_results (version);

-- =============================================================
-- 3️⃣ Триггер для автозаполнения версии результатов
-- =============================================================

-- Функция для установки версии результатов = версии кампании
CREATE OR REPLACE FUNCTION public.set_result_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := (
    SELECT version FROM public.campaigns WHERE id = NEW.campaign_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер перед вставкой в orchestrator_results
CREATE TRIGGER set_orchestrator_result_version
BEFORE INSERT ON public.orchestrator_results
FOR EACH ROW
EXECUTE FUNCTION public.set_result_version();
