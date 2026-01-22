import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbStage {
  id: string;
  stage_number: number;
  stage_name: string;
  stage_objective: string | null;
  next_actions: unknown[];
  artifacts: unknown[];
  completion_criteria: unknown[];
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export function useStages() {
  return useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .order("stage_number", { ascending: true });
      if (error) throw error;
      return data as DbStage[];
    },
  });
}

export function useStage(stageNumber: number) {
  return useQuery({
    queryKey: ["stages", stageNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("stage_number", stageNumber)
        .single();
      if (error) throw error;
      return data as DbStage;
    },
  });
}
