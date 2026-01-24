import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Buyer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  buyer_type: string | null;
  current_stage: string | null;
  budget_min: number | null;
  budget_max: number | null;
  pre_approval_status: string | null;
  pre_approval_amount: number | null;
  min_beds: number | null;
  min_baths: number | null;
  preferred_cities: string[] | null;
  property_types: string[] | null;
  must_haves: string | null;
  nice_to_haves: string | null;
  agent_notes: string | null;
  portal_link: string | null;
  agent_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBuyerInput {
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  buyer_type?: string;
  budget_min?: number;
  budget_max?: number;
  pre_approval_status?: string;
  pre_approval_amount?: number;
  min_beds?: number;
  min_baths?: number;
  preferred_cities?: string[];
  property_types?: string[];
  must_haves?: string;
  nice_to_haves?: string;
  agent_notes?: string;
  portal_link?: string;
  current_stage?: string;
}

export interface UpdateBuyerInput {
  id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  buyer_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  pre_approval_status?: string | null;
  pre_approval_amount?: number | null;
  min_beds?: number | null;
  min_baths?: number | null;
  preferred_cities?: string[] | null;
  property_types?: string[] | null;
  must_haves?: string | null;
  nice_to_haves?: string | null;
  agent_notes?: string | null;
  portal_link?: string | null;
  current_stage?: string | null;
}

// Placeholder agent ID - in a real app this would come from auth
const PLACEHOLDER_AGENT_ID = "00000000-0000-0000-0000-000000000001";

export function useBuyers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: buyers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["buyers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Buyer[];
    },
  });

  const createBuyer = useMutation({
    mutationFn: async (input: CreateBuyerInput) => {
      const { data, error } = await supabase
        .from("buyers")
        .insert({
          ...input,
          agent_id: PLACEHOLDER_AGENT_ID,
          current_stage: "Home Search",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    onSuccess: (newBuyer) => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer created",
        description: `Workspace created for ${newBuyer.name}`,
      });
    },
    onError: (error) => {
      console.error("Error creating buyer:", error);
      toast({
        title: "Error creating buyer",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBuyer = useMutation({
    mutationFn: async (input: UpdateBuyerInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("buyers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    onSuccess: (updatedBuyer) => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer updated",
        description: `${updatedBuyer.name}'s profile has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Error updating buyer:", error);
      toast({
        title: "Error updating buyer",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteBuyer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("buyers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast({
        title: "Buyer deleted",
        description: "The buyer has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting buyer:", error);
      toast({
        title: "Error deleting buyer",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    buyers,
    isLoading,
    error,
    refetch,
    createBuyer,
    updateBuyer,
    deleteBuyer,
  };
}

export function useBuyer(id: string | undefined) {
  return useQuery({
    queryKey: ["buyers", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("buyers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Buyer;
    },
    enabled: !!id,
  });
}
