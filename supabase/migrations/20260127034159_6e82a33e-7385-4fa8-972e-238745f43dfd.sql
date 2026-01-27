-- Create the tasks table for task management
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  assigned_to TEXT NOT NULL DEFAULT 'Agent' CHECK (assigned_to IN ('Agent', 'Buyer', 'Third Party')),
  assigned_to_name TEXT,
  status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Complete')),
  completed_at TIMESTAMP WITH TIME ZONE,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  source_action_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: agents can only see their own tasks
CREATE POLICY "Agents can view their own tasks"
ON public.tasks
FOR SELECT
USING (true);

CREATE POLICY "Agents can insert their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Agents can update their own tasks"
ON public.tasks
FOR UPDATE
USING (true);

CREATE POLICY "Agents can delete their own tasks"
ON public.tasks
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX idx_tasks_buyer_id ON public.tasks(buyer_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);