import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAPIDAPI_KEY = Deno.env.get('USREALLISTINGS')
const RAPIDAPI_HOST = 'us-real-estate-listings.p.rapidapi.com'

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
      // Build location string from city and state
      const location = city && state_code ? `${city}, ${state_code}` : (city || state_code || '')
      
      if (!location) {
        throw new Error('Location (city/state) is required')
      }

      const params = new URLSearchParams({
        location: location,
        limit: (limit || 20).toString(),
        offset: (offset || 0).toString(),
      })

      if (price_min) params.append('price_min', price_min.toString())
      if (price_max) params.append('price_max', price_max.toString())
      if (beds_min) params.append('beds_min', beds_min.toString())
      if (baths_min) params.append('baths_min', baths_min.toString())

      const url = `https://${RAPIDAPI_HOST}/for-sale?${params}`
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
      
      // Debug logging to discover response structure
      console.log('Raw API response structure:', JSON.stringify(data).substring(0, 2000))
      console.log('API response keys:', Object.keys(data))
      if (data.data) console.log('data.data keys:', Object.keys(data.data))
      
      // Try multiple possible response structures
      const listings = data.listings 
        || data.results 
        || data.properties 
        || data.data?.listings 
        || data.data?.results 
        || data.data?.home_search?.results 
        || []

      const total = data.totalResultCount 
        || data.total 
        || data.resultCount 
        || data.count 
        || data.data?.totalResultCount 
        || data.data?.total
        || listings.length
      
      console.log('Parsed listings count:', listings.length, 'Total:', total)

      const properties = listings.map((property: any) => {
        // Try multiple address structures
        const address = property.location?.address || property.address || {}
        const description = property.description || {}
        
        // Flexible field extraction
        const propertyId = property.property_id || property.id || property.listingId || property.zpid || ''
        const listPrice = property.list_price || property.price || property.listPrice || 0
        const beds = description.beds || property.beds || property.bedrooms || 0
        const baths = description.baths || property.baths || property.bathrooms || 0
        const sqftVal = description.sqft || property.sqft || property.squareFeet || property.livingArea || 0
        
        return {
          id: propertyId,
          mlsId: propertyId,
          mlsNumber: property.listing_id || property.mlsId || '',
          listingId: property.listing_id || property.listingId || '',
          address: address.line || address.street || address.streetAddress || address.full || '',
          city: address.city || '',
          state: address.state_code || address.state || '',
          zipCode: address.postal_code || address.zip || address.zipcode || '',
          price: listPrice,
          bedrooms: beds,
          bathrooms: baths,
          sqft: sqftVal,
          lotSize: description.lot_sqft ? `${(description.lot_sqft / 43560).toFixed(2)} acres` : (property.lotSize || undefined),
          yearBuilt: description.year_built || property.yearBuilt || undefined,
          pricePerSqft: sqftVal ? Math.round(listPrice / sqftVal) : undefined,
          daysOnMarket: property.list_date ? Math.floor((Date.now() - new Date(property.list_date).getTime()) / (1000 * 60 * 60 * 24)) : (property.daysOnMarket || undefined),
          propertyType: description.type || property.propertyType || property.homeType || 'Unknown',
          status: property.status === 'for_sale' ? 'active' : (property.status || 'active'),
          description: description.text || property.description || undefined,
          features: property.tags || property.features || [],
          photos: (() => {
            const upgradeImageUrl = (url: string): string => {
              if (!url) return url;
              // First ensure HTTPS (API returns http:// which gets blocked by browsers)
              let upgraded = url.replace(/^http:\/\//i, 'https://');
              // Upgrade to higher resolution: medium -> big, small -> original detail
              return upgraded
                .replace(/-m(\d+)/g, '-b$1')  // medium to big
                .replace(/s\.jpg$/i, 'od.jpg') // small to original detail (only at end)
                .replace(/-t(\d+)/g, '-l$1'); // thumbnail to large
            };
            
            const primaryPhoto = property.primary_photo?.href 
              ? upgradeImageUrl(property.primary_photo.href) 
              : null;
            const otherPhotos = property.photos?.map((p: any) => upgradeImageUrl(p.href || p)) || [];
            
            if (primaryPhoto) {
              return [primaryPhoto, ...otherPhotos];
            }
            return otherPhotos.length > 0 ? otherPhotos : (property.images || []);
          })(),
          listingUrl: property.href || property.url || property.detailUrl || '#',
          listingAgent: property.advertisers?.[0]?.name ? { name: property.advertisers[0].name } : (property.listingAgent || undefined),
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
        `https://${RAPIDAPI_HOST}/property?property_id=${property_id}`,
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
