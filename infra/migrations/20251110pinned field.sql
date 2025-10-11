-- Add pinned field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN pinned boolean NOT NULL DEFAULT false;

-- Create index for better performance when sorting by pinned
CREATE INDEX idx_campaigns_pinned ON public.campaigns(pinned DESC, created_at DESC);