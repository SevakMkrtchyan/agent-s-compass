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
  prop_type?: string[];
  status?: string[];
  sort?: string;
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

function normalizeRealtorProperty(property: any): MLSProperty | null {
  try {
    const listing = property.listing || property;
    const location = property.location || {};
    const address = location.address || {};
    const description = property.description || {};
    const photos = property.photos || [];
    const primaryPhoto = property.primary_photo || {};
    const source = property.source || {};
    const advertisers = property.advertisers || [];
    const listAgent = advertisers.find((a: any) => a.type === 'seller')?.broker || 
                      property.branding?.[0] || {};

    // Extract status
    let status: 'active' | 'pending' | 'sold' | 'withdrawn' = 'active';
    const rawStatus = property.status?.toLowerCase() || '';
    if (rawStatus.includes('pending')) status = 'pending';
    else if (rawStatus.includes('sold') || rawStatus.includes('closed')) status = 'sold';
    else if (rawStatus.includes('withdrawn') || rawStatus.includes('off')) status = 'withdrawn';

    // Extract photos - prefer photo array, fallback to primary_photo
    let photoUrls: string[] = [];
    if (photos.length > 0) {
      photoUrls = photos.map((p: any) => p.href).filter(Boolean);
    } else if (primaryPhoto.href) {
      photoUrls = [primaryPhoto.href];
    }

    // Calculate days on market
    const listDate = property.list_date ? new Date(property.list_date) : null;
    const daysOnMarket = listDate ? 
      Math.floor((Date.now() - listDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    // Extract property type
    const propType = description.type || property.prop_type || 'single_family';
    const normalizedType = propType.toLowerCase()
      .replace('single_family', 'single_family')
      .replace('multi_family', 'multi_family')
      .replace('townhome', 'townhouse')
      .replace('apartment', 'condo');

    const sqft = description.sqft || property.sqft || 0;
    const price = property.list_price || listing.price || 0;

    return {
      id: property.property_id || `realtor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mlsId: source.id || property.mls_id || property.property_id,
      address: address.line || property.line || 'Unknown Address',
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
      propertyType: normalizedType,
      status,
      description: description.text || property.text || undefined,
      features: property.tags || [],
      photos: photoUrls,
      listingUrl: property.href || property.rdc_web_url,
      mlsNumber: source.id || property.mls_id,
      listingAgent: listAgent.name ? {
        name: listAgent.name,
        phone: listAgent.phone || listAgent.phone1,
        email: listAgent.email,
      } : undefined,
      lotSize: description.lot_sqft ? `${description.lot_sqft.toLocaleString()} sqft` : undefined,
      rawData: property,
    };
  } catch (error) {
    console.error("Error normalizing property:", error, property);
    return null;
  }
}

async function searchProperties(params: SearchParams): Promise<{ properties: MLSProperty[]; total: number }> {
  const apiKey = Deno.env.get('REALTOR_RAPIDAPI_KEY');
  if (!apiKey) {
    throw new Error('REALTOR_RAPIDAPI_KEY is not configured');
  }

  // Use lowercase city and state_code as required by the API
  const queryParams = new URLSearchParams({
    city: params.city.toLowerCase(),
    state_code: params.state_code.toLowerCase(),
    limit: String(params.limit || 20),
    offset: String(params.offset || 0),
  });

  if (params.price_min) queryParams.set('price_min', String(params.price_min));
  if (params.price_max) queryParams.set('price_max', String(params.price_max));
  if (params.beds_min) queryParams.set('beds_min', String(params.beds_min));
  if (params.baths_min) queryParams.set('baths_min', String(params.baths_min));

  // Correct endpoint: /properties/v2/list-for-sale
  const url = `https://realtor-search.p.rapidapi.com/properties/v2/list-for-sale?${queryParams.toString()}`;
  console.log("Searching Realtor API:", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'realtor-search.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Realtor API error:", response.status, errorText);
    throw new Error(`Realtor API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("Realtor API response keys:", Object.keys(data));
  console.log("Total results:", data.total || data.matching_rows || 0);

  // The API returns properties under 'results' or 'properties'
  const rawProperties = data.results || data.properties || data.listings || [];
  console.log("Raw properties count:", rawProperties.length);

  const properties = rawProperties
    .map(normalizeRealtorProperty)
    .filter((p: MLSProperty | null): p is MLSProperty => p !== null);

  console.log("Normalized properties count:", properties.length);

  return {
    properties,
    total: data.total || data.matching_rows || properties.length,
  };
}

async function getPropertyDetails(propertyId: string): Promise<MLSProperty | null> {
  const apiKey = Deno.env.get('REALTOR_RAPIDAPI_KEY');
  if (!apiKey) {
    throw new Error('REALTOR_RAPIDAPI_KEY is not configured');
  }

  const url = `https://realtor-search.p.rapidapi.com/properties/detail?property_id=${propertyId}`;
  console.log("Fetching property details:", url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'realtor-search.p.rapidapi.com',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Realtor API detail error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  console.log("Property detail response keys:", Object.keys(data));

  const property = data.property || data;
  return normalizeRealtorProperty(property);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log("Realtor search request:", action, params);

    if (action === 'search') {
      const { city, state_code, limit, offset, price_min, price_max, beds_min, baths_min, prop_type, status } = params;

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
        prop_type,
        status,
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
    console.error("Realtor search error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
