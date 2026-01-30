-- Create buyer_portal_messages table for chat persistence
CREATE TABLE public.buyer_portal_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient buyer message retrieval
CREATE INDEX idx_buyer_portal_messages_buyer_id ON public.buyer_portal_messages(buyer_id);
CREATE INDEX idx_buyer_portal_messages_created_at ON public.buyer_portal_messages(buyer_id, created_at);

-- Enable RLS
ALTER TABLE public.buyer_portal_messages ENABLE ROW LEVEL SECURITY;

-- Allow all operations (token-based auth handled at app level)
CREATE POLICY "Allow all operations on buyer_portal_messages"
ON public.buyer_portal_messages
FOR ALL
USING (true)
WITH CHECK (true);