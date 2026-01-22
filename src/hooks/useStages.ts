import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NextAction {
  id: string;
  label: string;
  type: "task" | "generate";
}

export interface Artifact {
  id: string;
  title: string;
  visibility: "internal" | "buyer_approval_required" | "buyer_visible";
}

export interface DbStage {
  id: string;
  stage_number: number;
  stage_name: string;
  stage_objective: string | null;
  next_actions: NextAction[];
  artifacts: Artifact[];
  completion_criteria: string[];
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
      return (data as unknown) as DbStage[];
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
      return (data as unknown) as DbStage;
    },
  });
}

export function useStageByName(stageName: string | null) {
  return useQuery({
    queryKey: ["stages", "byName", stageName],
    queryFn: async () => {
      if (!stageName) return null;
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("stage_name", stageName)
        .single();
      if (error) throw error;
      return (data as unknown) as DbStage;
    },
    enabled: !!stageName,
  });
}
