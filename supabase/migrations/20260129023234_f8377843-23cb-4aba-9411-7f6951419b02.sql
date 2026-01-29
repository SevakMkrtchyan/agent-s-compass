-- Add analysis_status column to track background processing
ALTER TABLE public.offer_templates 
ADD COLUMN analysis_status TEXT NOT NULL DEFAULT 'pending';

-- Add analysis_error to store error messages if analysis fails
ALTER TABLE public.offer_templates 
ADD COLUMN analysis_error TEXT;

-- Add analyzed_at timestamp
ALTER TABLE public.offer_templates 
ADD COLUMN analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for quick filtering by status
CREATE INDEX idx_offer_templates_analysis_status ON public.offer_templates(analysis_status);