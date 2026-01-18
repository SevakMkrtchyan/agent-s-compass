import { useState, useCallback } from "react";
import { MLSProperty, PropertySearchFilters } from "@/types/property";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  properties: MLSProperty[];
  total: number;
  page: number;
  isMock: boolean;
}

export function useRealtorSearch() {
  const [results, setResults] = useState<MLSProperty[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMockData, setIsMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseLocation = (location: string): { city: string; stateCode: string } | null => {
    const stateAbbreviations: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
      'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
      'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
      'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
      'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
      'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
      'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
      'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
      'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
      'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
      'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
    };

    let parts = location.split(',').map(s => s.trim());
    
    if (parts.length < 2) {
      const spaceParts = location.trim().split(/\s+/);
      if (spaceParts.length >= 2) {
        const lastPart = spaceParts.pop()!;
        parts = [spaceParts.join(' '), lastPart];
      }
    }

    if (parts.length < 2) {
      return null;
    }

    const city = parts[0].trim();
    let stateCode = parts[1].trim().toUpperCase();

    if (stateCode.length > 2) {
      const abbr = stateAbbreviations[stateCode.toLowerCase()];
      if (abbr) {
        stateCode = abbr;
      } else {
        return null;
      }
    }

    if (!/^[A-Z]{2}$/.test(stateCode)) {
      return null;
    }

    return { city, stateCode };
  };

  const search = useCallback(async (filters: PropertySearchFilters, page: number = 1): Promise<SearchResult> => {
    setIsSearching(true);
    setError(null);

    try {
      if (!filters.location) {
        throw new Error('Please enter a location (e.g., Austin, TX)');
      }

      const parsedLocation = parseLocation(filters.location);
      if (!parsedLocation) {
        throw new Error('Please enter city and state (e.g., Austin, TX)');
      }

      const limit = 20;
      const offset = (page - 1) * limit;

      console.log("Calling realtor-search edge function:", parsedLocation);

      const { data, error: fnError } = await supabase.functions.invoke('realtor-search', {
        body: {
          action: 'search',
          city: parsedLocation.city,
          state_code: parsedLocation.stateCode,
          limit,
          offset,
          price_min: filters.minPrice,
          price_max: filters.maxPrice,
          beds_min: filters.minBeds,
          baths_min: filters.minBaths,
        },
      });

      if (fnError) {
        console.error("Edge function error:", fnError);
        throw new Error(fnError.message || 'Search failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      console.log("Edge function response:", data.properties?.length, "properties");

      const newProperties = data.properties as MLSProperty[];

      if (page === 1) {
        setResults(newProperties);
      } else {
        setResults(prev => [...prev, ...newProperties]);
      }

      setTotalResults(data.total || newProperties.length);
      setCurrentPage(page);
      setIsMockData(data.isMock || false);

      return {
        properties: newProperties,
        total: data.total || newProperties.length,
        page,
        isMock: data.isMock || false,
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      console.error("Search error:", message);
      setError(message);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  const loadMore = useCallback(async (filters: PropertySearchFilters): Promise<SearchResult> => {
    return search(filters, currentPage + 1);
  }, [search, currentPage]);

  const fetchPropertyDetails = useCallback(async (propertyId: string): Promise<MLSProperty | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtor-search', {
        body: {
          action: 'details',
          property_id: propertyId,
        },
      });

      if (fnError || !data.success) {
        console.error("Property details fetch failed:", fnError || data.error);
        return null;
      }

      return data.property as MLSProperty;
    } catch (err) {
      console.error("Property details error:", err);
      return null;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setIsMockData(false);
    setError(null);
  }, []);

  return {
    search,
    loadMore,
    fetchPropertyDetails,
    clearResults,
    results,
    totalResults,
    isSearching,
    currentPage,
    isMockData,
    error,
  };
}
