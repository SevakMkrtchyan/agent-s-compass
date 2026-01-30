export interface Task {
  id: string;
  agent_id: string;
  buyer_id: string | null;
  stage_id: string | null;
  property_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'High' | 'Medium' | 'Low';
  assigned_to: 'Agent' | 'Buyer' | 'Third Party';
  assigned_to_name: string | null;
  status: 'To Do' | 'In Progress' | 'Complete';
  completed_at: string | null;
  parent_task_id: string | null;
  source_action_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  buyer?: {
    id: string;
    name: string;
  } | null;
  stage?: {
    id: string;
    stage_name: string;
    stage_number: number;
  } | null;
  property?: {
    id: string;
    address: string;
    city: string;
    state: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
  } | null;
}

export interface CreateTaskInput {
  agent_id: string;
  buyer_id?: string | null;
  stage_id?: string | null;
  property_id?: string | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'High' | 'Medium' | 'Low';
  assigned_to?: 'Agent' | 'Buyer' | 'Third Party';
  assigned_to_name?: string | null;
  status?: 'To Do' | 'In Progress' | 'Complete';
  parent_task_id?: string | null;
  source_action_id?: string | null;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: 'High' | 'Medium' | 'Low';
  assigned_to?: 'Agent' | 'Buyer' | 'Third Party';
  assigned_to_name?: string | null;
  status?: 'To Do' | 'In Progress' | 'Complete';
  completed_at?: string | null;
}
