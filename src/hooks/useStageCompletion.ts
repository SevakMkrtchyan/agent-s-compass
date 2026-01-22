import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StageCompletion {
  id: string;
  buyer_id: string;
  stage_number: number;
  criteria_index: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useStageCompletion(buyerId: string, stageNumber: number) {
  const queryClient = useQueryClient();

  const {
    data: completions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stage-completion", buyerId, stageNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_completion")
        .select("*")
        .eq("buyer_id", buyerId)
        .eq("stage_number", stageNumber)
        .order("criteria_index", { ascending: true });

      if (error) throw error;
      return data as StageCompletion[];
    },
    enabled: !!buyerId,
  });

  const toggleCriterion = useMutation({
    mutationFn: async ({
      criteriaIndex,
      isCompleted,
    }: {
      criteriaIndex: number;
      isCompleted: boolean;
    }) => {
      // Try to upsert - if it exists, update; if not, insert
      const { data, error } = await supabase
        .from("stage_completion")
        .upsert(
          {
            buyer_id: buyerId,
            stage_number: stageNumber,
            criteria_index: criteriaIndex,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          },
          { onConflict: "buyer_id,stage_number,criteria_index" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as StageCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stage-completion", buyerId, stageNumber],
      });
    },
  });

  // Helper to check if a specific criterion is completed
  const isCriterionCompleted = (criteriaIndex: number): boolean => {
    const completion = completions.find((c) => c.criteria_index === criteriaIndex);
    return completion?.is_completed ?? false;
  };

  // Helper to check if all criteria are completed
  const allCriteriaCompleted = (totalCriteria: number): boolean => {
    if (totalCriteria === 0) return false;
    for (let i = 0; i < totalCriteria; i++) {
      if (!isCriterionCompleted(i)) return false;
    }
    return true;
  };

  return {
    completions,
    isLoading,
    error,
    toggleCriterion,
    isCriterionCompleted,
    allCriteriaCompleted,
  };
}
