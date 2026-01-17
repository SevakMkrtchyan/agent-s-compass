import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisStatus {
  isGenerating: boolean;
  isComplete: boolean;
  analysis: string | null;
  error: string | null;
}

export function useBackgroundAnalysis() {
  const [status, setStatus] = useState<Record<string, AnalysisStatus>>({});
  const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});
  const { toast } = useToast();

  const getKey = (propertyId: string, buyerId: string) => `${propertyId}-${buyerId}`;

  const triggerAnalysis = useCallback(async (propertyId: string, buyerId: string) => {
    const key = getKey(propertyId, buyerId);

    // Set generating state
    setStatus((prev) => ({
      ...prev,
      [key]: { isGenerating: true, isComplete: false, analysis: null, error: null },
    }));

    try {
      // Trigger the background function (don't await the full response)
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-property-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ propertyId, buyerId }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Analysis failed: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success && data.analysis) {
            // Analysis completed via direct response
            setStatus((prev) => ({
              ...prev,
              [key]: { isGenerating: false, isComplete: true, analysis: data.analysis, error: null },
            }));
            clearPolling(key);
            toast({
              title: "Analysis Complete",
              description: "AI property analysis has been generated.",
            });
          }
        })
        .catch((error) => {
          setStatus((prev) => ({
            ...prev,
            [key]: { isGenerating: false, isComplete: false, analysis: null, error: error.message },
          }));
          clearPolling(key);
          toast({
            title: "Analysis Failed",
            description: error.message,
            variant: "destructive",
          });
        });

      // Start polling for completion as a fallback
      startPolling(propertyId, buyerId);

      toast({
        title: "Generating Analysis",
        description: "AI is analyzing this property. This may take a moment.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start analysis";
      setStatus((prev) => ({
        ...prev,
        [key]: { isGenerating: false, isComplete: false, analysis: null, error: message },
      }));
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const startPolling = useCallback((propertyId: string, buyerId: string) => {
    const key = getKey(propertyId, buyerId);
    
    // Clear existing polling if any
    clearPolling(key);

    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 60 seconds (30 * 2s)

    pollingIntervals.current[key] = setInterval(async () => {
      attempts++;

      try {
        const { data, error } = await supabase
          .from("buyer_properties")
          .select("ai_analysis, ai_analysis_generated_at")
          .eq("property_id", propertyId)
          .eq("buyer_id", buyerId)
          .maybeSingle();

        if (error) {
          console.error("Polling error:", error);
          return;
        }

        if (data?.ai_analysis && data?.ai_analysis_generated_at) {
          // Check if the analysis was generated recently (within last 2 minutes)
          const generatedAt = new Date(data.ai_analysis_generated_at);
          const now = new Date();
          const diffMs = now.getTime() - generatedAt.getTime();

          if (diffMs < 120000) {
            // Analysis found and is recent
            setStatus((prev) => ({
              ...prev,
              [key]: { isGenerating: false, isComplete: true, analysis: data.ai_analysis, error: null },
            }));
            clearPolling(key);
            toast({
              title: "Analysis Complete",
              description: "AI property analysis has been generated.",
            });
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        clearPolling(key);
        setStatus((prev) => {
          const current = prev[key];
          if (current?.isGenerating) {
            return {
              ...prev,
              [key]: { ...current, isGenerating: false, error: "Analysis timed out" },
            };
          }
          return prev;
        });
      }
    }, 2000);
  }, [toast]);

  const clearPolling = (key: string) => {
    if (pollingIntervals.current[key]) {
      clearInterval(pollingIntervals.current[key]);
      delete pollingIntervals.current[key];
    }
  };

  const getStatus = useCallback((propertyId: string, buyerId: string): AnalysisStatus => {
    const key = getKey(propertyId, buyerId);
    return status[key] || { isGenerating: false, isComplete: false, analysis: null, error: null };
  }, [status]);

  const clearStatus = useCallback((propertyId: string, buyerId: string) => {
    const key = getKey(propertyId, buyerId);
    clearPolling(key);
    setStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[key];
      return newStatus;
    });
  }, []);

  return {
    triggerAnalysis,
    getStatus,
    clearStatus,
  };
}
