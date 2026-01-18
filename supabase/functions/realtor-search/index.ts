import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  city: string;
  state_code: string;
  limit?: number;
  offset?: number;
  price_min?: number;
  price_max?: number;
  beds_min?: number;
  baths_min?: number;
}

interface MLSProperty {
  id: string;
  mlsId?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt?: number;
  pricePerSqft?: number;
  daysOnMarket?: number;
  propertyType?: string;
  status: 'active' | 'pending' | 'sold' | 'withdrawn';
  description?: string;
  features?: string[];
  photos: string[];
  listingUrl?: string;
  mlsNumber?: string;
  listingAgent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  lotSize?: string;
  rawData?: any;
}

// Normalize US Real Estate API response to MLSProperty format
function normalizeProperty(property: any): MLSProperty | null {
  try {
    const location = property.location || {};
    const address = location.address || {};
    const description = property.description || {};
    const photos = property.photos || [];
    const primaryPhoto = property.primary_photo || {};

    // Extract status
    let status: 'active' | 'pending' | 'sold' | 'withdrawn' = 'active';
    const rawStatus = (property.status || '').toLowerCase();
    if (rawStatus.includes('pending')) status = 'pending';
    else if (rawStatus.includes('sold') || rawStatus.includes('closed')) status = 'sold';
    else if (rawStatus.includes('withdrawn') || rawStatus.includes('off')) status = 'withdrawn';

    // Extract photos - prefer photo array, fallback to primary_photo
    let photoUrls: string[] = [];
    if (photos.length > 0) {
      photoUrls = photos.map((p: any) => typeof p === 'string' ? p : p.href).filter(Boolean);
    } else if (primaryPhoto.href) {
      photoUrls = [primaryPhoto.href];
    }

    // Calculate days on market
    const listDate = property.list_date ? new Date(property.list_date) : null;
    const daysOnMarket = listDate ? 
      Math.floor((Date.now() - listDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    // Extract property type
    const propType = description.type || property.prop_type || property.property_type || 'single_family';

    const sqft = description.sqft || property.sqft || 0;
    const price = property.list_price || property.price || 0;

    // Calculate lot size in acres if provided in sqft
    const lotSqft = description.lot_sqft || property.lot_sqft;
    const lotSize = lotSqft ? `${(lotSqft / 43560).toFixed(2)} acres` : undefined;

    // Extract listing agent info
    const advertisers = property.advertisers || [];
    const listAgent = advertisers[0] || property.branding?.[0] || {};

    return {
      id: property.property_id || `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mlsId: property.property_id,
      mlsNumber: property.listing_id || property.mls_id,
      address: address.line || property.address_line || 'Unknown Address',
      city: address.city || property.city || '',
      state: address.state_code || address.state || property.state_code || '',
      zipCode: address.postal_code || property.postal_code || '',
      price,
      bedrooms: description.beds || property.beds || 0,
      bathrooms: description.baths || property.baths || 0,
      sqft,
      yearBuilt: description.year_built || property.year_built,
      pricePerSqft: sqft > 0 ? Math.round(price / sqft) : undefined,
      daysOnMarket,
      propertyType: propType,
      status,
      description: description.text || property.description_text || undefined,
      features: property.tags || [],
      photos: photoUrls,
      listingUrl: property.href || property.rdc_web_url || '#',
      listingAgent: listAgent.name ? {
        name: listAgent.name,
        phone: listAgent.phone || listAgent.phone1,
        email: listAgent.email,
      } : undefined,
      lotSize,
      rawData: property,
    };
  } catch (error) {
    console.error("Error normalizing property:", error, property);
    return null;
  }
}

async function searchProperties(params: SearchParams): Promise<{ properties: MLSProperty[]; total: number }> {
  // Try RAPIDAPI_KEY first, then fall back to REALTOR_RAPIDAPI_KEY
  const apiKey = Deno.env.get('RAPIDAPI_KEY') || Deno.env.get('REALTOR_RAPIDAPI_KEY');
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }

  const queryParams = new URLSearchParams({
    city: params.city,
    state_code: params.state_code,
    limit: String(params.limit || 20),
    offset: String(params.offset || 0),
  });

  if (params.price_min) queryParams.set('price_min', String(params.price_min));
  if (params.price_max) queryParams.set('price_max', String(params.price_max));
  if (params.beds_min) queryParams.set('beds_min', String(params.beds_min));
  if (params.baths_min) queryParams.set('baths_min', String(params.baths_min));

  // US Real Estate API - use /api/for-sale endpoint (not v2)
  const host = 'us-real-estate.p.rapidapi.com';
  const url = `https://${host}/api/for-sale?${queryParams.toString()}`;
  console.log("Searching US Real Estate API:", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("US Real Estate API error:", response.status, errorText);
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("US Real Estate Listings API response keys:", Object.keys(data));
  console.log("Full response sample:", JSON.stringify(data).substring(0, 500));
  console.log("Total results:", data.totalResultCount || data.total || data.count || 0);

  // US Real Estate Listings API returns data under 'data.results' or similar
  const rawProperties = data.data?.results || data.results || data.listings || data.properties || data.data || [];
  console.log("Raw properties count:", Array.isArray(rawProperties) ? rawProperties.length : 0);

  if (!Array.isArray(rawProperties)) {
    console.log("Raw properties structure:", typeof rawProperties, rawProperties);
    return { properties: [], total: 0 };
  }

  const properties = rawProperties
    .map(normalizeProperty)
    .filter((p: MLSProperty | null): p is MLSProperty => p !== null);

  console.log("Normalized properties count:", properties.length);

  return {
    properties,
    total: data.total || data.count || data.matching_rows || properties.length,
  };
}

async function getPropertyDetails(propertyId: string): Promise<MLSProperty | null> {
  const apiKey = Deno.env.get('RAPIDAPI_KEY') || Deno.env.get('REALTOR_RAPIDAPI_KEY');
  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY is not configured');
  }

  const host = 'us-real-estate.p.rapidapi.com';
  const url = `https://${host}/v3/property-detail?property_id=${propertyId}`;
  console.log("Fetching property details:", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("US Real Estate API detail error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  console.log("Property detail response keys:", Object.keys(data));

  const property = data.data || data.property || data.listing || data;
  return normalizeProperty(property);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log("Property search request:", action, params);

    if (action === 'search') {
      const { city, state_code, limit, offset, price_min, price_max, beds_min, baths_min } = params;

      if (!city || !state_code) {
        return new Response(
          JSON.stringify({ success: false, error: 'City and state_code are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const result = await searchProperties({
        city,
        state_code,
        limit,
        offset,
        price_min,
        price_max,
        beds_min,
        baths_min,
      });

      return new Response(
        JSON.stringify({
          success: true,
          properties: result.properties,
          total: result.total,
          isMock: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'details') {
      const { property_id } = params;

      if (!property_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'property_id is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const property = await getPropertyDetails(property_id);

      if (!property) {
        return new Response(
          JSON.stringify({ success: false, error: 'Property not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, property }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use "search" or "details".' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error("Property search error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
