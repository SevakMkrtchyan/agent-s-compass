-- Enable pgvector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Create buyer_data table for storing buyer context
CREATE TABLE IF NOT EXISTS public.buyer_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for buyer_id lookups
CREATE INDEX IF NOT EXISTS buyer_data_buyer_id_idx ON public.buyer_data (buyer_id);
CREATE INDEX IF NOT EXISTS buyer_data_type_idx ON public.buyer_data (data_type);

-- Create market_feeds table for LA inventory, rates, etc.
CREATE TABLE IF NOT EXISTS public.market_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance_rules table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prerequisites TEXT[],
  blocked_actions TEXT[],
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

-- Public policies for edge functions
CREATE POLICY "Allow all operations on buyer_data" ON public.buyer_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on market_feeds" ON public.market_feeds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on compliance_rules" ON public.compliance_rules FOR ALL USING (true) WITH CHECK (true);

-- Function for similarity search on buyer data
CREATE OR REPLACE FUNCTION match_buyer_context(
  query_embedding vector(1536),
  match_buyer_id TEXT,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  buyer_id TEXT,
  data_type TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id,
    bd.buyer_id,
    bd.data_type,
    bd.content,
    bd.metadata,
    1 - (bd.embedding <=> query_embedding) as similarity
  FROM public.buyer_data bd
  WHERE bd.buyer_id = match_buyer_id
    AND bd.embedding IS NOT NULL
    AND 1 - (bd.embedding <=> query_embedding) > match_threshold
  ORDER BY bd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for market feed search
CREATE OR REPLACE FUNCTION match_market_feeds(
  query_embedding vector(1536),
  match_count INT DEFAULT 3,
  match_threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  feed_type TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id,
    mf.feed_type,
    mf.content,
    mf.metadata,
    1 - (mf.embedding <=> query_embedding) as similarity
  FROM public.market_feeds mf
  WHERE mf.embedding IS NOT NULL
    AND 1 - (mf.embedding <=> query_embedding) > match_threshold
  ORDER BY mf.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Insert initial CA compliance rules
INSERT INTO public.compliance_rules (rule_code, title, description, prerequisites, blocked_actions) VALUES
('CA-BR-11', 'Buyer Representation Agreement', 'California requires a signed Buyer Representation Agreement (BR-11) before making offers on behalf of a buyer.', ARRAY['Stage 0 complete', 'Financing pre-approval'], ARRAY['submit_offer', 'make_offer', 'write_offer']),
('CA-TDS', 'Transfer Disclosure Statement', 'Seller must provide Transfer Disclosure Statement before close of escrow.', ARRAY['Under contract'], ARRAY['close_escrow']),
('CA-AGENCY', 'Agency Disclosure', 'Agency relationships must be disclosed before providing confidential advice.', ARRAY['Initial consultation']::TEXT[], ARRAY['provide_negotiation_strategy']),
('CA-FAIR-HOUSING', 'Fair Housing Compliance', 'All property recommendations must comply with California Fair Housing laws.', ARRAY['Buyer onboarded']::TEXT[], ARRAY['property_filtering']::TEXT[])
ON CONFLICT (rule_code) DO NOTHING;