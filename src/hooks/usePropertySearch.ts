import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MLSProperty, PropertySearchFilters } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

export function usePropertySearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MLSProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (filters: PropertySearchFilters) => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("repliers-search", {
        body: { searchParams: filters },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.isMock) {
        toast({
          title: "Using demo data",
          description: "Showing sample properties for demonstration.",
          variant: "default",
        });
      }

      setResults(data?.data || []);
      return data?.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      toast({
        title: "Search Error",
        description: message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    search,
    clearResults,
    results,
    isSearching,
    error,
  };
}
