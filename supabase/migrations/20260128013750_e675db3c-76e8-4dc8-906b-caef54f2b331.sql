-- Create offer_templates table
CREATE TABLE public.offer_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx')),
  brokerage_id UUID NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer_template_fields table
CREATE TABLE public.offer_template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.offer_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('buyer', 'property', 'agent', 'manual')),
  source_field TEXT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'number', 'date', 'boolean')),
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  property_id UUID NULL REFERENCES public.properties(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.offer_templates(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL,
  offer_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Countered', 'Accepted', 'Rejected', 'Withdrawn')),
  field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_document_url TEXT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for offer_templates
CREATE POLICY "Allow all operations on offer_templates"
  ON public.offer_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for offer_template_fields
CREATE POLICY "Allow all operations on offer_template_fields"
  ON public.offer_template_fields
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for offers
CREATE POLICY "Allow all operations on offers"
  ON public.offers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at on offers
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_offer_template_fields_template_id ON public.offer_template_fields(template_id);
CREATE INDEX idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX idx_offers_property_id ON public.offers(property_id);
CREATE INDEX idx_offers_template_id ON public.offers(template_id);
CREATE INDEX idx_offers_agent_id ON public.offers(agent_id);
CREATE INDEX idx_offers_status ON public.offers(status);