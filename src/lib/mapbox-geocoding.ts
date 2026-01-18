// Mapbox Geocoding API utilities - proxied through edge function

import { supabase } from "@/integrations/supabase/client";

export interface GeocodingResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  properties?: {
    address?: string;
  };
}

export interface ParsedLocation {
  fullAddress: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  zipCode?: string;
  country?: string;
}

export async function searchAddresses(
  query: string,
  options?: {
    country?: string;
    types?: string[];
    limit?: number;
    proximity?: [number, number];
  }
): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase.functions.invoke('mapbox-geocoding', {
      body: {
        query,
        country: options?.country || 'US',
        types: options?.types?.join(',') || 'address,place,postcode',
        limit: options?.limit || 5,
      },
    });

    if (error) {
      console.error('Geocoding function error:', error);
      return [];
    }

    return data?.features || [];
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export function parseLocation(result: GeocodingResult): ParsedLocation {
  const context = result.context || [];
  
  // Extract components from context
  const getContextValue = (prefix: string) => {
    const item = context.find(c => c.id.startsWith(prefix));
    return item?.text;
  };
  
  const getStateCode = () => {
    const region = context.find(c => c.id.startsWith('region'));
    if (region?.short_code) {
      // Format: "US-TX" -> "TX"
      return region.short_code.replace('US-', '');
    }
    return undefined;
  };

  return {
    fullAddress: result.place_name,
    streetAddress: result.properties?.address || result.text,
    city: getContextValue('place') || getContextValue('locality'),
    state: getContextValue('region'),
    stateCode: getStateCode(),
    zipCode: getContextValue('postcode'),
    country: getContextValue('country'),
  };
}

export function formatLocationForSearch(parsed: ParsedLocation): string {
  // Format for property search: "City, StateCode"
  if (parsed.city && parsed.stateCode) {
    return `${parsed.city}, ${parsed.stateCode}`;
  }
  if (parsed.city && parsed.state) {
    return `${parsed.city}, ${parsed.state}`;
  }
  return parsed.city || parsed.state || parsed.fullAddress;
}
