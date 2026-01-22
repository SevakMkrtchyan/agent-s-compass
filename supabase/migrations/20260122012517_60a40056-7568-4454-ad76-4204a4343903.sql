-- Create stages table
CREATE TABLE public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_number integer NOT NULL UNIQUE CHECK (stage_number >= 0 AND stage_number <= 9),
  stage_name text NOT NULL,
  stage_objective text,
  next_actions jsonb DEFAULT '[]'::jsonb,
  artifacts jsonb DEFAULT '[]'::jsonb,
  completion_criteria jsonb DEFAULT '[]'::jsonb,
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (stages are public configuration data)
CREATE POLICY "Allow read access to stages" ON public.stages
  FOR SELECT USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_stages_updated_at
  BEFORE UPDATE ON public.stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Stage 0
INSERT INTO public.stages (stage_number, stage_name, stage_objective, icon)
VALUES (
  0,
  'Readiness & Expectations',
  'Establish authority and trust through a structured consultation, define true buying criteria, set expectations for speed, competitiveness, and decision-making',
  '🎯'
);