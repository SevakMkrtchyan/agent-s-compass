import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Buyer } from "@/types";

interface RecommendedAction {
  id: string;
  label: string;
  command: string;
  type: "artifact" | "thinking";
}

interface BuyerContext {
  name: string;
  email?: string;
  currentStage: number;
  financingConfirmed: boolean;
  buyerType?: string;
  marketContext?: string;
  recentActivity?: string[];
  buyerId?: string;
}

interface UseAgentGPTReturn {
  isLoading: boolean;
  error: string | null;
  fetchRecommendedActions: (buyer: Buyer) => Promise<RecommendedAction[]>;
  generateArtifact: (command: string, buyer: Buyer) => Promise<string>;
  generateThinking: (command: string, buyer: Buyer) => Promise<string>;
  clearError: () => void;
}

function buyerToContext(buyer: Buyer): BuyerContext {
  return {
    name: buyer.name,
    email: buyer.email,
    currentStage: buyer.currentStage,
    financingConfirmed: buyer.financingConfirmed,
    buyerType: buyer.buyerType,
    marketContext: buyer.marketContext,
    recentActivity: [],
    buyerId: buyer.id,
  };
}

export function useAgentGPT(): UseAgentGPTReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const callAgentGPT = async (
    command: string,
    intent: "actions" | "artifact" | "thinking",
    buyerContext: BuyerContext
  ) => {
    const { data, error: fnError } = await supabase.functions.invoke("agentgpt-chat", {
      body: { command, intent, buyerContext },
    });

    if (fnError) {
      throw new Error(fnError.message || "Failed to reach AgentGPT");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  };

  const fetchRecommendedActions = useCallback(async (buyer: Buyer): Promise<RecommendedAction[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to get cached recommendations from Supabase
      const { data: cached } = await supabase
        .from("buyer_recommendations")
        .select("actions_json, expires_at, status")
        .eq("buyer_id", buyer.id)
        .eq("status", "valid")
        .maybeSingle();

      if (cached && new Date(cached.expires_at) > new Date()) {
        const actions = cached.actions_json as unknown as RecommendedAction[];
        if (Array.isArray(actions) && actions.length > 0) {
          return actions.map((action: any, index: number) => ({
            id: action.id || String(index + 1),
            label: action.label || "Action",
            command: action.command || "",
            type: action.type === "thinking" ? "thinking" : "artifact",
          }));
        }
      }

      // Fetch fresh recommendations from Claude
      const context = buyerToContext(buyer);
      const result = await callAgentGPT("", "actions", context);

      if (result?.actions && Array.isArray(result.actions)) {
        return result.actions.map((action: any, index: number) => ({
          id: action.id || String(index + 1),
          label: action.label || "Action",
          command: action.command || "",
          type: action.type === "thinking" ? "thinking" : "artifact",
        }));
      }

      throw new Error("Invalid response format");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateArtifact = useCallback(async (command: string, buyer: Buyer): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const context = buyerToContext(buyer);
      const result = await callAgentGPT(command, "artifact", context);

      if (result?.content) {
        return result.content;
      }

      throw new Error("No content generated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate content";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateThinking = useCallback(async (command: string, buyer: Buyer): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const context = buyerToContext(buyer);
      const result = await callAgentGPT(command, "thinking", context);

      if (result?.content) {
        return result.content;
      }

      throw new Error("No analysis generated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate analysis";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchRecommendedActions,
    generateArtifact,
    generateThinking,
    clearError,
  };
}
