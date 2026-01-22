-- Create stage_completion table to track completion criteria for buyers
CREATE TABLE public.stage_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  criteria_index INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, stage_number, criteria_index)
);

-- Enable Row Level Security
ALTER TABLE public.stage_completion ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (matching existing pattern)
CREATE POLICY "Allow all operations on stage_completion"
ON public.stage_completion
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_stage_completion_updated_at
BEFORE UPDATE ON public.stage_completion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();