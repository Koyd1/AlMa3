-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audio_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  transcript text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audio_files_pkey PRIMARY KEY (id),
  CONSTRAINT audio_files_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  orchestrator_prompt text,
  additional_notes text,
  audio_transcript text,
  audio_context_request text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::campaign_status,
  selected_agents ARRAY DEFAULT '{}'::agent_type[],
  artifacts_path text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  board text,
  todo jsonb,
  pinned boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.orchestrator_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  agent_name text NOT NULL,
  step text,
  status text CHECK (status = ANY (ARRAY['success'::text, 'failed'::text])),
  results text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orchestrator_results_pkey PRIMARY KEY (id),
  CONSTRAINT orchestrator_results_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  subscription_plan USER-DEFINED NOT NULL DEFAULT 'free'::subscription_plan,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
