import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MLSProperty, PropertySearchFilters } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

export type SearchState = "idle" | "loading" | "success" | "error";

export function usePropertySearch() {
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [results, setResults] = useState<MLSProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (filters: PropertySearchFilters) => {
    setSearchState("loading");
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
      setSearchState("success");
      return data?.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      setSearchState("error");
      toast({
        title: "Search Error",
        description: "Unable to search properties. Please try again.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setSearchState("idle");
  }, []);

  // Computed helpers
  const isSearching = searchState === "loading";
  const hasResults = results.length > 0;
  const isEmpty = searchState === "success" && results.length === 0;

  return {
    search,
    clearResults,
    results,
    searchState,
    isSearching,
    hasResults,
    isEmpty,
    error,
  };
}
