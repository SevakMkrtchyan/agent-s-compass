import { useState, useCallback } from "react";
import { MLSProperty, BuyerProfile } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

export function usePropertyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAnalysis = useCallback(async (
    property: MLSProperty,
    buyerProfile: BuyerProfile,
    comparables?: MLSProperty[],
    onStream?: (chunk: string) => void
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis("");

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-analysis`;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ property, buyerProfile, comparables }),
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
    }
  }, [toast]);

  const clearAnalysis = useCallback(() => {
    setAnalysis("");
    setError(null);
  }, []);

  return {
    generateAnalysis,
    clearAnalysis,
    analysis,
    isAnalyzing,
    error,
  };
}
