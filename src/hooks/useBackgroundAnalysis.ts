import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

interface AnalysisStatus {
  isGenerating: boolean;
  isComplete: boolean;
  analysis: string | null;
  error: string | null;
}

export function useBackgroundAnalysis(buyerId?: string) {
  const [status, setStatus] = useState<Record<string, AnalysisStatus>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  const getKey = (propertyId: string, bId: string) => `${propertyId}-${bId}`;

  // Set up realtime subscription for the buyer
  useEffect(() => {
    if (!buyerId) return;

    console.log(`Setting up realtime subscription for buyer: ${buyerId}`);

    const channel = supabase
      .channel(`buyer-properties-${buyerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "buyer_properties",
          filter: `buyer_id=eq.${buyerId}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Check if AI analysis was just generated
          if (newData.ai_analysis && !oldData.ai_analysis) {
            const key = getKey(newData.property_id, newData.buyer_id);

            setStatus((prev) => ({
              ...prev,
              [key]: {
                isGenerating: false,
                isComplete: true,
                analysis: newData.ai_analysis,
                error: null,
              },
            }));

            toast({
              title: "Analysis Complete",
              description: "AI property analysis has been generated.",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [buyerId, toast]);

  const triggerAnalysis = useCallback(
    async (propertyId: string, targetBuyerId: string) => {
      const key = getKey(propertyId, targetBuyerId);

      // Set generating state
      setStatus((prev) => ({
        ...prev,
        [key]: { isGenerating: true, isComplete: false, analysis: null, error: null },
      }));

      try {
        console.log(`Triggering analysis for property ${propertyId}, buyer ${targetBuyerId}`);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-property-analysis`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ propertyId, buyerId: targetBuyerId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.analysis) {
          // Analysis completed via direct response
          setStatus((prev) => ({
            ...prev,
            [key]: { isGenerating: false, isComplete: true, analysis: data.analysis, error: null },
          }));

          toast({
            title: "Analysis Complete",
            description: "AI property analysis has been generated.",
          });
        }

        toast({
          title: "Generating Analysis",
          description: "AI is analyzing this property...",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to start analysis";
        setStatus((prev) => ({
          ...prev,
          [key]: { isGenerating: false, isComplete: false, analysis: null, error: message },
        }));
        toast({
          title: "Analysis Error",
          description: message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const getStatus = useCallback(
    (propertyId: string, targetBuyerId: string): AnalysisStatus => {
      const key = getKey(propertyId, targetBuyerId);
      return status[key] || { isGenerating: false, isComplete: false, analysis: null, error: null };
    },
    [status]
  );

  const clearStatus = useCallback((propertyId: string, targetBuyerId: string) => {
    const key = getKey(propertyId, targetBuyerId);
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
