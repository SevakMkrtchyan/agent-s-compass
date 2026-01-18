import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAPIDAPI_KEY = Deno.env.get('USREALLISTINGS')
const RAPIDAPI_HOST = 'us-real-estate.p.rapidapi.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, city, state_code, limit, offset, price_min, price_max, beds_min, baths_min, property_id } = await req.json()

    console.log('Realtor search request:', { action, city, state_code, limit, offset })

    if (!RAPIDAPI_KEY) {
      throw new Error('USREALLISTINGS API key is not configured')
    }

    if (action === 'search') {
      if (!city || !state_code) {
        throw new Error('city and state_code are required')
      }

      const params = new URLSearchParams({
        city: city.toLowerCase(),
        state_code: state_code.toLowerCase(),
        limit: (limit || 20).toString(),
        offset: (offset || 0).toString(),
      })

      if (price_min) params.append('price_min', price_min.toString())
      if (price_max) params.append('price_max', price_max.toString())
      if (beds_min) params.append('beds_min', beds_min.toString())
      if (baths_min) params.append('baths_min', baths_min.toString())

      const url = `https://${RAPIDAPI_HOST}/api/v3/for-sale?${params}`
      console.log('Calling API:', url)

      const response = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Raw API response keys:', JSON.stringify(Object.keys(data)))
      
      // Handle nested structure from us-real-estate API
      const homeSearch = data?.data?.home_search || {}
      const listings = homeSearch.results || []
      const total = homeSearch.total || 0
      
      console.log('API Response:', { listingsCount: listings.length, total })

      const properties = listings.map((property: any) => {
        const address = property.location?.address || {}
        const description = property.description || {}
        
        return {
          id: property.property_id || '',
          mlsId: property.property_id || '',
          mlsNumber: property.listing_id || '',
          listingId: property.listing_id || '',
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
          daysOnMarket: property.list_date ? Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
          propertyType: description.type || 'Unknown',
          status: property.status === 'for_sale' ? 'active' : (property.status || 'active'),
          description: description.text || undefined,
          features: property.tags || [],
          photos: property.primary_photo?.href 
            ? [property.primary_photo.href, ...(property.photos?.map((p: any) => p.href) || [])]
            : property.photos?.map((p: any) => p.href) || [],
          listingUrl: property.href || '#',
          listingAgent: property.advertisers?.[0]?.name ? { name: property.advertisers[0].name } : undefined,
          rawData: property,
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          properties,
          total: total || properties.length,
          isMock: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'details') {
      if (!property_id) {
        throw new Error('property_id is required')
      }

      const response = await fetch(
        `https://${RAPIDAPI_HOST}/api/v3/property?property_id=${property_id}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
          }
        }
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const property = await response.json()
      
      return new Response(
        JSON.stringify({ success: true, property }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action. Use "search" or "details"')

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
