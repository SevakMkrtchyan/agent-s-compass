-- Create table for caching buyer recommendations (instant load)
CREATE TABLE public.buyer_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  actions_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'stale', 'refreshing'))
);

-- Create index for fast lookups by buyer_id
CREATE INDEX idx_buyer_recommendations_buyer_id ON public.buyer_recommendations(buyer_id);

-- Create index for expiration cleanup
CREATE INDEX idx_buyer_recommendations_expires ON public.buyer_recommendations(expires_at);

-- Enable RLS (public read/write for now since no auth)
ALTER TABLE public.buyer_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust when auth is added)
CREATE POLICY "Allow all operations on buyer_recommendations"
ON public.buyer_recommendations
FOR ALL
USING (true)
WITH CHECK (true);