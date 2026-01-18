import { useState, useCallback } from "react";
import { MLSProperty, PropertySearchFilters } from "@/types/property";

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'us-real-estate-listings.p.rapidapi.com';

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

    if (parts.length < 2) return null;

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

    if (!/^[A-Z]{2}$/.test(stateCode)) return null;

    return { city, stateCode };
  };

  const normalizeProperty = (property: any): MLSProperty => {
    const address = property.location?.address || {};
    const description = property.description || {};
    
    return {
      id: property.property_id || '',
      mlsId: property.property_id || '',
      mlsNumber: property.listing_id || '',
      
      address: address.line || '',
      city: address.city || '',
      state: address.state_code || '',
      zipCode: address.postal_code || '',
      
      price: property.list_price || 0,
      bedrooms: description.beds || 0,
      bathrooms: description.baths || 0,
      sqft: description.sqft || 0,
      lotSize: description.lot_sqft ? `${(description.lot_sqft / 43560).toFixed(2)} acres` : undefined,
      yearBuilt: description.year_built || undefined,
      
      pricePerSqft: description.sqft ? Math.round(property.list_price / description.sqft) : undefined,
      daysOnMarket: property.list_date 
        ? Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24)) 
        : undefined,
      
      propertyType: description.type || 'Unknown',
      status: property.status === 'for_sale' ? 'active' : (property.status || 'active'),
      
      description: description.text || undefined,
      features: property.tags || [],
      photos: property.photos?.map((p: any) => p.href) || [],
      
      listingUrl: property.href || '#',
      listingAgent: property.advertisers?.[0]?.name ? { name: property.advertisers[0].name } : undefined,
      
      rawData: property,
    };
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

      const queryParams = new URLSearchParams({
        city: parsedLocation.city.toLowerCase(),
        state_code: parsedLocation.stateCode.toLowerCase(),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filters.minPrice) queryParams.append('price_min', filters.minPrice.toString());
      if (filters.maxPrice) queryParams.append('price_max', filters.maxPrice.toString());
      if (filters.minBeds) queryParams.append('beds_min', filters.minBeds.toString());
      if (filters.minBaths) queryParams.append('baths_min', filters.minBaths.toString());

      console.log('Fetching from API:', `https://${RAPIDAPI_HOST}/for-sale?${queryParams}`);

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/for-sale?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': RAPIDAPI_HOST
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const listings = data.listings || [];
      
      console.log('API returned:', listings.length, 'properties');

      const newProperties = listings.map(normalizeProperty);

      if (page === 1) {
        setResults(newProperties);
      } else {
        setResults(prev => [...prev, ...newProperties]);
      }

      setTotalResults(data.totalResultCount || newProperties.length);
      setCurrentPage(page);
      setIsMockData(false);

      return {
        properties: newProperties,
        total: data.totalResultCount || newProperties.length,
        page,
        isMock: false,
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
      const response = await fetch(
        `https://${RAPIDAPI_HOST}/property?property_id=${propertyId}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': RAPIDAPI_HOST
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return normalizeProperty(data);
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
