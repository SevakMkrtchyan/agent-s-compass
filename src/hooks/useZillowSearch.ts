import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MLSProperty, PropertySearchFilters } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  data: MLSProperty[];
  totalResults: number;
  currentPage: number;
  isMock: boolean;
}

export function useZillowSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MLSProperty[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMockData, setIsMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (filters: PropertySearchFilters, page = 1) => {
    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("zillow-search", {
        body: { searchParams: { ...filters, page } },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.isMock) {
        setIsMockData(true);
        toast({
          title: "Using demo data",
          description: data.message || "Showing sample properties for demonstration.",
          variant: "default",
        });
      } else {
        setIsMockData(false);
      }

      const properties = data?.data || [];
      setResults(properties);
      setTotalResults(data?.totalResults || properties.length);
      setCurrentPage(page);
      
      return { data: properties, totalResults: data?.totalResults, currentPage: page, isMock: data?.isMock };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      toast({
        title: "Search Error",
        description: message,
        variant: "destructive",
      });
      return { data: [], totalResults: 0, currentPage: 1, isMock: false };
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const loadMore = useCallback(async (filters: PropertySearchFilters) => {
    const nextPage = currentPage + 1;
    const result = await search(filters, nextPage);
    if (result.data.length > 0) {
      setResults(prev => [...prev, ...result.data]);
    }
    return result;
  }, [currentPage, search]);

  const fetchPropertyDetails = useCallback(async (zpidOrUrl: string) => {
    try {
      const isUrl = zpidOrUrl.startsWith("http");
      const { data, error: fnError } = await supabase.functions.invoke("zillow-search", {
        body: { 
          propertyDetails: isUrl 
            ? { url: zpidOrUrl } 
            : { zpid: zpidOrUrl } 
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Failed to fetch property");

      return data.data as MLSProperty;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch property details";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setError(null);
    setIsMockData(false);
  }, []);

  return {
    search,
    loadMore,
    fetchPropertyDetails,
    clearResults,
    results,
    totalResults,
    currentPage,
    isSearching,
    isMockData,
    error,
  };
}
