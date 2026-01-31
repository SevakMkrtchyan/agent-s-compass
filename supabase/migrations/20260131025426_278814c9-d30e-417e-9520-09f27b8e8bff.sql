-- Add budget band columns to buyers table
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS conservative_min numeric NULL,
ADD COLUMN IF NOT EXISTS conservative_max numeric NULL,
ADD COLUMN IF NOT EXISTS target_min numeric NULL,
ADD COLUMN IF NOT EXISTS target_max numeric NULL,
ADD COLUMN IF NOT EXISTS stretch_min numeric NULL,
ADD COLUMN IF NOT EXISTS stretch_max numeric NULL;