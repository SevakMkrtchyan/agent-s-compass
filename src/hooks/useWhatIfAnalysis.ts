import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhatIfAnalysis {
  strategy_assessment: string;
  likelihood: "High" | "Medium" | "Low";
  recommended_contingencies: string[];
  risks: string[];
  negotiation_tips: string[];
  competitiveness: "conservative" | "competitive" | "aggressive";
}

interface AnalysisContext {
  property_id: string;
  property_address: string;
  asking_price: number;
  offer_amount: number;
  diff_percent: number;
}

interface AnalysisResult {
  analysis: WhatIfAnalysis;
  context: AnalysisContext;
}

export function useWhatIfAnalysis(buyerId: string) {
  const [analysis, setAnalysis] = useState<WhatIfAnalysis | null>(null);
  const [context, setContext] = useState<AnalysisContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeOffer = useCallback(async (propertyId: string, offerAmount: number) => {
    if (!propertyId || !offerAmount) {
      setError("Property and offer amount are required");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("[useWhatIfAnalysis] Analyzing offer:", { propertyId, offerAmount, buyerId });

      const { data, error: fnError } = await supabase.functions.invoke("analyze-what-if", {
        body: {
          property_id: propertyId,
          buyer_id: buyerId,
          offer_amount: offerAmount,
        },
      });

      if (fnError) {
        console.error("[useWhatIfAnalysis] Function error:", fnError);
        throw new Error(fnError.message || "Failed to analyze offer");
      }

      if (data?.error) {
        console.error("[useWhatIfAnalysis] API error:", data.error);
        throw new Error(data.error);
      }

      const result = data as AnalysisResult;
      console.log("[useWhatIfAnalysis] Analysis received:", result.analysis.competitiveness);
      
      setAnalysis(result.analysis);
      setContext(result.context);
      return result;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze offer";
      console.error("[useWhatIfAnalysis] Error:", message);
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [buyerId]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setContext(null);
    setError(null);
  }, []);

  return {
    analysis,
    context,
    isAnalyzing,
    error,
    analyzeOffer,
    clearAnalysis,
  };
}
