-- Create buyers table
CREATE TABLE public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Buyer profile
  buyer_type TEXT,
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  pre_approval_amount DECIMAL(12,2),
  pre_approval_status TEXT DEFAULT 'Not Started',
  
  -- Preferences
  preferred_cities TEXT[],
  property_types TEXT[],
  min_beds INTEGER,
  min_baths DECIMAL(3,1),
  
  -- Wants & needs
  must_haves TEXT,
  nice_to_haves TEXT,
  agent_notes TEXT,
  
  -- Stage
  current_stage TEXT DEFAULT 'Home Search',
  
  -- Portal
  portal_link TEXT UNIQUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add missing column to buyer_properties
ALTER TABLE public.buyer_properties
  ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- Add unique constraint to prevent duplicate buyer-property assignments
ALTER TABLE public.buyer_properties
  ADD CONSTRAINT buyer_properties_buyer_property_unique UNIQUE (buyer_id, property_id);

-- Enable RLS on buyers table
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- Create policy for buyers (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on buyers" 
ON public.buyers 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(city, state, zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_beds_baths ON public.properties(bedrooms, bathrooms);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_buyer ON public.buyer_properties(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_properties_favorited ON public.buyer_properties(buyer_id, favorited) WHERE favorited = TRUE;
CREATE INDEX IF NOT EXISTS idx_buyer_properties_archived ON public.buyer_properties(buyer_id, archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_buyers_agent ON public.buyers(agent_id);

-- Add trigger for updated_at on buyers
CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();