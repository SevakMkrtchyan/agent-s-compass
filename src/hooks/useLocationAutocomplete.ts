import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface LocationSuggestion {
  id: string;
  city: string;
  state: string;
  stateCode: string;
  displayName: string;
  fullStateName: string;
}

const STATE_CODES: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

export function useLocationAutocomplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use Nominatim API for geocoding (free, no API key required)
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('countrycodes', 'us');
      url.searchParams.set('limit', '10');
      url.searchParams.set('featuretype', 'city');

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          // Nominatim requires a User-Agent
          'User-Agent': 'PropertySearchApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      // Parse and deduplicate results
      const seen = new Set<string>();
      const parsed: LocationSuggestion[] = [];

      for (const item of data) {
        const address = item.address || {};
        const city = address.city || address.town || address.village || address.municipality || address.county;
        const state = address.state;

        if (!city || !state) continue;

        const stateCode = STATE_CODES[state];
        if (!stateCode) continue;

        const key = `${city}-${stateCode}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        parsed.push({
          id: item.place_id?.toString() || `${city}-${stateCode}`,
          city,
          state: stateCode,
          stateCode,
          displayName: `${city}, ${stateCode}`,
          fullStateName: state,
        });

        if (parsed.length >= 10) break;
      }

      setSuggestions(parsed);
    } catch (error) {
      console.error('Location autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    clearSuggestions,
  };
}
