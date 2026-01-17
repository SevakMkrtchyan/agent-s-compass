import { useState, useCallback } from "react";
import { MLSProperty, BuyerProfile } from "@/types/property";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

async function fetchComparables(property: MLSProperty): Promise<MLSProperty[]> {
  try {
    const { data, error } = await supabase.functions.invoke("zillow-search", {
      body: {
        comparableParams: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zipCode,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.sqft,
          soldInLast: "6months",
        },
      },
    });

    if (error) {
      console.warn("Failed to fetch comparables:", error);
      return [];
    }

    return data?.properties || [];
  } catch (err) {
    console.warn("Error fetching comparables:", err);
    return [];
  }
}

export function usePropertyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingComps, setIsFetchingComps] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [comparables, setComparables] = useState<MLSProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAnalysis = useCallback(async (
    property: MLSProperty,
    buyerProfile: BuyerProfile,
    providedComparables?: MLSProperty[],
    onStream?: (chunk: string) => void
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis("");

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-analysis`;

    try {
      // Fetch comparables if not provided
      let comps = providedComparables || [];
      if (!comps.length) {
        setIsFetchingComps(true);
        comps = await fetchComparables(property);
        setComparables(comps);
        setIsFetchingComps(false);
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ property, buyerProfile, comparables: comps }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (resp.status === 402) {
          throw new Error("AI credits exhausted. Please add credits.");
        }
        throw new Error("Failed to generate analysis");
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullAnalysis = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullAnalysis += content;
              setAnalysis(fullAnalysis);
              onStream?.(content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      return fullAnalysis;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      toast({
        title: "Analysis Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
      setIsFetchingComps(false);
    }
  }, [toast]);

  const clearAnalysis = useCallback(() => {
    setAnalysis("");
    setComparables([]);
    setError(null);
  }, []);

  return {
    generateAnalysis,
    clearAnalysis,
    analysis,
    comparables,
    isAnalyzing,
    isFetchingComps,
    error,
  };
}
