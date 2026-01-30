-- Add portal_token column to buyers table for portal authentication
ALTER TABLE public.buyers ADD COLUMN IF NOT EXISTS portal_token text UNIQUE;

-- Create an index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_buyers_portal_token ON public.buyers(portal_token);

-- Create a function to generate portal tokens
CREATE OR REPLACE FUNCTION public.generate_portal_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
BEGIN
  -- Generate a random 32-character alphanumeric token
  token := encode(gen_random_bytes(24), 'base64');
  -- Replace URL-unsafe characters
  token := replace(replace(token, '+', 'x'), '/', 'y');
  RETURN token;
END;
$$;