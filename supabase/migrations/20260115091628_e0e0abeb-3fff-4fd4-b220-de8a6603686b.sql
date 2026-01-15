-- Create properties table for MLS listings
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mls_id TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC NOT NULL,
  sqft INTEGER NOT NULL,
  lot_size TEXT,
  year_built INTEGER,
  price_per_sqft NUMERIC,
  days_on_market INTEGER DEFAULT 0,
  property_type TEXT DEFAULT 'single_family',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'withdrawn')),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  listing_url TEXT,
  mls_number TEXT,
  listing_agent JSONB,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create buyer_properties junction table
CREATE TABLE public.buyer_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewed BOOLEAN DEFAULT false,
  scheduled_showing_datetime TIMESTAMP WITH TIME ZONE,
  favorited BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  agent_notes TEXT,
  ai_analysis TEXT,
  ai_analysis_generated_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, property_id)
);

-- Enable RLS on both tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_properties ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (app doesn't have auth yet)
CREATE POLICY "Allow all operations on properties"
  ON public.properties
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on buyer_properties"
  ON public.buyer_properties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_properties_mls_id ON public.properties(mls_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_buyer_properties_buyer_id ON public.buyer_properties(buyer_id);
CREATE INDEX idx_buyer_properties_property_id ON public.buyer_properties(property_id);
CREATE INDEX idx_buyer_properties_favorited ON public.buyer_properties(favorited) WHERE favorited = true;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_buyer_properties_updated_at
  BEFORE UPDATE ON public.buyer_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();