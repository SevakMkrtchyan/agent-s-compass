import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";

// Temporary agent ID for development (will be replaced with auth)
const TEMP_AGENT_ID = "00000000-0000-0000-0000-000000000001";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          buyer:buyers(id, name),
          stage:stages(id, stage_name, stage_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Task[];
    },
  });
}

export function useTasksByBuyer(buyerId: string | undefined) {
  return useQuery({
    queryKey: ["tasks", "buyer", buyerId],
    queryFn: async (): Promise<Task[]> => {
      if (!buyerId) return [];
      
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          buyer:buyers(id, name),
          stage:stages(id, stage_name, stage_number)
        `)
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!buyerId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...input,
          agent_id: input.agent_id || TEMP_AGENT_ID,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, ...updates } = input;
      
      // If marking as complete, set completed_at
      if (updates.status === "Complete" && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
      // If un-completing, clear completed_at
      if (updates.status && updates.status !== "Complete") {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Function to create a task from a Next Action
export function useCreateTaskFromAction() {
  const createTask = useCreateTask();

  return useMutation({
    mutationFn: async ({
      actionId,
      actionLabel,
      buyerId,
      stageId,
      agentId,
    }: {
      actionId: string;
      actionLabel: string;
      buyerId: string;
      stageId?: string;
      agentId?: string;
    }) => {
      return createTask.mutateAsync({
        agent_id: agentId || TEMP_AGENT_ID,
        buyer_id: buyerId,
        stage_id: stageId || null,
        title: actionLabel,
        source_action_id: actionId,
        priority: "Medium",
        assigned_to: "Agent",
        status: "To Do",
      });
    },
  });
}
