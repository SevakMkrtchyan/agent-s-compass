import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Artifact {
  id: string;
  buyer_id: string;
  stage_id: string | null;
  artifact_type: string;
  title: string;
  content: string;
  visibility: "internal" | "shared";
  created_at: string;
  shared_at: string | null;
  created_by: string | null;
}

export interface CreateArtifactInput {
  buyer_id: string;
  stage_id?: string | null;
  artifact_type: string;
  title: string;
  content: string;
  visibility: "internal" | "shared";
}

export function useArtifacts(buyerId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: artifacts, isLoading, error } = useQuery({
    queryKey: ["artifacts", buyerId],
    queryFn: async () => {
      if (!buyerId) return [];
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Artifact[];
    },
    enabled: !!buyerId,
  });

  const createArtifact = useMutation({
    mutationFn: async (input: CreateArtifactInput) => {
      const { data, error } = await supabase
        .from("artifacts")
        .insert({
          buyer_id: input.buyer_id,
          stage_id: input.stage_id || null,
          artifact_type: input.artifact_type,
          title: input.title,
          content: input.content,
          visibility: input.visibility,
          shared_at: input.visibility === "shared" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Artifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artifacts", data.buyer_id] });
      const message = data.visibility === "shared" 
        ? "Artifact saved and shared with buyer" 
        : "Artifact saved as internal";
      toast({ title: message });
    },
    onError: (error) => {
      toast({
        title: "Failed to save artifact",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const shareArtifact = useMutation({
    mutationFn: async (artifactId: string) => {
      const { data, error } = await supabase
        .from("artifacts")
        .update({ 
          visibility: "shared", 
          shared_at: new Date().toISOString() 
        })
        .eq("id", artifactId)
        .select()
        .single();

      if (error) throw error;
      return data as Artifact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artifacts", data.buyer_id] });
      toast({ title: "Artifact shared with buyer" });
    },
    onError: (error) => {
      toast({
        title: "Failed to share artifact",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return {
    artifacts,
    isLoading,
    error,
    createArtifact: createArtifact.mutateAsync,
    shareArtifact: shareArtifact.mutateAsync,
    isCreating: createArtifact.isPending,
    isSharing: shareArtifact.isPending,
  };
}
