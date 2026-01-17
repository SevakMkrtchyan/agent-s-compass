-- API usage logs for tracking RapidAPI calls
CREATE TABLE public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  user_id UUID,
  request_params JSONB,
  response_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Property cache for reducing API calls
CREATE TABLE public.property_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  zpid TEXT,
  data JSONB NOT NULL,
  source TEXT DEFAULT 'zillow',
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Enable RLS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_cache ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now, can restrict later)
CREATE POLICY "Allow all operations on api_logs" 
ON public.api_logs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on property_cache" 
ON public.property_cache FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);
CREATE INDEX idx_property_cache_key ON public.property_cache(cache_key);
CREATE INDEX idx_property_cache_expires ON public.property_cache(expires_at);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.property_cache WHERE expires_at < NOW();
END;
$$;