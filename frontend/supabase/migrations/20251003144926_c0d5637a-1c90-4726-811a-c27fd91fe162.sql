-- Create enum for campaign status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'processing', 'completed', 'failed');

-- Create enum for agent types
CREATE TYPE public.agent_type AS ENUM ('research', 'content', 'design', 'analytics', 'strategy');

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM ('free', 'plus', 'pro');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  orchestrator_prompt TEXT,
  additional_notes TEXT,
  audio_transcript TEXT,
  audio_context_request TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  selected_agents agent_type[] DEFAULT '{}',
  artifacts_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audio_files table for file tracking
CREATE TABLE public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  transcript TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for audio_files
CREATE POLICY "Users can view audio files from their campaigns"
  ON public.audio_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = audio_files.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audio files to their campaigns"
  ON public.audio_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = audio_files.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-audio', 'campaign-audio', false);

-- Storage policies for audio files
CREATE POLICY "Users can upload audio to their campaigns"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'campaign-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX idx_audio_files_campaign_id ON public.audio_files(campaign_id);