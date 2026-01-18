import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('VITE_MAPBOX_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      console.error('VITE_MAPBOX_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox not configured', features: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, country = 'US', types = 'address,place,postcode', limit = 5 } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ features: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      autocomplete: 'true',
      country: country,
      types: types,
      limit: String(limit),
      language: 'en',
    });

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    
    console.log('Geocoding request for:', query);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', response.status, errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Found ${data.features?.length || 0} results for "${query}"`);
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage, features: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
