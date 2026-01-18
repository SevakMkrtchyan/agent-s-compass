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

  const normalizeProperty = (property: any): MLSProperty | null => {
    try {
      const location = property.location || {};
      const address = location.address || {};
      const description = property.description || {};
      const photos = property.photos || [];

      const propertyId = property.property_id || property.listing_id || `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Map status to valid type
      const statusMap: Record<string, 'active' | 'pending' | 'sold' | 'withdrawn'> = {
        'for_sale': 'active',
        'active': 'active',
        'pending': 'pending',
        'sold': 'sold',
        'off_market': 'withdrawn',
        'withdrawn': 'withdrawn',
      };
      const rawStatus = (property.status || 'for_sale').toLowerCase();
      const status = statusMap[rawStatus] || 'active';

      const advertiser = property.advertisers?.[0];
      const agentName = advertiser?.name || property.agent_name;

      return {
        id: propertyId,
        mlsId: propertyId,
        mlsNumber: property.listing_id || property.mls_id || undefined,

        address: address.line || address.street_address || 'Address unavailable',
        city: address.city || '',
        state: address.state_code || address.state || '',
        zipCode: address.postal_code || address.zip_code || '',

        price: property.list_price || property.price || 0,
        bedrooms: description.beds || description.bedrooms || 0,
        bathrooms: description.baths || description.bathrooms || 0,
        sqft: description.sqft || description.square_feet || 0,
        lotSize: description.lot_sqft ? `${(description.lot_sqft / 43560).toFixed(2)} acres` : undefined,
        yearBuilt: description.year_built || undefined,

        pricePerSqft: description.sqft && property.list_price
          ? Math.round(property.list_price / description.sqft)
          : undefined,
        daysOnMarket: property.list_date
          ? Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24))
          : undefined,

        propertyType: description.type || property.prop_type || 'Unknown',
        status,

        description: description.text || property.description_text || undefined,
        features: property.tags || [],
        photos: photos.map((p: any) => typeof p === 'string' ? p : p.href).filter(Boolean),

        listingUrl: property.href || property.url || '#',
        listingAgent: agentName ? { name: agentName } : undefined,

        rawData: property,
      };
    } catch (err) {
      console.error('Error normalizing property:', err, property);
      return null;
    }
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

      if (!RAPIDAPI_KEY) {
        throw new Error('RAPIDAPI_KEY is not configured');
      }

      const limit = 20;
      const offset = (page - 1) * limit;

      const queryParams = new URLSearchParams({
        city: parsedLocation.city.toLowerCase(),
        state_code: parsedLocation.stateCode.toLowerCase(),
        limit: String(limit),
        offset: String(offset),
      });

      if (filters.minPrice) queryParams.set('price_min', String(filters.minPrice));
      if (filters.maxPrice) queryParams.set('price_max', String(filters.maxPrice));
      if (filters.minBeds) queryParams.set('beds_min', String(filters.minBeds));
      if (filters.minBaths) queryParams.set('baths_min', String(filters.minBaths));

      console.log("Searching US Real Estate Listings API:", `https://${RAPIDAPI_HOST}/for-sale?${queryParams}`);

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/for-sale?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response keys:", Object.keys(data));
      console.log("Total results:", data.totalResultCount || data.total || 0);

      const rawProperties = data.listings || data.results || data.properties || [];
      console.log("Raw properties count:", rawProperties.length);

      const newProperties = rawProperties
        .map(normalizeProperty)
        .filter((p: MLSProperty | null): p is MLSProperty => p !== null);

      if (page === 1) {
        setResults(newProperties);
      } else {
        setResults(prev => [...prev, ...newProperties]);
      }

      const total = data.totalResultCount || data.total || newProperties.length;
      setTotalResults(total);
      setCurrentPage(page);
      setIsMockData(false);

      return {
        properties: newProperties,
        total,
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
      if (!RAPIDAPI_KEY) {
        console.error('RAPIDAPI_KEY is not configured');
        return null;
      }

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/property?property_id=${propertyId}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          },
        }
      );

      if (!response.ok) {
        console.error("Property details fetch failed:", response.status);
        return null;
      }

      const data = await response.json();
      const property = data.property || data.listing || data;
      return normalizeProperty(property);
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
