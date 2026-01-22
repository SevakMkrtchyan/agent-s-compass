-- Create artifacts table for storing agent-generated content
CREATE TABLE public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'shared')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shared_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (matching other tables in the project)
CREATE POLICY "Allow all operations on artifacts"
ON public.artifacts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster buyer lookups
CREATE INDEX idx_artifacts_buyer_id ON public.artifacts(buyer_id);
CREATE INDEX idx_artifacts_visibility ON public.artifacts(visibility);