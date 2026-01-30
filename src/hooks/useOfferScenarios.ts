import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AIOfferScenario {
  id: string;
  name: string;
  offer_amount: number;
  earnest_money: number;
  contingencies: string[];
  rationale: string;
  competitiveness: "conservative" | "competitive" | "aggressive";
  status: "ready" | "pending";
}

interface GenerateResult {
  success: boolean;
  scenarios: AIOfferScenario[];
  property: {
    id: string;
    address: string;
    price: number;
  };
}

export function useOfferScenarios(buyerId: string) {
  const [scenarios, setScenarios] = useState<AIOfferScenario[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<{ address: string; price: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateScenarios = useCallback(async (propertyId: string) => {
    if (!propertyId || !buyerId) {
      toast({
        title: "Missing information",
        description: "Please select a property first.",
        variant: "destructive",
      });
      return false;
    }

    setIsGenerating(true);
    setError(null);
    setScenarios([]);
    setSelectedPropertyId(propertyId);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<GenerateResult>(
        "generate-offer-scenarios",
        {
          body: {
            property_id: propertyId,
            buyer_id: buyerId,
          },
        }
      );

      if (fnError) {
        console.error("[useOfferScenarios] Function error:", fnError);
        throw new Error(fnError.message || "Failed to generate scenarios");
      }

      if (!data?.success || !data?.scenarios) {
        throw new Error("Invalid response from AI service");
      }

      setScenarios(data.scenarios);
      setPropertyInfo({
        address: data.property.address,
        price: data.property.price,
      });

      toast({
        title: "Scenarios Generated",
        description: `Created ${data.scenarios.length} offer strategies for ${data.property.address}`,
      });

      return true;
    } catch (err) {
      console.error("[useOfferScenarios] Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate scenarios";
      setError(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [buyerId]);

  const clearScenarios = useCallback(() => {
    setScenarios([]);
    setSelectedPropertyId(null);
    setPropertyInfo(null);
    setError(null);
  }, []);

  return {
    scenarios,
    isGenerating,
    selectedPropertyId,
    propertyInfo,
    error,
    generateScenarios,
    clearScenarios,
    setSelectedPropertyId,
  };
}
